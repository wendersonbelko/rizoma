import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@api-hub/db";
import { affiliationFromProfile, checkMembership, type Affiliation, type AuthProviderType } from "@api-hub/core";
import { getInstallation } from "@/lib/install";
import { evaluateAccess, identifiersOf, isRecoveryLogin } from "@/lib/access";
import { audit } from "@/lib/audit";
import { storeGithubToken, withSealedTokens } from "@/lib/github-token";
import { TYPE_BY_AUTHJS_ID, buildProviders } from "@/lib/auth-providers";

type Inst = Awaited<ReturnType<typeof getInstallation>>;

/** Vínculo com a empresa segundo o provedor usado (RN-95 a RN-97). */
async function affiliationFor(type: AuthProviderType | undefined, token: string | undefined, profile: Record<string, unknown> | undefined, inst: Inst): Promise<Affiliation> {
  if (!type || type === "CREDENTIALS" || type === "FACEBOOK") return "not_member";
  if (type === "GITHUB") return token && inst.allowedGithubOrgs.length ? checkMembership(token, inst.allowedGithubOrgs) : "not_member";
  const cfg = await prisma.authProvider.findUnique({ where: { type } });
  return affiliationFromProfile(type, profile ?? {}, { tenantId: cfg?.tenantId, allowedEmailDomains: inst.allowedEmailDomains });
}

/**
 * Configuração preguiçosa: provedores vêm do banco (assistente/Configurações).
 * Sessão em JWT (RN-S03): necessária para e-mail e senha e uniforme para todos.
 * Revogação: tokenVersion na pessoa; requireUser() confere a cada request.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const inst = await getInstallation();
  const rows = await prisma.authProvider.findMany({ where: { enabled: true } });

  return {
    adapter: withSealedTokens(PrismaAdapter(prisma)),
    trustHost: true,
    providers: buildProviders(rows),
    session: { strategy: "jwt", maxAge: inst.sessionMaxAgeHours * 3600 },
    pages: { signIn: "/login", error: "/login" },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (!account) return false;
        const type = TYPE_BY_AUTHJS_ID[account.provider];
        const ids = [profile?.login, profile?.email, user.email, (user as { githubLogin?: string }).githubLogin]
          .filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase());

        // RN-61: durante a instalação só o futuro OWNER entra.
        if (!inst.installed) return inst.ownerIdentifier && ids.includes(inst.ownerIdentifier.toLowerCase()) ? true : "/login?error=setup_in_progress";
        // RN-70: janela de recuperação ignora a política de bloqueio.
        if (isRecoveryLogin(inst, ids)) return true;

        if (inst.outsiderPolicy === "BLOCK" && type !== "CREDENTIALS") {
          const affiliation = await affiliationFor(type, account.access_token, profile as Record<string, unknown>, inst);
          if (affiliation !== "member") {
            const email = typeof profile?.email === "string" ? profile.email.toLowerCase() : undefined;
            const existing = email ? await prisma.user.findUnique({ where: { email } }) : null;
            if (existing?.accessGrant !== "MANUAL_APPROVAL") return "/login?error=not_member";
          }
        }
        return true;
      },
      async jwt({ token, user }) {
        if (user?.id) {
          const db = await prisma.user.findUnique({ where: { id: user.id }, select: { tokenVersion: true } });
          token.uid = user.id;
          token.tv = db?.tokenVersion ?? 0;
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = typeof token.uid === "string" ? token.uid : "";
        session.user.tv = typeof token.tv === "number" ? token.tv : -1;
        return session;
      },
    },
    events: {
      async signIn({ user, account, profile }) {
        if (!user.id || !account) return;
        const type = TYPE_BY_AUTHJS_ID[account.provider];
        if (account.access_token && type !== "CREDENTIALS") await storeGithubToken({ ...account, access_token: account.access_token });

        const email = typeof profile?.email === "string" ? profile.email.toLowerCase() : user.email?.toLowerCase();
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(type === "GITHUB" && profile?.login ? { githubLogin: String(profile.login).toLowerCase(), githubId: Number(profile.id) } : {}),
            ...(email && type !== "CREDENTIALS" ? { email } : {}),
            image: user.image ?? undefined,
            name: user.name ?? undefined,
            lastSeenAt: new Date(),
          },
        });
        const affiliation = await affiliationFor(type, account.access_token, profile as Record<string, unknown>, inst);
        const db = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
        await evaluateAccess(user.id, affiliation);
        await audit({ actorId: user.id, action: "auth.sign_in", targetType: "user", targetId: user.id, metadata: { provider: account.provider, affiliation, ids: identifiersOf(db) } });
      },
      async signOut(message) {
        if ("token" in message && typeof message.token?.uid === "string") await audit({ actorId: message.token.uid, action: "auth.sign_out" });
      },
    },
  };
});
