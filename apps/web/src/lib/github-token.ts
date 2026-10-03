import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { prisma } from "@api-hub/db";
import { decryptSecret, encryptSecret } from "@api-hub/core";

const ENC_PREFIX = "v1.";

/** RN-S13: tokens OAuth do GitHub ficam cifrados em repouso (AES-256-GCM). */
export function sealToken(token: string | null | undefined): string | null | undefined {
  if (!token || token.startsWith(ENC_PREFIX)) return token;
  return encryptSecret(token);
}

/**
 * Lê o token do GitHub de uma pessoa, já decifrado.
 * Tokens antigos em texto puro (antes da RN-S13) são cifrados na primeira leitura.
 */
export async function getGithubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({ where: { userId, provider: "github" } });
  const stored = account?.access_token;
  if (!account || !stored) return null;
  if (stored.startsWith(ENC_PREFIX)) {
    try {
      return decryptSecret(stored);
    } catch {
      return null; // ENCRYPTION_KEY trocada: força novo login
    }
  }
  await prisma.account.update({
    where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
    data: { access_token: encryptSecret(stored) },
  });
  return stored;
}

/**
 * De onde viria o token do GitHub usado por addRepository/lookupRepo (mesma ordem de busca):
 * integração (Configurações → Repositórios) e, na falta dela, o token OAuth da própria pessoa.
 * Serve para avisar ANTES de tentar vincular um repositório sem token configurado, em vez de só
 * mostrar "Repositório não encontrado ou sem acesso" depois da tentativa falhar.
 */
export async function githubTokenSource(userId: string): Promise<"integration" | "personal" | null> {
  const integration = await prisma.sourceIntegration.findUnique({ where: { type: "GITHUB" }, select: { tokenEnc: true } });
  if (integration?.tokenEnc) return "integration";
  return (await getGithubToken(userId)) ? "personal" : null;
}

export async function storeGithubToken(account: { provider: string; providerAccountId: string; access_token?: string; scope?: string }) {
  await prisma.account.update({
    where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
    data: { access_token: sealToken(account.access_token) ?? null, scope: account.scope },
  });
}

/** Envolve o adaptador do Auth.js para nunca gravar token em texto puro. */
export function withSealedTokens(base: Adapter): Adapter {
  return {
    ...base,
    linkAccount: (account: AdapterAccount) =>
      base.linkAccount!({
        ...account,
        access_token: sealToken(account.access_token) ?? undefined,
        refresh_token: sealToken(account.refresh_token) ?? undefined,
        id_token: sealToken(account.id_token) ?? undefined,
      }),
  };
}
