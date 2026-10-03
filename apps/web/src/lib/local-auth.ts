import { randomBytes } from "node:crypto";
import { prisma, type Role } from "@api-hub/db";
import { hashPassword, passwordProblems, sha256 } from "@api-hub/core";
import { audit } from "./audit";
import { linkBaseUrl, sendHubMail } from "./mail";

const INVITE_DAYS = 7;
const RESET_MINUTES = 60;

/** RN-107: convite e redefinição geram link de uso único; só o hash do token fica salvo. Com SMTP salvo, o link também é enviado. */
export async function createInvite(input: { email: string; name?: string; role: Role; kind: "INVITE" | "PASSWORD_RESET"; createdById: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (input.kind === "INVITE" ? INVITE_DAYS * 86_400_000 : RESET_MINUTES * 60_000));
  await prisma.userInvite.updateMany({ where: { email: input.email, kind: input.kind, usedAt: null }, data: { expiresAt: new Date() } });
  await prisma.userInvite.create({
    data: { email: input.email.toLowerCase(), name: input.name, role: input.role, kind: input.kind, tokenHash: sha256(token), expiresAt, createdById: input.createdById },
  });
  const url = `${await linkBaseUrl()}/${input.kind === "INVITE" ? "invite" : "reset-password"}/${token}`;
  const subject = input.kind === "INVITE" ? "Convite para o Rizoma" : "Nova senha do Rizoma";
  const text = input.kind === "INVITE"
    ? `Você foi convidado para o Rizoma. Abra o link para criar sua senha. Ele vale 7 dias e só pode ser usado uma vez:\n\n${url}`
    : `Foi pedido um link de nova senha no Rizoma. Ele vale 1 hora e só pode ser usado uma vez:\n\n${url}`;
  const sent = await sendHubMail(input.email, subject, text);
  await audit({
    actorId: input.createdById,
    action: input.kind === "INVITE" ? "user.invited" : "user.password_reset_link",
    metadata: { email: input.email, role: input.role, sent: sent.ok },
  });
  const sendError = sent.ok || "skipped" in sent ? undefined : sent.error;
  return { url, expiresAt, sent: sent.ok, sendError };
}

export async function findInvite(token: string) {
  const invite = await prisma.userInvite.findUnique({ where: { tokenHash: sha256(token) } });
  if (!invite || invite.usedAt || invite.expiresAt <= new Date()) return null;
  return invite;
}

export async function consumeInvite(token: string, password: string, name?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const invite = await findInvite(token);
  if (!invite) return { ok: false, error: "Link inválido ou expirado. Peça um novo ao administrador." };
  const problems = passwordProblems(password, invite.email);
  if (problems.length) return { ok: false, error: problems.join(" ") };
  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const marked = await tx.userInvite.updateMany({ where: { id: invite.id, usedAt: null }, data: { usedAt: new Date() } });
    if (marked.count === 0) throw new Error("Link já usado.");
    const existing = await tx.user.findUnique({ where: { email: invite.email } });
    if (invite.kind === "PASSWORD_RESET") {
      if (!existing) throw new Error("Conta não encontrada.");
      return tx.user.update({ where: { id: existing.id }, data: { passwordHash, failedLogins: 0, lockedUntil: null, tokenVersion: { increment: 1 } } });
    }
    const data = {
      passwordHash, status: "ACTIVE" as const, accessGrant: "MANUAL_APPROVAL" as const, statusReason: null,
      name: name?.trim() || invite.name || existing?.name, failedLogins: 0, lockedUntil: null,
    };
    return existing
      ? tx.user.update({ where: { id: existing.id }, data: { ...data, role: existing.role === "OWNER" ? "OWNER" : invite.role, tokenVersion: { increment: 1 } } })
      : tx.user.create({ data: { ...data, email: invite.email, role: invite.role } });
  });
  await audit({ actorId: user.id, action: invite.kind === "INVITE" ? "user.invite_accepted" : "user.password_reset", targetType: "user", targetId: user.id });
  return { ok: true };
}

/** RN-108: cadastro aberto (se liberado) cria pedido de acesso; nunca revela se o e-mail já existe. */
export async function signup(input: { name: string; email: string; password: string; reason: string }): Promise<{ ok: boolean; error?: string }> {
  const provider = await prisma.authProvider.findUnique({ where: { type: "CREDENTIALS" } });
  if (!provider?.enabled || !provider.allowSignup) return { ok: false, error: "Cadastro fechado. Peça um convite ao administrador." };
  const email = input.email.toLowerCase();
  const problems = passwordProblems(input.password, email);
  if (problems.length) return { ok: false, error: problems.join(" ") };
  const inst = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
  if (inst.outsiderPolicy === "BLOCK") return { ok: false, error: "Cadastro fechado. Peça um convite ao administrador." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: true }; // mesma resposta, sem revelar a conta
  const user = await prisma.user.create({ data: { email, name: input.name, passwordHash: await hashPassword(input.password), status: "PENDING" } });
  await prisma.accessRequest.create({ data: { userId: user.id, reason: input.reason, expiresAt: new Date(Date.now() + inst.accessRequestTtlDays * 86_400_000) } });
  await audit({ actorId: user.id, action: "access.requested", targetType: "user", targetId: user.id, metadata: { via: "signup" } });
  return { ok: true };
}
