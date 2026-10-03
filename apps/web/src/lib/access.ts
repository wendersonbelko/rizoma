import { prisma } from "@api-hub/db";
import { decideAccess, type Affiliation } from "@api-hub/core";
import { getInstallation } from "./install";
import { audit } from "./audit";

type Inst = { recoveryIdentifier: string | null; recoveryExpiresAt: Date | null };

/** Identificadores de uma pessoa: usuário do GitHub e e-mail, em minúsculas. */
export function identifiersOf(user: { githubLogin: string | null; email: string | null }): string[] {
  return [user.githubLogin, user.email].filter((v): v is string => !!v).map((v) => v.toLowerCase());
}

/** RN-70: login autorizado por `pnpm admin:recover` e ainda dentro do prazo. */
export function isRecoveryLogin(inst: Inst, ids: string[]): boolean {
  return !!inst.recoveryIdentifier && !!inst.recoveryExpiresAt && inst.recoveryExpiresAt > new Date() && ids.includes(inst.recoveryIdentifier.toLowerCase());
}

/**
 * Aplica a política de acesso a uma pessoa (login ou revalidação).
 * `affiliation` vem do provedor usado: API de organizações (GitHub) ou perfil (domínio/tenant).
 * Retorna ok=false quando a sessão precisa ser encerrada.
 */
export async function evaluateAccess(userId: string, affiliation: Affiliation): Promise<{ ok: boolean; reason?: string }> {
  if (affiliation === "token_invalid") return { ok: false, reason: "reauth" };
  const inst = await getInstallation();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
  const ids = identifiersOf(user);

  const isSetupClaim = !inst.installed && ownerCount === 0 && !!inst.ownerIdentifier && ids.includes(inst.ownerIdentifier.toLowerCase());
  const isRecoveryClaim = isRecoveryLogin(inst, ids);
  const isOrgMember = affiliation === "member";

  const decision = decideAccess({
    current: user,
    isOrgMember,
    isOwnerClaim: isSetupClaim || isRecoveryClaim,
    policy: { autoApproveOrgMembers: inst.autoApproveOrgMembers, outsiderPolicy: inst.outsiderPolicy },
  });

  if (decision.kind === "deny") {
    await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
    await audit({ actorId: userId, action: "access.denied", targetType: "user", targetId: userId, metadata: { reason: decision.reason } });
    return { ok: false, reason: decision.reason };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isOrgMember,
      lastMembershipCheckAt: new Date(),
      status: decision.status,
      ...(decision.role ? { role: decision.role } : {}),
      ...(decision.accessGrant !== undefined ? { accessGrant: decision.accessGrant } : {}),
      ...(decision.statusReason !== undefined ? { statusReason: decision.statusReason } : {}),
    },
  });

  if (isRecoveryClaim) {
    // Uso único: a janela de recuperação fecha assim que alguém a usa.
    await prisma.installation.update({ where: { id: "singleton" }, data: { recoveryIdentifier: null, recoveryExpiresAt: null } });
    await audit({ actorId: userId, action: "owner.recovered", targetType: "user", targetId: userId, metadata: { via: "login" } });
  }

  if (decision.status !== user.status || decision.role) {
    await audit({
      actorId: null, action: "access.status_changed", targetType: "user", targetId: userId,
      metadata: { from: user.status, to: decision.status, role: decision.role ?? null, isOrgMember },
    });
  }

  const open = await prisma.accessRequest.findFirst({ where: { userId, status: "PENDING", expiresAt: { gt: new Date() } } });
  if (decision.createRequest && !open) {
    await prisma.accessRequest.create({ data: { userId, isOrgMember, expiresAt: new Date(Date.now() + inst.accessRequestTtlDays * 86_400_000) } });
    await audit({ actorId: userId, action: "access.requested", targetType: "user", targetId: userId });
  }
  if (decision.status === "ACTIVE" && open) {
    await prisma.accessRequest.update({
      where: { id: open.id },
      data: { status: "APPROVED", decidedAt: new Date(), decisionNote: "Aprovado automaticamente (vínculo com a empresa)." },
    });
  }
  return { ok: decision.status !== "SUSPENDED" && decision.status !== "REJECTED" };
}
