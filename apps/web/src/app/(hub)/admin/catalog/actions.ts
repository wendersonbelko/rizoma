"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, type Prisma } from "@api-hub/db";
import {
  SOURCE_META, canManageService, createServiceSchema, decryptSecret, fetchRepository, generateServiceToken, isSelfLink, linkSchema, repoWebUrl,
  type SourceProvider,
} from "@api-hub/core";
import { requirePermission, type CurrentUser } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { getGithubToken } from "@/lib/github-token";
import { publishHubFile } from "@/lib/hub-manifest";
import { syncRepository } from "@/lib/repo-sync";

export type ActionResult = {
  ok: boolean;
  message?: string;
  token?: string;
  /** id/slug do registro criado (createService, addRepository) — usado pelo wizard de novo serviço. */
  id?: string;
  slug?: string;
  fieldErrors?: Partial<Record<"name" | "slug" | "ownerTeamId", string>>;
};
const fail = (message: string, fieldErrors?: ActionResult["fieldErrors"]): ActionResult => ({ ok: false, message, fieldErrors });

async function assertServiceAccess(actor: CurrentUser, serviceId: string) {
  const svc = await prisma.service.findUniqueOrThrow({ where: { id: serviceId }, select: { ownerTeamId: true } });
  if (!canManageService(actor, svc)) throw new Error("Você só altera serviços dos seus times.");
}

export async function createService(_: ActionResult, form: FormData): Promise<ActionResult> {
  const actor = await requirePermission("service:create");
  const raw = Object.fromEntries(form);
  const parsed = createServiceSchema.safeParse({
    ...raw,
    ownerTeamId: raw.ownerTeamId || undefined,
    tags: String(raw.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
  });
  if (!parsed.success) {
    const fieldErrors: ActionResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if ((field === "name" || field === "slug") && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return fail("Corrija os campos destacados.", fieldErrors);
  }
  // RN-22: sem service:edit_any, só cria serviço para um time do qual participa.
  if (!actor.permissions.has("service:edit_any") && (!parsed.data.ownerTeamId || !actor.teamIds.includes(parsed.data.ownerTeamId)))
    return fail("Escolha um dos seus times como responsável.", { ownerTeamId: "Escolha um dos seus times como responsável." });
  if (await prisma.service.findUnique({ where: { slug: parsed.data.slug } }))
    return fail("Já existe um serviço com esse slug.", { slug: "Já existe um serviço com esse slug." });

  const svc = await prisma.service.create({ data: parsed.data });
  await audit({ actorId: actor.id, action: "service.created", targetType: "service", targetId: svc.id });
  revalidatePath("/admin/catalog");
  return { ok: true, message: `Serviço ${svc.name} criado.`, id: svc.id, slug: svc.slug };
}

const repoNameSchema = z.string().trim().regex(/^[\w.-]+(\/[\w.-]+)+$/, "Use grupo/repositório (GitLab aceita subgrupos).").max(200);

async function lookupRepo(provider: SourceProvider, fullName: string, actorId: string) {
  const integration = await prisma.sourceIntegration.findUnique({ where: { type: provider } });
  const token = integration?.tokenEnc ? decryptSecret(integration.tokenEnc) : provider === "GITHUB" ? await getGithubToken(actorId) : null;
  if (provider === "GITHUB") {
    if (!token) return { error: "Sem token do GitHub: configure a integração em Configurações → Repositórios." };
    const r = await fetchRepository(token, fullName);
    return r ? { externalId: String(r.id), fullName: r.full_name, url: r.html_url, defaultBranch: r.default_branch, description: r.description } : { error: "Repositório não encontrado ou sem acesso." };
  }
  const base = (integration?.baseUrl || SOURCE_META[provider].defaultBaseUrl || "").replace(/\/+$/, "");
  const url = provider === "GITLAB" ? `${base}/api/v4/projects/${encodeURIComponent(fullName)}` : `${base}/2.0/repositories/${fullName}`;
  const headers: Record<string, string> = token ? (provider === "GITLAB" ? { "PRIVATE-TOKEN": token } : { Authorization: `Bearer ${token}` }) : {};
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) return { error: `${SOURCE_META[provider].label} respondeu ${res.status}: repositório não encontrado ou sem acesso.` };
    const j = (await res.json()) as {
      id?: unknown; uuid?: unknown; path_with_namespace?: unknown; web_url?: unknown;
      default_branch?: unknown; description?: unknown; full_name?: unknown; mainbranch?: { name?: string };
    };
    return provider === "GITLAB"
      ? { externalId: String(j.id), fullName: j.path_with_namespace as string, url: j.web_url as string, defaultBranch: (j.default_branch as string) ?? "main", description: (j.description as string) ?? null }
      : { externalId: String(j.uuid), fullName: j.full_name as string, url: repoWebUrl("BITBUCKET", null, j.full_name as string), defaultBranch: j.mainbranch?.name ?? "main", description: (j.description as string) || null };
  } catch {
    return { error: `Não consegui falar com ${SOURCE_META[provider].label}.` };
  }
}

/** RN-50/RN-121: repositório do GitHub, GitLab ou Bitbucket só entra se o token enxergar; "outro" entra com URL. */
export async function addRepository(_: ActionResult, form: FormData): Promise<ActionResult> {
  const actor = await requirePermission("link:edit");
  const provider = z.enum(["GITHUB", "GITLAB", "BITBUCKET", "GENERIC"]).catch("GITHUB").parse(form.get("provider"));
  const parsed = repoNameSchema.safeParse(form.get("fullName"));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Nome inválido.");

  let repo: { externalId: string | null; fullName: string; url: string; defaultBranch: string; description: string | null };
  if (provider === "GENERIC") {
    const url = z.url().safeParse(form.get("url"));
    if (!url.success) return fail("Informe a URL do repositório.");
    repo = { externalId: null, fullName: parsed.data, url: url.data, defaultBranch: String(form.get("defaultBranch") || "main"), description: null };
  } else {
    const found = await lookupRepo(provider, parsed.data, actor.id);
    if ("error" in found) return fail(found.error!);
    repo = found;
  }

  const saved = await prisma.repository.upsert({
    where: { fullName: repo.fullName },
    create: { provider, ...repo },
    update: { provider, url: repo.url, defaultBranch: repo.defaultBranch, description: repo.description, externalId: repo.externalId },
  });
  await audit({ actorId: actor.id, action: "repository.added", metadata: { fullName: repo.fullName, provider } });
  revalidatePath("/admin/catalog");
  return { ok: true, message: `${repo.fullName} adicionado.`, id: saved.id, slug: saved.fullName };
}

export async function createLink(_: ActionResult, form: FormData): Promise<ActionResult> {
  const actor = await requirePermission("link:edit");
  const raw = Object.fromEntries(form);
  if (!raw.protocol) delete raw.protocol;
  const parsed = linkSchema.safeParse(raw);
  if (!parsed.success) return fail("Vínculo inválido.");
  const l = parsed.data;
  if (isSelfLink(l)) return fail("Um item não pode ser ligado a ele mesmo.");

  try {
    if (l.type === "service") {
      await assertServiceAccess(actor, l.fromId);
      await prisma.serviceDependency.create({ data: { fromServiceId: l.fromId, toServiceId: l.toId, kind: l.kind, protocol: l.protocol, note: l.note, createdById: actor.id } });
    } else if (l.type === "repository") {
      await prisma.repositoryLink.create({ data: { fromRepoId: l.fromId, toRepoId: l.toId, kind: l.kind, note: l.note, createdById: actor.id } });
    } else {
      await assertServiceAccess(actor, l.serviceId);
      await prisma.serviceRepository.create({ data: { serviceId: l.serviceId, repositoryId: l.repositoryId, role: l.role } });
    }
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return fail("Esse vínculo já existe.");
    return fail((e as Error).message);
  }
  // Nomes legíveis para a auditoria ("Vínculo criado: Pedidos API → Estoque API" em vez de só ids).
  const names: Record<string, string | undefined> = {};
  if (l.type === "service") {
    const [from, to] = await Promise.all([prisma.service.findUnique({ where: { id: l.fromId }, select: { name: true } }), prisma.service.findUnique({ where: { id: l.toId }, select: { name: true } })]);
    names.fromName = from?.name;
    names.toName = to?.name;
  } else if (l.type === "repository") {
    const [from, to] = await Promise.all([prisma.repository.findUnique({ where: { id: l.fromId }, select: { fullName: true } }), prisma.repository.findUnique({ where: { id: l.toId }, select: { fullName: true } })]);
    names.fromName = from?.fullName;
    names.toName = to?.fullName;
  } else {
    const [svc, repo] = await Promise.all([prisma.service.findUnique({ where: { id: l.serviceId }, select: { name: true } }), prisma.repository.findUnique({ where: { id: l.repositoryId }, select: { fullName: true } })]);
    names.fromName = svc?.name;
    names.toName = repo?.fullName;
  }
  await audit({ actorId: actor.id, action: "link.created", metadata: { ...l, ...names } });
  revalidatePath("/admin/catalog");
  revalidatePath("/graph");
  if (l.type === "service-repository" && l.role === "SOURCE") {
    const synced = await syncRepository(l.serviceId, actor.id);
    return { ok: true, message: `Vínculo criado. ${synced.message}` };
  }
  if (l.type === "service") {
    const hub = await publishHubFile(l.fromId, actor.id);
    return { ok: true, message: `Vínculo criado. ${hub.note}` };
  }
  return { ok: true, message: "Vínculo criado." };
}

export async function deleteLink(form: FormData) {
  const actor = await requirePermission("link:edit");
  const { type, id } = z.object({ type: z.enum(["service", "repository"]), id: z.string() }).parse(Object.fromEntries(form));
  // Nomes legíveis capturados ANTES de apagar, para a auditoria mostrar uma frase de verdade
  // ("Vínculo removido: Pedidos API → Estoque API") em vez de só o id do registro.
  let metadata: Prisma.InputJsonValue;
  if (type === "service") {
    const dep = await prisma.serviceDependency.findUniqueOrThrow({ where: { id }, include: { from: { select: { name: true } }, to: { select: { name: true } } } });
    await assertServiceAccess(actor, dep.fromServiceId);
    metadata = { type, id, fromName: dep.from.name, toName: dep.to.name, kind: dep.kind };
    await prisma.serviceDependency.delete({ where: { id } });
    await publishHubFile(dep.fromServiceId, actor.id);
  } else {
    const link = await prisma.repositoryLink.findUniqueOrThrow({ where: { id }, include: { from: { select: { fullName: true } }, to: { select: { fullName: true } } } });
    metadata = { type, id, fromName: link.from.fullName, toName: link.to.fullName, kind: link.kind };
    await prisma.repositoryLink.delete({ where: { id } });
  }
  await audit({ actorId: actor.id, action: "link.deleted", metadata });
  revalidatePath("/admin/catalog");
}

/** RN-43 a RN-45: token exibido uma única vez; no banco só o hash. */
export async function createToken(_: ActionResult, form: FormData): Promise<ActionResult> {
  const actor = await requirePermission("token:manage");
  const p = z.object({ serviceId: z.string(), name: z.string().trim().min(2).max(60), days: z.coerce.number().int().min(1).max(365) }).safeParse(Object.fromEntries(form));
  if (!p.success) return fail("Informe serviço, nome e validade.");
  await assertServiceAccess(actor, p.data.serviceId);

  const t = generateServiceToken();
  await prisma.serviceToken.create({
    data: { serviceId: p.data.serviceId, name: p.data.name, prefix: t.prefix, hash: t.hash, createdById: actor.id, expiresAt: new Date(Date.now() + p.data.days * 86_400_000) },
  });
  await audit({ actorId: actor.id, action: "token.created", targetType: "service", targetId: p.data.serviceId, metadata: { prefix: t.prefix } });
  revalidatePath("/admin/catalog");
  return { ok: true, token: t.token, message: "Copie agora. Este token não aparece de novo." };
}

export async function revokeToken(form: FormData) {
  const actor = await requirePermission("token:manage");
  const id = z.string().parse(form.get("id"));
  const tok = await prisma.serviceToken.findUniqueOrThrow({ where: { id } });
  await assertServiceAccess(actor, tok.serviceId);
  await prisma.serviceToken.update({ where: { id }, data: { revokedAt: new Date() } });
  await audit({ actorId: actor.id, action: "token.revoked", metadata: { prefix: tok.prefix } });
  revalidatePath("/admin/catalog");
}
