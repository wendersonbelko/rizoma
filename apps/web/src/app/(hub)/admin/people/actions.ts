"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { ROLES, canChangeRole, type Role } from "@api-hub/core";
import { createInvite } from "@/lib/local-auth";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

const decideSchema = z.object({
  requestId: z.string(),
  decision: z.enum(["approve", "reject"]),
  role: z.enum(["ADMIN", "MAINTAINER", "VIEWER"]).default("VIEWER"),
  expiresInDays: z.coerce.number().int().min(0).max(365).default(0),
  note: z.string().max(300).optional(),
});

/** RN-11 a RN-13: decisão sobre pedido de acesso. */
export async function decideAccessRequest(form: FormData) {
  const actor = await requirePermission("access:decide");
  const d = decideSchema.parse(Object.fromEntries(form));
  // RN-13: ADMIN só concede até MAINTAINER.
  if (d.role === "ADMIN" && actor.role !== "OWNER") throw new Error("Só um OWNER concede o papel ADMIN.");

  const req = await prisma.accessRequest.findUniqueOrThrow({ where: { id: d.requestId } });
  if (req.status !== "PENDING") return;
  if (req.userId === actor.id) throw new Error("Você não pode decidir o próprio pedido.");

  const approve = d.decision === "approve";
  await prisma.$transaction([
    prisma.accessRequest.update({
      where: { id: req.id },
      data: { status: approve ? "APPROVED" : "REJECTED", decidedById: actor.id, decidedAt: new Date(), decisionNote: d.note, grantedRole: approve ? d.role : null },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: approve
        ? {
            status: "ACTIVE", role: d.role, statusReason: null,
            accessGrant: req.isOrgMember ? "ORG_MEMBERSHIP" : "MANUAL_APPROVAL",
            accessExpiresAt: d.expiresInDays > 0 ? new Date(Date.now() + d.expiresInDays * 86_400_000) : null,
          }
        : { status: "REJECTED" },
    }),
  ]);
  await audit({ actorId: actor.id, action: approve ? "access.approved" : "access.rejected", targetType: "user", targetId: req.userId, metadata: { role: d.role, expiresInDays: d.expiresInDays } });
  revalidatePath("/admin/people");
}

export async function changeRole(form: FormData) {
  const actor = await requirePermission("user:manage");
  const { userId, role } = z.object({ userId: z.string(), role: z.enum(ROLES as [string, ...string[]]) }).parse(Object.fromEntries(form));
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
  const newRole = role as Role;
  const check = canChangeRole({ actor, target, newRole, ownerCount });
  if (!check.ok) throw new Error(check.reason);
  await prisma.user.update({ where: { id: userId }, data: { role: newRole, tokenVersion: { increment: 1 } } });
  await audit({ actorId: actor.id, action: "user.role_changed", targetType: "user", targetId: userId, metadata: { from: target.role, to: role } });
  revalidatePath("/admin/people");
}

/** RN-14: suspender derruba as sessões na hora. */
export async function setSuspended(form: FormData) {
  const actor = await requirePermission("user:manage");
  const { userId, suspend } = z.object({ userId: z.string(), suspend: z.enum(["1", "0"]) }).parse(Object.fromEntries(form));
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (target.id === actor.id) throw new Error("Você não pode suspender a si mesmo.");
  if (target.role === "OWNER" && actor.role !== "OWNER") throw new Error("Só um OWNER suspende outro OWNER.");

  await prisma.user.update({
    where: { id: userId },
    // tokenVersion++ invalida o JWT atual na próxima requisição.
    data: suspend === "1" ? { status: "SUSPENDED", statusReason: "MANUAL", tokenVersion: { increment: 1 } } : { status: "ACTIVE", statusReason: null, lastMembershipCheckAt: null },
  });
  await audit({ actorId: actor.id, action: suspend === "1" ? "user.suspended" : "user.reactivated", targetType: "user", targetId: userId });
  revalidatePath("/admin/people");
}

export type InviteResult = { ok: boolean; message?: string; url?: string };

/** RN-107: convite por e-mail (login com senha). Com SMTP salvo, o hub envia o link e ainda o mostra para copiar. */
export async function inviteUser(_: InviteResult, form: FormData): Promise<InviteResult> {
  const actor = await requirePermission("user:manage");
  const cred = await prisma.authProvider.findUnique({ where: { type: "CREDENTIALS" } });
  if (!cred?.enabled) return { ok: false, message: "Ative o login por e-mail e senha em Configurações para convidar." };
  const parsed = z.object({
    email: z.email("E-mail inválido.").transform((e) => e.toLowerCase()),
    name: z.string().trim().max(80).optional(),
    role: z.enum(["ADMIN", "MAINTAINER", "VIEWER"]),
  }).safeParse({ email: form.get("email"), name: form.get("name") || undefined, role: form.get("role") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  if (parsed.data.role === "ADMIN" && actor.role !== "OWNER") return { ok: false, message: "Só um OWNER convida ADMIN." };
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing?.status === "ACTIVE") return { ok: false, message: "Essa pessoa já tem acesso." };
  const { url, expiresAt, sent, sendError } = await createInvite({ ...parsed.data, kind: "INVITE", createdById: actor.id });
  revalidatePath("/admin/people");
  const when = expiresAt.toLocaleDateString("pt-BR");
  const message = sent
    ? `E-mail enviado para ${parsed.data.email}. O link também está aqui, vale até ${when} e só pode ser usado uma vez.`
    : sendError
      ? `O e-mail não saiu (${sendError}). Copie o link. Vale até ${when} e só pode ser usado uma vez.`
      : `Envie este link para ${parsed.data.email}. Vale até ${when} e só pode ser usado uma vez.`;
  return { ok: true, url, message };
}

export async function passwordResetLink(_: InviteResult, form: FormData): Promise<InviteResult> {
  const actor = await requirePermission("user:manage");
  const userId = z.string().parse(form.get("userId"));
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!target.email || !target.passwordHash) return { ok: false, message: "Essa pessoa não entra com senha." };
  if (target.role === "OWNER" && actor.role !== "OWNER") return { ok: false, message: "Só um OWNER redefine a senha de outro OWNER." };
  const { url, sent, sendError } = await createInvite({ email: target.email, role: target.role, kind: "PASSWORD_RESET", createdById: actor.id });
  const message = sent
    ? "E-mail enviado. O link também está aqui: vale 1 hora, uso único. Ao usar, as sessões da pessoa são encerradas."
    : sendError
      ? `O e-mail não saiu (${sendError}). Copie o link. Vale 1 hora, uso único.`
      : "Link válido por 1 hora, uso único. Ao usar, as sessões da pessoa são encerradas.";
  return { ok: true, url, message };
}
