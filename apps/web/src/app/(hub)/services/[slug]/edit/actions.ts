"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { canManageService, encryptSecret, specSourceSchema, updateServiceSchema } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { publishHubFile } from "@/lib/hub-manifest";

/** Campos da edição que podem receber uma mensagem logo abaixo deles. */
export type EditField = "name" | "slug" | "ownerTeamId" | "specRepositoryId" | "specPath" | "pullUrl" | "pullHeaders";
export type EditResult = { ok: boolean; message?: string; errors?: Partial<Record<EditField, string>> };

const fail = (message: string, field?: EditField): EditResult => ({ ok: false, message, errors: field ? { [field]: message } : undefined });

/** Primeira mensagem de cada campo que o Zod recusou, para aparecer abaixo do campo certo. */
function fieldErrors(issues: z.ZodError["issues"]): EditResult {
  const errors: Partial<Record<EditField, string>> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) errors[field as EditField] = issue.message;
  }
  return { ok: false, message: issues[0]?.message ?? "Dados inválidos.", errors };
}

/**
 * Salva os dados do serviço e a origem da spec numa única ação (achado F1 da auditoria de UX de
 * 02/10/2026: dois botões "Salvar" na mesma tela, e quem editava os dois cartões perdia um deles).
 * A origem é opcional no formulário: sem o campo `specSource` ela fica como está.
 */
export async function updateService(_: EditResult, form: FormData): Promise<EditResult> {
  const actor = await requirePermission("service:edit");
  const raw = Object.fromEntries(form);
  const parsed = updateServiceSchema.safeParse({
    ...raw,
    ownerTeamId: raw.ownerTeamId || undefined,
    description: raw.description || undefined,
    tags: String(raw.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
  });
  if (!parsed.success) return fieldErrors(parsed.error.issues);
  const d = parsed.data;

  const source = raw.specSource === undefined ? null : specSourceSchema.safeParse({
    ...raw, serviceId: d.id, specRepositoryId: raw.specRepositoryId || undefined, specPath: raw.specPath || undefined,
    pullUrl: raw.pullUrl || undefined, pullHeaders: raw.pullHeaders || undefined,
  });
  if (source && !source.success) return fieldErrors(source.error.issues);

  const current = await prisma.service.findUnique({ where: { id: d.id }, include: { _count: { select: { specs: true } } } });
  if (!current) return fail("Serviço não encontrado.");
  if (!canManageService(actor, current)) return fail("Você só altera serviços dos seus times.");

  // RN-33: sem service:edit_any, o serviço não sai do próprio time nem vai para um time do qual a pessoa não participa.
  if (!actor.permissions.has("service:edit_any") && (!d.ownerTeamId || !actor.teamIds.includes(d.ownerTeamId)))
    return fail("Escolha um dos seus times como responsável.", "ownerTeamId");

  // RN-31: slug congela depois da primeira spec publicada.
  if (d.slug !== current.slug) {
    if (current._count.specs > 0) return fail("O endereço (slug) não muda depois que o serviço tem spec publicada.", "slug");
    if (await prisma.service.findUnique({ where: { slug: d.slug } })) return fail("Já existe um serviço com esse endereço. Escolha outro.", "slug");
  }

  // RN-120 a RN-125: de onde vem a spec deste serviço.
  let sourceData: {
    specSource: "CI_PUSH" | "REPO_FILE" | "URL_PULL" | "MANUAL_UPLOAD";
    specRepositoryId: string | null; specPath: string | null; pullUrl: string | null; pullHeadersEnc?: string | null; lastSyncError: null;
  } | null = null;
  let sourceChanged = false;
  if (source?.success) {
    const s = source.data;
    if (s.specSource === "REPO_FILE" && !s.specRepositoryId) return fail("Escolha o repositório onde está o arquivo.", "specRepositoryId");
    if (s.specSource === "REPO_FILE" && !s.specPath) return fail("Informe o caminho do arquivo no repositório, como openapi.yaml.", "specPath");
    if (s.specSource === "URL_PULL" && (!s.pullUrl || !/^https?:\/\//.test(s.pullUrl))) return fail("Informe a URL começando com http:// ou https://. Use {env} para o ambiente.", "pullUrl");
    let headersEnc: string | null | undefined;
    if (s.pullHeaders) {
      try {
        const h = JSON.parse(s.pullHeaders);
        if (!h || typeof h !== "object" || Array.isArray(h) || Object.values(h).some((v) => typeof v !== "string")) throw new Error();
        headersEnc = encryptSecret(JSON.stringify(h));
      } catch {
        return fail('Os cabeçalhos devem ser um JSON como {"Authorization": "Bearer ..."}.', "pullHeaders");
      }
    }
    sourceData = {
      specSource: s.specSource,
      specRepositoryId: s.specSource === "REPO_FILE" ? s.specRepositoryId ?? null : null,
      specPath: s.specSource === "REPO_FILE" ? s.specPath ?? null : null,
      pullUrl: s.specSource === "URL_PULL" ? s.pullUrl ?? null : null,
      ...(headersEnc !== undefined ? { pullHeadersEnc: headersEnc } : s.specSource !== "URL_PULL" ? { pullHeadersEnc: null } : {}),
      lastSyncError: null,
    };
    sourceChanged =
      sourceData.specSource !== current.specSource ||
      sourceData.specRepositoryId !== current.specRepositoryId ||
      sourceData.specPath !== current.specPath ||
      sourceData.pullUrl !== current.pullUrl ||
      (sourceData.pullHeadersEnc !== undefined && sourceData.pullHeadersEnc !== current.pullHeadersEnc);
  }

  const { id, ...data } = d;
  // Uma só escrita: dados e origem entram juntos ou nenhum dos dois.
  await prisma.service.update({
    where: { id },
    data: { ...data, ownerTeamId: data.ownerTeamId ?? null, description: data.description ?? null, ...(sourceChanged && sourceData ? sourceData : {}) },
  });

  const changed = Object.fromEntries(
    (Object.keys(data) as (keyof typeof data)[])
      .filter((k) => JSON.stringify(data[k] ?? null) !== JSON.stringify((current as Record<string, unknown>)[k] ?? null))
      .map((k) => [k, { from: (current as Record<string, unknown>)[k] ?? null, to: data[k] ?? null }]),
  );
  if (Object.keys(changed).length > 0) await audit({ actorId: actor.id, action: "service.updated", targetType: "service", targetId: id, metadata: changed });
  // Nunca registrar cabeçalhos (podem ter token): só a origem escolhida.
  if (sourceChanged && sourceData) await audit({ actorId: actor.id, action: "service.source_changed", targetType: "service", targetId: id, metadata: { specSource: sourceData.specSource } });
  revalidatePath(`/services/${d.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/services");
  const hub = await publishHubFile(id, actor.id);
  if (d.slug !== current.slug) redirect(`/services/${d.slug}/edit`);
  return { ok: true, message: `Alterações salvas. ${hub.note}`.trim() };
}

/**
 * RN-32: arquivar tira do catálogo e do mapa e invalida os tokens do serviço. É reversível (restaurar
 * devolve o serviço, mas os tokens revogados continuam revogados), por isso a tela pede só uma confirmação simples.
 * Achado F3 da auditoria de UX de 02/10/2026: depois de arquivar, a pessoa vai para a lista de Serviços, não para o catálogo antigo.
 */
export async function setArchived(form: FormData): Promise<EditResult | void> {
  const actor = await requirePermission("service:archive");
  const { id, archive } = z.object({ id: z.string(), archive: z.enum(["1", "0"]) }).parse(Object.fromEntries(form));
  const current = await prisma.service.findUniqueOrThrow({ where: { id } });
  // Escopo: a permissão de arquivar não vale para serviço de outro time (a menos que a pessoa edite qualquer serviço).
  if (!canManageService(actor, current, "service:archive")) return fail("Você só arquiva serviços dos seus times.");
  const svc = await prisma.service.update({ where: { id }, data: { archivedAt: archive === "1" ? new Date() : null } });
  if (archive === "1") {
    await prisma.serviceToken.updateMany({ where: { serviceId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await audit({ actorId: actor.id, action: archive === "1" ? "service.archived" : "service.restored", targetType: "service", targetId: id });
  revalidatePath("/");
  revalidatePath("/graph");
  revalidatePath("/admin/services");
  revalidatePath(`/services/${svc.slug}`);
  redirect(archive === "1" ? "/admin/services" : `/services/${svc.slug}`);
}
