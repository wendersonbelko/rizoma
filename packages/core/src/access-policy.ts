import type { AccessGrant, OutsiderPolicy, Role, UserStatus } from "./types";

export interface AccessPolicy {
  autoApproveOrgMembers: boolean;
  outsiderPolicy: OutsiderPolicy;
}

export interface AccessInput {
  current: { status: UserStatus; accessGrant: AccessGrant | null; statusReason: string | null; accessExpiresAt: Date | null } | null;
  isOrgMember: boolean;
  isOwnerClaim: boolean;
  policy: AccessPolicy;
  now?: Date;
}

export type AccessDecision =
  | { kind: "deny"; reason: string }
  | {
      kind: "set";
      status: UserStatus;
      role?: Role;
      accessGrant?: AccessGrant | null;
      statusReason?: string | null;
      createRequest: boolean;
    };

export const REASON_ORG_LOST = "ORG_MEMBERSHIP_LOST";
const REASON_GRANT_EXPIRED = "ACCESS_EXPIRED";

/**
 * Decide o estado de acesso a cada login e a cada revalidação periódica.
 * Função pura: toda regra de RN-01 a RN-12 vive aqui e é coberta por testes.
 */
export function decideAccess(input: AccessInput): AccessDecision {
  const { current, isOrgMember, isOwnerClaim, policy } = input;
  const now = input.now ?? new Date();

  // RN-02: primeiro administrador definido no assistente.
  if (isOwnerClaim) {
    return { kind: "set", status: "ACTIVE", role: "OWNER", accessGrant: "OWNER_SETUP", statusReason: null, createRequest: false };
  }

  // RN-05: fora da org + política BLOCK → nem entra.
  if (!isOrgMember && policy.outsiderPolicy === "BLOCK" && current?.accessGrant !== "MANUAL_APPROVAL") {
    return { kind: "deny", reason: "not_member" };
  }

  // Primeiro acesso.
  if (!current || current.status === "PENDING") {
    if (isOrgMember && policy.autoApproveOrgMembers) {
      return { kind: "set", status: "ACTIVE", role: "VIEWER", accessGrant: "ORG_MEMBERSHIP", statusReason: null, createRequest: false };
    }
    return { kind: "set", status: "PENDING", createRequest: true };
  }

  // RN-09: rejeitado continua rejeitado até um admin reabrir.
  if (current.status === "REJECTED") return { kind: "set", status: "REJECTED", createRequest: false };

  if (current.status === "SUSPENDED") {
    // RN-08: suspensão automática por saída da org é revertida quando a pessoa volta.
    if (current.statusReason === REASON_ORG_LOST && isOrgMember && policy.autoApproveOrgMembers) {
      return { kind: "set", status: "ACTIVE", accessGrant: "ORG_MEMBERSHIP", statusReason: null, createRequest: false };
    }
    return { kind: "set", status: "SUSPENDED", createRequest: false };
  }

  // ACTIVE
  // RN-07: acesso manual com prazo vencido.
  if (current.accessGrant === "MANUAL_APPROVAL" && current.accessExpiresAt && current.accessExpiresAt <= now) {
    return { kind: "set", status: "SUSPENDED", statusReason: REASON_GRANT_EXPIRED, createRequest: false };
  }
  // RN-06: quem entrou pela org perde acesso ao sair dela.
  if (current.accessGrant === "ORG_MEMBERSHIP" && !isOrgMember) {
    return { kind: "set", status: "SUSPENDED", statusReason: REASON_ORG_LOST, createRequest: false };
  }
  return { kind: "set", status: "ACTIVE", createRequest: false };
}

export function membershipCheckIsStale(lastCheck: Date | null, recheckHours: number, now = new Date()): boolean {
  if (!lastCheck) return true;
  return now.getTime() - lastCheck.getTime() > recheckHours * 3_600_000;
}
