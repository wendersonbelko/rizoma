"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import {
  SpecError, canManageService, CHANNEL_PROTOCOLS, countLabel, decryptSecret, docSchema, encryptSecret, envVarSchema, looksSecret, RELATIONS_BY_KIND, serviceResourceSchema, slugify,
  type Permission,
} from "@api-hub/core";
import { requirePermission, type CurrentUser } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { storeSpec } from "@/lib/specs-store";
import { syncService } from "@/lib/sources";
import { publishHubFile } from "@/lib/hub-manifest";
import { publishServiceDoc, resolveRepoConflict, syncRepository } from "@/lib/repo-sync";

/** `keepOpen`: deu certo, mas nada mudou na lista; o modal fica aberto para a pessoa ler o aviso. */
export type Result = { ok: boolean; message?: string; value?: string; keepOpen?: boolean };
const fail = (message: string): Result => ({ ok: false, message });

/**
 * Select obrigatório com placeholder (achado M3 da auditoria de UX de 02/10/2026): enquanto a pessoa não
 * escolhe, o navegador não envia o campo e `formData.get()` vem `null`. O Zod aceita a ausência e responde
 * com a instrução de como corrigir, em vez do "expected string" padrão.
 */
const choose = (message: string) => z.string({ error: message }).min(1, message);

async function serviceFor(actor: CurrentUser, serviceId: string, perm: Permission) {
  const svc = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!svc || svc.archivedAt) throw new Error("Serviço não encontrado.");
  if (!canManageService(actor, svc, perm)) throw new Error("Você só altera serviços dos seus times.");
  return svc;
}

// ─── Variáveis de ambiente (RN-82 a RN-88) ──────────────────────────────

export async function saveEnvVar(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("envvars:edit");
  const raw = Object.fromEntries(form);
  const parsed = envVarSchema.safeParse({ ...raw, isSecret: raw.isSecret === "on", description: raw.description || undefined });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const d = parsed.data;
  const svc = await serviceFor(actor, d.serviceId, "envvars:edit");
  const existing = await prisma.serviceEnvVar.findUnique({ where: { serviceId_environmentId_key: { serviceId: d.serviceId, environmentId: d.environmentId, key: d.key } } });

  // RN-84: segredo em branco ao editar mantém o valor atual.
  const keepSecret = d.isSecret && d.value === "" && existing?.isSecret && existing.valueEnc;
  // RN-83: nome com cara de segredo não pode ser salvo aberto sem confirmação.
  if (!d.isSecret && looksSecret(d.key) && raw.confirmPlain !== "on") return fail(`${d.key} parece um segredo. Marque "segredo" ou confirme que pode ficar visível.`);

  const data = {
    isSecret: d.isSecret,
    description: d.description ?? null,
    updatedById: actor.id,
    // Segredo vazio fica sem valor cifrado (null), não um texto cifrado vazio.
    ...(keepSecret ? {} : d.isSecret ? { valueEnc: d.value ? encryptSecret(d.value) : null, value: null } : { value: d.value, valueEnc: null }),
  };
  await prisma.serviceEnvVar.upsert({
    where: { serviceId_environmentId_key: { serviceId: d.serviceId, environmentId: d.environmentId, key: d.key } },
    create: { serviceId: d.serviceId, environmentId: d.environmentId, key: d.key, ...data },
    update: data,
  });
  const env = await prisma.environment.findUniqueOrThrow({ where: { id: d.environmentId } });
  // Nunca registrar o valor na auditoria.
  await audit({ actorId: actor.id, action: existing ? "envvar.updated" : "envvar.created", targetType: "service", targetId: svc.id, metadata: { key: d.key, env: env.slug, isSecret: d.isSecret } });
  revalidatePath(`/services/${svc.slug}`);
  return { ok: true, message: `${d.key} salva em ${env.name}.` };
}

export async function deleteEnvVar(form: FormData) {
  const actor = await requirePermission("envvars:edit");
  const id = z.string().parse(form.get("id"));
  const v = await prisma.serviceEnvVar.findUniqueOrThrow({ where: { id }, include: { environment: true } });
  const svc = await serviceFor(actor, v.serviceId, "envvars:edit");
  await prisma.serviceEnvVar.delete({ where: { id } });
  await audit({ actorId: actor.id, action: "envvar.deleted", targetType: "service", targetId: svc.id, metadata: { key: v.key, env: v.environment.slug } });
  revalidatePath(`/services/${svc.slug}`);
}

/** RN-85: revelar segredo exige permissão, é por variável e fica na auditoria. */
export async function revealEnvVar(id: string): Promise<Result> {
  const actor = await requirePermission("envvars:reveal");
  const v = await prisma.serviceEnvVar.findUnique({ where: { id }, include: { environment: true } });
  if (!v) return fail("Variável não encontrada.");
  const svc = await prisma.service.findUniqueOrThrow({ where: { id: v.serviceId } });
  if (!canManageService(actor, svc, "envvars:reveal")) return fail("Só quem é do time do serviço pode revelar segredos.");
  if (!v.isSecret || !v.valueEnc) return { ok: true, value: v.value ?? "" };
  await audit({ actorId: actor.id, action: "envvar.revealed", targetType: "service", targetId: svc.id, metadata: { key: v.key, env: v.environment.slug } });
  return { ok: true, value: decryptSecret(v.valueEnc) };
}

/** RN-87: copiar chaves de um ambiente para outro; segredos vão vazios, valores existentes não são sobrescritos. */
export async function copyEnvVars(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("envvars:edit");
  const parsed = z.object({ serviceId: z.string(), fromEnvId: choose("Escolha o ambiente de onde copiar."), toEnvId: z.string() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const { serviceId, fromEnvId, toEnvId } = parsed.data;
  if (fromEnvId === toEnvId) return fail("Escolha um ambiente diferente do que recebe as chaves.");
  const svc = await serviceFor(actor, serviceId, "envvars:edit");
  const [source, target] = await Promise.all([
    prisma.serviceEnvVar.findMany({ where: { serviceId, environmentId: fromEnvId } }),
    prisma.serviceEnvVar.findMany({ where: { serviceId, environmentId: toEnvId }, select: { key: true } }),
  ]);
  const existing = new Set(target.map((t) => t.key));
  const toCreate = source.filter((s) => !existing.has(s.key));
  await prisma.serviceEnvVar.createMany({
    data: toCreate.map((s) => ({
      serviceId, environmentId: toEnvId, key: s.key, isSecret: s.isSecret, description: s.description, updatedById: actor.id,
      value: s.isSecret ? null : s.value, valueEnc: null,
    })),
  });
  await audit({ actorId: actor.id, action: "envvar.copied", targetType: "service", targetId: serviceId, metadata: { count: toCreate.length, fromEnvId, toEnvId } });
  revalidatePath(`/services/${svc.slug}`);
  if (!toCreate.length) return { ok: true, keepOpen: true, message: "Nada para copiar: todas as chaves já existem." };
  return { ok: true, message: `${countLabel(toCreate.length, "variável copiada", "variáveis copiadas")}. Preencha os segredos no ambiente de destino.` };
}

// ─── Regras de negócio em Markdown (RN-75 a RN-78) ──────────────────────

const docSlug = (title: string) => slugify(title, 60) || "pagina";

export async function saveDoc(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("docs:edit");
  const parsed = docSchema.safeParse({ ...Object.fromEntries(form), id: form.get("id") || undefined });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const d = parsed.data;
  const svc = await serviceFor(actor, d.serviceId, "docs:edit");
  let slug: string;
  if (d.id) {
    const doc = await prisma.serviceDoc.update({ where: { id: d.id, serviceId: svc.id }, data: { title: d.title, content: d.content, updatedById: actor.id } });
    slug = doc.slug;
  } else {
    slug = docSlug(d.title);
    let n = 1;
    while (await prisma.serviceDoc.findUnique({ where: { serviceId_slug: { serviceId: svc.id, slug } } })) slug = `${docSlug(d.title)}-${++n}`;
    const count = await prisma.serviceDoc.count({ where: { serviceId: svc.id } });
    await prisma.serviceDoc.create({ data: { serviceId: svc.id, title: d.title, content: d.content, slug, position: count, updatedById: actor.id } });
  }
  await audit({ actorId: actor.id, action: d.id ? "doc.updated" : "doc.created", targetType: "service", targetId: svc.id, metadata: { doc: slug, title: d.title } });
  const note = await publishServiceDoc(svc.id, actor.id, slug, d.content);
  revalidatePath(`/services/${svc.slug}`);
  return { ok: true, message: note ? `Documento salvo. ${note}` : "Documento salvo.", value: slug };
}

/**
 * Excluir uma página de regras é irreversível (o texto foi escrito à mão): a tela pede o título
 * (DangerAction com confirmText) e o servidor confere de novo, porque a tela sozinha não autoriza nada.
 */
export async function deleteDoc(form: FormData): Promise<Result> {
  const actor = await requirePermission("docs:edit");
  const id = z.string().parse(form.get("id"));
  const doc = await prisma.serviceDoc.findUniqueOrThrow({ where: { id } });
  const svc = await serviceFor(actor, doc.serviceId, "docs:edit");
  if (String(form.get("confirm") ?? "") !== doc.title) return fail("Digite o título da página exatamente como está para confirmar.");
  await prisma.serviceDoc.delete({ where: { id } });
  await audit({ actorId: actor.id, action: "doc.deleted", targetType: "service", targetId: svc.id, metadata: { doc: doc.slug } });
  await publishServiceDoc(svc.id, actor.id, doc.slug, null);
  revalidatePath(`/services/${svc.slug}`);
  return { ok: true };
}

// ─── Integrações externas (RN-80, RN-81) ────────────────────────────────

const linkResourceSchema = serviceResourceSchema.extend({
  resourceId: choose("Escolha a integração."),
  relation: z.enum(serviceResourceSchema.shape.relation.options, { error: "Escolha como este serviço usa a integração." }),
});

export async function linkResource(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("service:edit");
  const parsed = linkResourceSchema.safeParse({ ...Object.fromEntries(form), note: form.get("note") || undefined });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const svc = await serviceFor(actor, parsed.data.serviceId, "service:edit");
  try {
    await prisma.serviceResource.create({ data: { ...parsed.data, createdById: actor.id } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return fail("Essa integração já está ligada a este serviço com essa relação.");
    throw e;
  }
  await audit({ actorId: actor.id, action: "integration.linked", targetType: "service", targetId: svc.id, metadata: { resourceId: parsed.data.resourceId, relation: parsed.data.relation } });
  revalidatePath(`/services/${svc.slug}`);
  revalidatePath("/graph");
  const hub = await publishHubFile(svc.id, actor.id);
  return { ok: true, message: `Integração ligada. ${hub.note}` };
}

export async function unlinkResource(form: FormData) {
  const actor = await requirePermission("service:edit");
  const id = z.string().parse(form.get("id"));
  const link = await prisma.serviceResource.findUniqueOrThrow({ where: { id } });
  const svc = await serviceFor(actor, link.serviceId, "service:edit");
  await prisma.serviceResource.delete({ where: { id } });
  await audit({ actorId: actor.id, action: "integration.unlinked", targetType: "service", targetId: svc.id, metadata: { resourceId: link.resourceId } });
  await publishHubFile(svc.id, actor.id);
  revalidatePath(`/services/${svc.slug}`);
}

// ─── Spec: importação manual e sincronização (RN-123 a RN-126) ─────────

export async function uploadSpec(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("spec:publish");
  const { serviceId, environmentId } = z.object({ serviceId: z.string(), environmentId: z.string() }).parse(Object.fromEntries(form));
  const svc = await serviceFor(actor, serviceId, "spec:publish");
  const file = form.get("file");
  let raw = String(form.get("content") ?? "");
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return fail("Arquivo maior que 5 MB.");
    raw = await file.text();
  }
  if (!raw.trim()) return fail("Escolha um arquivo .json/.yaml ou cole o conteúdo.");
  try {
    const r = await storeSpec({ serviceId, environmentId, raw, source: "MANUAL_UPLOAD" });
    const env = await prisma.environment.findUniqueOrThrow({ where: { id: environmentId } });
    await audit({ actorId: actor.id, action: "spec.uploaded", targetType: "service", targetId: serviceId, metadata: { env: env.slug, version: r.version, status: r.status } });
    revalidatePath(`/services/${svc.slug}`);
    return r.status === "unchanged"
      ? { ok: true, keepOpen: true, message: `Essa spec já existia (v${r.version}). Nada foi publicado.` }
      : { ok: true, message: `Versão ${r.version} publicada em ${env.name}.` };
  } catch (e) {
    return fail(e instanceof SpecError ? e.message : "Spec inválida.");
  }
}

export async function syncRepositoryNow(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("service:edit");
  const svc = await serviceFor(actor, z.string().parse(form.get("serviceId")), "service:edit");
  const synced = await syncRepository(svc.id, actor.id);
  revalidatePath(`/services/${svc.slug}`);
  return { ok: synced.conflicts === 0, message: synced.message };
}

export async function resolveRepoConflictAction(form: FormData): Promise<void> {
  const actor = await requirePermission("service:edit");
  const serviceId = z.string().parse(form.get("serviceId"));
  const svc = await serviceFor(actor, serviceId, "service:edit");
  const field = z.enum(["description", "tags", "readme", "spec", "hub", "doc"]).parse(form.get("field"));
  const path = z.string().parse(form.get("path"));
  const side = z.enum(["hub", "git"]).parse(form.get("side"));
  await resolveRepoConflict(svc.id, actor.id, field, path, side);
  revalidatePath(`/services/${svc.slug}`);
}

export async function syncNow(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("spec:publish");
  const svc = await serviceFor(actor, z.string().parse(form.get("serviceId")), "spec:publish");
  const results = await syncService(svc.id, actor.id);
  revalidatePath(`/services/${svc.slug}`);
  const errors = results.filter((r) => r.status === "error");
  const ok = results.filter((r) => r.status !== "error").map((r) => `${r.env} ${r.version}`);
  return { ok: errors.length === 0, message: [ok.length && `Atualizado: ${ok.join(", ")}.`, errors.length && `Falhou: ${errors.map((e) => `${e.env} (${e.error})`).join("; ")}`].filter(Boolean).join(" ") };
}

const channelSchema = z.object({
  serviceId: z.string(),
  protocol: z.enum(CHANNEL_PROTOCOLS, { error: "Escolha o protocolo do canal." }),
  name: z.string({ error: "Dê um nome ao canal." }).trim().min(1, "Dê um nome ao canal.").max(80, "Nome muito longo (máx. 80)."),
  environmentId: z.string().optional(),
  address: z.string().trim().max(500).optional(),
});

export async function addChannel(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("service:edit");
  const parsed = channelSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Canal inválido.");
  const svc = await serviceFor(actor, parsed.data.serviceId, "service:edit");
  if (parsed.data.address && /:\/\/[^/\s]*:[^@\s]+@/.test(parsed.data.address)) return fail("O endereço não pode carregar senha.");
  // Endereço sem ambiente seria descartado em silêncio: melhor dizer o que falta.
  if (parsed.data.address && !parsed.data.environmentId) return fail("Escolha em qual ambiente fica esse endereço.");
  const channel = await prisma.serviceChannel.upsert({
    where: { serviceId_protocol_name: { serviceId: svc.id, protocol: parsed.data.protocol, name: parsed.data.name } },
    create: { serviceId: svc.id, protocol: parsed.data.protocol, name: parsed.data.name },
    update: {},
  });
  if (parsed.data.environmentId && parsed.data.address) {
    await prisma.channelAddress.upsert({
      where: { channelId_environmentId: { channelId: channel.id, environmentId: parsed.data.environmentId } },
      create: { channelId: channel.id, environmentId: parsed.data.environmentId, value: parsed.data.address },
      update: { value: parsed.data.address },
    });
  }
  const hub = await publishHubFile(svc.id, actor.id);
  revalidatePath(`/services/${svc.slug}`);
  return { ok: true, message: `Canal salvo. ${hub.note}` };
}

export async function removeChannel(form: FormData) {
  const actor = await requirePermission("service:edit");
  const id = z.string().parse(form.get("id"));
  const channel = await prisma.serviceChannel.findUniqueOrThrow({ where: { id } });
  const svc = await serviceFor(actor, channel.serviceId, "service:edit");
  await prisma.serviceChannel.delete({ where: { id } });
  await publishHubFile(svc.id, actor.id);
  revalidatePath(`/services/${svc.slug}`);
}

const PRESETS = {
  postgres: { name: "PostgreSQL", slug: "postgresql", kind: "DATABASE" as const, provider: "PostgreSQL", relation: "READS" as const },
  rabbit: { name: "RabbitMQ", slug: "rabbitmq", kind: "QUEUE" as const, provider: "RabbitMQ", relation: "PUBLISHES" as const },
};

export async function linkPreset(form: FormData) {
  const actor = await requirePermission("service:edit");
  const preset = z.enum(["postgres", "rabbit"]).safeParse(form.get("preset"));
  if (!preset.success) return;
  const svc = await serviceFor(actor, z.string().parse(form.get("serviceId")), "service:edit");
  const spec = PRESETS[preset.data];
  const relation = svc.kind === "WORKER" && spec.kind === "QUEUE" ? "SUBSCRIBES" : spec.relation;
  if (!RELATIONS_BY_KIND[spec.kind].includes(relation)) return;
  const resource = await prisma.externalResource.upsert({
    where: { slug: spec.slug },
    create: { slug: spec.slug, name: spec.name, kind: spec.kind, provider: spec.provider },
    update: { provider: spec.provider },
  });
  await prisma.serviceResource.upsert({
    where: { serviceId_resourceId_relation: { serviceId: svc.id, resourceId: resource.id, relation } },
    create: { serviceId: svc.id, resourceId: resource.id, relation, createdById: actor.id },
    update: {},
  });
  await publishHubFile(svc.id, actor.id);
  revalidatePath(`/services/${svc.slug}`);
  revalidatePath("/graph");
}

export async function addCall(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("service:edit");
  const parsed = z.object({
    serviceId: z.string(),
    toSlug: z.string({ error: "Informe o serviço que recebe a chamada." }).trim().toLowerCase().min(1, "Informe o serviço que recebe a chamada."),
    method: z.string({ error: "Escolha o método HTTP." }).trim().toUpperCase().min(1, "Escolha o método HTTP.").max(10),
    path: z.string({ error: "Informe o caminho do endpoint." }).trim().min(1, "Informe o caminho do endpoint, como /pedidos.").max(500)
      .startsWith("/", "O caminho começa com /, como /pedidos."),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Chamada inválida.");
  const svc = await serviceFor(actor, parsed.data.serviceId, "service:edit");
  const target = await prisma.service.findUnique({ where: { slug: parsed.data.toSlug }, select: { id: true } });
  if (!target) return fail(`Não achei o serviço "${parsed.data.toSlug}". Use o endereço dele, como em /services/pedidos.`);
  if (target.id === svc.id) return fail("Um serviço não registra chamada para si mesmo. Escolha outro serviço.");
  await prisma.serviceDependency.upsert({
    where: { fromServiceId_toServiceId_kind: { fromServiceId: svc.id, toServiceId: target.id, kind: "CONSUMES" } },
    create: { fromServiceId: svc.id, toServiceId: target.id, kind: "CONSUMES", protocol: "HTTP", createdById: actor.id },
    update: {},
  });
  await prisma.operationCall.upsert({
    where: { fromServiceId_toServiceId_method_path: { fromServiceId: svc.id, toServiceId: target.id, method: parsed.data.method, path: parsed.data.path } },
    create: { fromServiceId: svc.id, toServiceId: target.id, method: parsed.data.method, path: parsed.data.path },
    update: {},
  });
  const hub = await publishHubFile(svc.id, actor.id);
  revalidatePath(`/services/${svc.slug}`);
  return { ok: true, message: `Chamada registrada. ${hub.note}` };
}
