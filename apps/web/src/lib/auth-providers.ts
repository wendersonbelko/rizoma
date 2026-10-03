import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import GitLab from "next-auth/providers/gitlab";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import { z } from "zod";
import { prisma, type AuthProvider } from "@api-hub/db";
import { AUTHJS_ID, LOGIN_LOCK_MINUTES, LOGIN_MAX_FAILURES, decryptSecret, verifyPassword, type AuthProviderType } from "@api-hub/core";
import { rateLimit } from "./rate-limit";

export class LoginError extends CredentialsSignin {
  constructor(code: "invalid" | "locked" | "suspended" | "too_many") {
    super();
    this.code = code;
  }
}

export const TYPE_BY_AUTHJS_ID = Object.fromEntries(Object.entries(AUTHJS_ID).map(([k, v]) => [v, k])) as Record<string, AuthProviderType>;

const credentialsInput = z.object({ email: z.email().transform((e) => e.toLowerCase()), password: z.string().min(1).max(200) });

/** RN-105/106: login por e-mail e senha com bloqueio após falhas seguidas. */
async function authorizeCredentials(raw: unknown) {
  const parsed = credentialsInput.safeParse(raw);
  if (!parsed.success) throw new LoginError("invalid");
  const { email, password } = parsed.data;
  if (!rateLimit(`login:${email}`, 20, 15 * 60_000)) throw new LoginError("too_many");

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.lockedUntil && user.lockedUntil > new Date()) throw new LoginError("locked");

  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) {
    if (user) {
      const failures = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: failures >= LOGIN_MAX_FAILURES
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000) }
          : { failedLogins: failures },
      });
      if (failures >= LOGIN_MAX_FAILURES) {
        await prisma.auditLog.create({ data: { actorId: user.id, action: "auth.locked", targetType: "user", targetId: user.id } });
      }
    }
    throw new LoginError("invalid");
  }
  if (user.status === "SUSPENDED" || user.status === "REJECTED") throw new LoginError("suspended");
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

function secret(p: AuthProvider) {
  return p.clientSecretEnc ? decryptSecret(p.clientSecretEnc) : "";
}

/** Monta os provedores do Auth.js a partir do que foi configurado no assistente/Configurações. */
export function buildProviders(rows: AuthProvider[]): Provider[] {
  const out: Provider[] = [];
  for (const p of rows) {
    if (!p.enabled) continue;
    switch (p.type) {
      case "GITHUB":
        out.push(GitHub({
          clientId: p.clientId!, clientSecret: secret(p),
          // RN-S02: escopos mínimos — perfil, e-mail e leitura de organizações.
          authorization: { params: { scope: "read:user user:email read:org" } },
          profile(profile) {
            return { id: String(profile.id), name: profile.name ?? profile.login, email: profile.email, image: profile.avatar_url, githubId: profile.id, githubLogin: profile.login.toLowerCase() };
          },
        }));
        break;
      case "GOOGLE":
        out.push(Google({ clientId: p.clientId!, clientSecret: secret(p) }));
        break;
      case "MICROSOFT":
        out.push(MicrosoftEntraID({
          clientId: p.clientId!, clientSecret: secret(p),
          issuer: `https://login.microsoftonline.com/${p.tenantId || "common"}/v2.0`,
        }));
        break;
      case "GITLAB": {
        const base = (p.issuer || "https://gitlab.com").replace(/\/+$/, "");
        out.push(GitLab({
          clientId: p.clientId!, clientSecret: secret(p),
          authorization: { url: `${base}/oauth/authorize`, params: { scope: "read_user" } },
          token: `${base}/oauth/token`,
          userinfo: `${base}/api/v4/user`,
        }));
        break;
      }
      case "FACEBOOK":
        out.push(Facebook({ clientId: p.clientId!, clientSecret: secret(p) }));
        break;
      case "OIDC":
        out.push({
          id: "oidc", name: p.label || "SSO", type: "oidc",
          issuer: p.issuer!, clientId: p.clientId!, clientSecret: secret(p),
          authorization: { params: { scope: "openid email profile" } },
        });
        break;
      case "CREDENTIALS":
        out.push(Credentials({ id: "credentials", name: "E-mail e senha", credentials: { email: {}, password: {} }, authorize: authorizeCredentials }));
        break;
    }
  }
  return out;
}
