"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@api-hub/db";
import { AUTHJS_ID, countLabel, decryptSecret, encryptSecret, environmentsInputSchema, mailSettingsSchema, providersInputSchema, setupSchemas, sha256, sourceInputSchema, type SourceProvider } from "@api-hub/core";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { environmentsForScreen, saveEnvironments, saveProviders, saveSources } from "@/lib/config-service";
import { clearMailSettings, probeMail, saveMailSettings } from "@/lib/mail";

/** `secret` só vem quando a ação gera um valor que aparece uma vez (segredo do webhook, token do cron). */
export type SettingsResult = { ok: boolean; message?: string; secret?: string };
const fail = (message: string): SettingsResult => ({ ok: false, message });
const done = (message: string, secret?: string): SettingsResult => {
  revalidatePath("/admin/settings");
  return { ok: true, message, ...(secret ? { secret } : {}) };
};

/** Força revalidação do vínculo no próximo acesso de cada pessoa (RN-75). */
async function forceMembershipRecheck() {
  await prisma.user.updateMany({ where: { status: "ACTIVE" }, data: { lastMembershipCheckAt: null } });
}

const orgSchema = setupSchemas.organization.omit({ orgSlug: true, appName: true });

export async function saveOrganization(form: FormData): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const split = (k: string) => String(form.get(k) ?? "").split(/[\s,]+/).filter(Boolean);
  const parsed = orgSchema.safeParse({ orgName: form.get("orgName"), allowedGithubOrgs: split("orgs"), allowedEmailDomains: split("domains") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const before = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
  const data = { orgName: parsed.data.orgName, allowedGithubOrgs: [...new Set(parsed.data.allowedGithubOrgs)], allowedEmailDomains: [...new Set(parsed.data.allowedEmailDomains)] };
  await prisma.installation.update({ where: { id: "singleton" }, data });
  const changed = JSON.stringify([before.allowedGithubOrgs, before.allowedEmailDomains]) !== JSON.stringify([data.allowedGithubOrgs, data.allowedEmailDomains]);
  if (changed) await forceMembershipRecheck();
  await audit({ actorId: actor.id, action: "settings.organization", metadata: { orgs: data.allowedGithubOrgs, domains: data.allowedEmailDomains } });
  return done(changed ? "Salvo. Quem já tem conta será conferido de novo no próximo acesso." : "Salvo.");
}

/** RN-100 a RN-102: formas de login. Sempre sobra pelo menos uma forma que o próprio admin usa. */
export async function saveLogin(payload: unknown): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const parsed = providersInputSchema.safeParse(payload);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const mine = await prisma.account.findMany({ where: { userId: actor.id }, select: { provider: true } });
  const me = await prisma.user.findUniqueOrThrow({ where: { id: actor.id }, select: { passwordHash: true } });
  const stillCanLogin = parsed.data.some((p) => (p.type === "CREDENTIALS" ? !!me.passwordHash : mine.some((a) => a.provider === AUTHJS_ID[p.type])));
  if (!stillCanLogin) return fail("Você ficaria sem forma de entrar. Mantenha a forma de login que você usa hoje.");
  const r = await saveProviders(parsed.data);
  if (!r.ok) return fail(r.error);
  await audit({ actorId: actor.id, action: "settings.login", metadata: { providers: parsed.data.map((p) => p.type) } });
  return done("Formas de login salvas. Valem a partir do próximo login.");
}

export async function saveRepositories(payload: unknown): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const parsed = z.array(sourceInputSchema).safeParse(payload);
  if (!parsed.success) return fail("Dados inválidos.");
  const r = await saveSources(parsed.data);
  if (!r.ok) return fail(r.error);
  await audit({ actorId: actor.id, action: "settings.repositories", metadata: { sources: parsed.data.map((s) => s.type) } });
  return done("Integrações de repositório salvas.");
}

export async function saveEnvs(payload: unknown): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const parsed = environmentsInputSchema.safeParse(payload);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const r = await saveEnvironments(parsed.data);
  if (!r.ok) return fail(r.error);
  await audit({ actorId: actor.id, action: "settings.environments", metadata: { envs: parsed.data.map((e) => ({ slug: e.slug, branches: e.branchPatterns })) } });
  revalidatePath("/", "layout");
  return done("Ambientes salvos. Novas publicações do CI já usam as regras de branch.");
}

/**
 * Remove um ambiente (RN-92/93: só se não tiver specs nem variáveis; `saveEnvironments` confere).
 * Achado F3 da auditoria de UX de 02/10/2026: é irreversível, então a pessoa digita o nome do ambiente.
 * O nome é conferido aqui, contra o ambiente carregado do banco, e não contra o que veio do formulário.
 */
export async function removeEnvironment(form: FormData): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const slug = z.string().trim().min(1).max(40).parse(form.get("slug"));
  const current = await environmentsForScreen();
  const target = current.find((e) => e.slug === slug);
  if (!target) return fail("Esse ambiente já não existe.");
  if (current.length <= 1) return fail("Crie outro ambiente antes de remover o último.");
  if (String(form.get("confirm") ?? "").trim() !== target.name) return fail(`Digite ${target.name} para confirmar.`);

  const rest = current.filter((e) => e.slug !== slug).map((e) => ({ ...e, syncBranch: e.syncBranch || undefined }));
  const parsed = environmentsInputSchema.safeParse(rest);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const r = await saveEnvironments(parsed.data);
  if (!r.ok) return fail(r.error);
  await audit({ actorId: actor.id, action: "settings.environments", metadata: { removed: slug, envs: parsed.data.map((e) => ({ slug: e.slug, branches: e.branchPatterns })) } });
  revalidatePath("/", "layout");
  return done(`Ambiente ${target.name} removido.`);
}

export async function savePolicies(form: FormData): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const parsed = setupSchemas.policies.safeParse({
    autoApproveOrgMembers: form.get("auto") === "on", outsiderPolicy: form.get("outsider"),
    sessionMaxAgeHours: Number(form.get("session")), membershipRecheckHours: Number(form.get("recheck")), accessRequestTtlDays: Number(form.get("ttl")),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  await prisma.installation.update({ where: { id: "singleton" }, data: parsed.data });
  await audit({ actorId: actor.id, action: "settings.policies", metadata: parsed.data });
  return done("Regras salvas. A duração de sessão vale para os próximos logins.");
}

/** RN-77: encerra as sessões de todo mundo (JWT) menos a de quem clicou. A frase "ENCERRAR" é conferida aqui, no servidor, e não só no botão do modal. */
export async function endAllSessions(form: FormData): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  if (form.get("confirm") !== "ENCERRAR") return fail("Digite ENCERRAR para confirmar.");
  const { count } = await prisma.user.updateMany({ where: { id: { not: actor.id } }, data: { tokenVersion: { increment: 1 } } });
  await audit({ actorId: actor.id, action: "settings.sessions_revoked", metadata: { users: count } });
  return done(`Sessões encerradas para ${countLabel(count, "pessoa", "pessoas")}. Cada uma vai precisar entrar de novo.`);
}

export async function recheckAll(): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  await forceMembershipRecheck();
  await audit({ actorId: actor.id, action: "settings.membership_recheck" });
  return done("Cada pessoa será conferida de novo no próximo acesso.");
}

export async function cancelRecovery(): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  await prisma.installation.update({ where: { id: "singleton" }, data: { recoveryIdentifier: null, recoveryExpiresAt: null } });
  await audit({ actorId: actor.id, action: "owner.recovery_cancelled" });
  return done("Janela de recuperação cancelada.");
}

export async function saveMail(payload: unknown): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const parsed = mailSettingsSchema.safeParse(payload);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const r = await saveMailSettings(parsed.data);
  if (!r.ok) return fail(r.error);
  await audit({ actorId: actor.id, action: "settings.email", metadata: { configured: true } });
  return done("SMTP salvo. Convites e links de nova senha passam a ser enviados.");
}

export async function testMail(payload: unknown, to?: string): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const parsed = mailSettingsSchema.safeParse(payload);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const current = await prisma.mailSettings.findUnique({ where: { id: "singleton" } });
  const password = parsed.data.password?.trim() || (current?.passwordEnc ? decryptSecret(current.passwordEnc) : "");
  const r = await probeMail({ ...parsed.data, password }, to?.trim() || undefined);
  if (!r.ok) return fail(r.error);
  await audit({ actorId: actor.id, action: "settings.email_tested", metadata: { sent: !!to?.trim() } });
  return done(to?.trim() ? "Conexão aceita e e-mail de prova enviado." : "Conexão aceita.");
}

export async function disableMail(): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  await clearMailSettings();
  await audit({ actorId: actor.id, action: "settings.email", metadata: { configured: false } });
  return done("Envio de e-mail desligado. Os links voltam a ser só copiados.");
}

export async function generateWebhookSecret(type: SourceProvider): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const row = await prisma.sourceIntegration.findUnique({ where: { type } });
  if (!row) return fail("Salve a integração deste provedor antes de gerar o segredo.");
  const secret = randomBytes(32).toString("base64url");
  await prisma.sourceIntegration.update({ where: { type }, data: { webhookSecretEnc: encryptSecret(secret) } });
  await audit({ actorId: actor.id, action: "settings.webhook_secret", metadata: { type } });
  return done("Segredo gerado. Cole no provedor agora: ele não aparece de novo.", secret);
}

export async function generateSyncToken(): Promise<SettingsResult> {
  const actor = await requirePermission("settings:manage");
  const token = randomBytes(32).toString("base64url");
  await prisma.installation.update({ where: { id: "singleton" }, data: { syncTokenHash: sha256(token) } });
  await audit({ actorId: actor.id, action: "settings.sync_token" });
  return done("Token gerado. Guarde agora: ele não aparece de novo.", token);
}
