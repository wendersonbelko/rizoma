import type { AuthProviderType } from "./auth-providers";

export type Affiliation = "member" | "not_member" | "token_invalid";

export function normalizeDomain(d: string): string {
  return d.trim().toLowerCase().replace(/^@/, "");
}

export function emailDomainAllowed(email: string | null | undefined, domains: string[]): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@").pop()!.toLowerCase();
  // Subdomínios contam: "time.acme.com" casa com "acme.com".
  return domains.map(normalizeDomain).some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * Vínculo com a empresa a partir do perfil devolvido pelo provedor (RN-95 a RN-97).
 * GitHub é checado pela API de organizações e não passa por aqui.
 */
export function affiliationFromProfile(
  type: AuthProviderType,
  profile: Record<string, unknown>,
  config: { tenantId?: string | null; allowedEmailDomains: string[] },
): Affiliation {
  const email = typeof profile.email === "string" ? profile.email : null;
  const verified = profile.email_verified === true || profile.email_verified === "true";
  switch (type) {
    case "GOOGLE":
      return verified && emailDomainAllowed(email, config.allowedEmailDomains) ? "member" : "not_member";
    case "MICROSOFT":
      if (config.tenantId && typeof profile.tid === "string" && profile.tid.toLowerCase() === config.tenantId.toLowerCase()) return "member";
      return emailDomainAllowed(email ?? (profile.preferred_username as string), config.allowedEmailDomains) ? "member" : "not_member";
    case "GITLAB":
      return emailDomainAllowed(email, config.allowedEmailDomains) ? "member" : "not_member";
    case "OIDC":
      return verified && emailDomainAllowed(email, config.allowedEmailDomains) ? "member" : "not_member";
    default:
      return "not_member";
  }
}
