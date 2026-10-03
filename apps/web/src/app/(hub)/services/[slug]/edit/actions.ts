"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { canManageService, encryptSecret, specSourceSchema, updateServiceSchema } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { publishHubFile } from "@/lib/hub-manifest";

export type EditResult = { ok: boolean; message?: string };
const fail = (message: string): EditResult => ({ ok: false, message });

export async function updateService(_: EditResult, form: FormData): Promise<EditResult> {
  const actor = await requirePermission("service:edit");
  const raw = Object.fromEntries(form);
  const parsed = updateServiceSchema.safeParse({
    ...raw,
    ownerTeamId: raw.ownerTeamId || undefined,
    description: raw.description || undefined,
    tags: String(raw.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const d = parsed.data;

  const current = await prisma.service.findUnique({ where: { id: d.id }, include: { _count: { select: { specs: true } } } });
  if (!current) return fail("Serviço não encontrado.");
  if (!canManageService(actor, current)) return fail("Você só altera serviços dos seus times.");

  // RN-33: sem service:edit_any, o serviço não sai do próprio time nem vai para um time do qual a pessoa não participa.
  if (!actor.permissions.has("service:edit_any") && (!d.ownerTeamId || !actor.teamIds.includes(d.ownerTeamId)))
    return fail("Escolha um dos seus times como responsável.");

  // RN-31: slug congela depois da primeira spec publicada.
  if (d.slug !== current.slug) {
    if (current._count.specs > 0) return fail("O slug não muda depois que o serviço tem spec publicada.");
    if (await prisma.service.findUnique({ where: { slug: d.slug } })) return fail("Já existe um serviço com esse slug.");
  }

  const { id, ...data } = d;
  await prisma.service.update({ where: { id }, data: { ...data, ownerTeamId: data.ownerTeamId ?? null, description: data.description ?? null } });

  const changed = Object.fromEntries(
    (Object.keys(data) as (keyof typeof data)[])
      .filter((k) => JSON.stringify(data[k] ?? null) !== JSON.stringify((current as Record<string, unknown>)[k] ?? null))
      .map((k) => [k, { from: (current as Record<string, unknown>)[k] ?? null, to: data[k] ?? null }]),
  );
  await audit({ actorId: actor.id, action: "service.updated", targetType: "service", targetId: id, metadata: changed });
  revalidatePath(`/services/${d.slug}`);
  revalidatePath("/");
  const hub = await publishHubFile(id, actor.id);
  if (d.slug !== current.slug) redirect(`/services/${d.slug}/edit`);
  return { ok: true, message: `Alterações salvas. ${hub.note}` };
}

/** RN-32: arquivar tira do catálogo e do mapa e invalida os tokens do serviço. */
export async function setArchived(form: FormData) {
  const actor = await requirePermission("service:archive");
  const { id, archive } = z.object({ id: z.string(), archive: z.enum(["1", "0"]) }).parse(Object.fromEntries(form));
  const svc = await prisma.service.update({ where: { id }, data: { archivedAt: archive === "1" ? new Date() : null } });
  if (archive === "1") {
    await prisma.serviceToken.updateMany({ where: { serviceId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await audit({ actorId: actor.id, action: archive === "1" ? "service.archived" : "service.restored", targetType: "service", targetId: id });
  revalidatePath("/");
  revalidatePath("/admin/catalog");
  redirect(archive === "1" ? "/admin/catalog" : `/services/${svc.slug}`);
}


/** RN-120 a RN-125: de onde vem a spec deste serviço. */
export async function saveSpecSource(_: EditResult, form: FormData): Promise<EditResult> {
  const actor = await requirePermission("service:edit");
  const raw = Object.fromEntries(form);
  const parsed = specSourceSchema.safeParse({
    ...raw, specRepositoryId: raw.specRepositoryId || undefined, specPath: raw.specPath || undefined,
    pullUrl: raw.pullUrl || undefined, pullHeaders: raw.pullHeaders || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const d = parsed.data;
  const svc = await prisma.service.findUnique({ where: { id: d.serviceId } });
  if (!svc || !canManageService(actor, svc)) return fail("Você só altera serviços dos seus times.");

  if (d.specSource === "REPO_FILE" && (!d.specRepositoryId || !d.specPath)) return fail("Escolha o repositório e informe o caminho do arquivo.");
  if (d.specSource === "URL_PULL") {
    if (!d.pullUrl || !/^https?:\/\//.test(d.pullUrl)) return fail("Informe a URL (http/https). Use {env} para o ambiente.");
  }
  let headersEnc: string | null | undefined;
  if (d.pullHeaders) {
    try {
      const h = JSON.parse(d.pullHeaders);
      if (!h || typeof h !== "object" || Array.isArray(h) || Object.values(h).some((v) => typeof v !== "string")) throw new Error();
      headersEnc = encryptSecret(JSON.stringify(h));
    } catch {
      return fail('Cabeçalhos devem ser um JSON como {"Authorization": "Bearer ..."}.');
    }
  }
  await prisma.service.update({
    where: { id: svc.id },
    data: {
      specSource: d.specSource,
      specRepositoryId: d.specSource === "REPO_FILE" ? d.specRepositoryId : null,
      specPath: d.specSource === "REPO_FILE" ? d.specPath : null,
      pullUrl: d.specSource === "URL_PULL" ? d.pullUrl : null,
      ...(headersEnc !== undefined ? { pullHeadersEnc: headersEnc } : d.specSource !== "URL_PULL" ? { pullHeadersEnc: null } : {}),
      lastSyncError: null,
    },
  });
  // Nunca registrar cabeçalhos (podem ter token).
  await audit({ actorId: actor.id, action: "service.source_changed", targetType: "service", targetId: svc.id, metadata: { specSource: d.specSource } });
  revalidatePath(`/services/${svc.slug}`);
  return { ok: true, message: "Origem da spec salva." };
}
