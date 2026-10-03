import { prisma, type Prisma } from "@api-hub/db";
import {
  AUTHJS_ID, PROVIDER_META, SOURCE_META, encryptSecret, verifyOAuthAppCredentials,
  type ProviderInput, type SourceProvider,
} from "@api-hub/core";

/**
 * Regras compartilhadas entre o assistente e Configurações para formas de login,
 * integrações de repositório e ambientes.
 */
export async function saveProviders(inputs: ProviderInput[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await prisma.authProvider.findMany();
  for (const p of inputs) {
    const existing = current.find((c) => c.type === p.type);
    const needsSecret = PROVIDER_META[p.type].fields.includes("clientSecret");
    // RN-101: secret em branco mantém o que já está salvo.
    if (needsSecret && !p.clientSecret && !existing?.clientSecretEnc) return { ok: false, error: `${PROVIDER_META[p.type].label}: informe o client secret.` };

    if (p.type === "GITHUB" && p.clientSecret) {
      const check = await verifyOAuthAppCredentials(p.clientId!, p.clientSecret);
      if (check === "invalid") return { ok: false, error: "GitHub recusou esse Client ID / Client secret." };
    }
    if (p.type === "OIDC" && p.issuer) {
      try {
        const res = await fetch(`${p.issuer.replace(/\/+$/, "")}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
        if (!res.ok) return { ok: false, error: `O emissor OIDC respondeu ${res.status} em /.well-known/openid-configuration.` };
      } catch {
        return { ok: false, error: "Não consegui acessar o emissor OIDC. Confira a URL." };
      }
    }
  }

  const keep = new Set(inputs.map((p) => p.type));
  await prisma.$transaction([
    prisma.authProvider.deleteMany({ where: { type: { notIn: [...keep] } } }),
    ...inputs.map((p) => {
      const data = {
        enabled: true,
        clientId: p.clientId || null,
        issuer: p.issuer || null,
        tenantId: p.tenantId || null,
        label: p.label || null,
        allowSignup: p.type === "CREDENTIALS" ? !!p.allowSignup : false,
        ...(p.clientSecret ? { clientSecretEnc: encryptSecret(p.clientSecret) } : {}),
      };
      return prisma.authProvider.upsert({ where: { type: p.type }, create: { type: p.type, ...data }, update: data });
    }),
  ]);
  return { ok: true };
}

export async function providersForScreen() {
  const rows = await prisma.authProvider.findMany();
  const base = (process.env.AUTH_URL ?? "").replace(/\/+$/, "");
  return {
    providers: rows.map((r) => ({
      type: r.type, clientId: r.clientId ?? "", issuer: r.issuer ?? "", tenantId: r.tenantId ?? "", label: r.label ?? "",
      allowSignup: r.allowSignup, hasSecret: !!r.clientSecretEnc,
    })),
    callbacks: Object.fromEntries(Object.entries(AUTHJS_ID).map(([t, id]) => [t, `${base}/api/auth/callback/${id}`])),
  };
}

async function verifySourceToken(type: SourceProvider, baseUrl: string | undefined, token: string): Promise<string | null> {
  const base = (baseUrl || SOURCE_META[type].defaultBaseUrl || "").replace(/\/+$/, "");
  const url = type === "GITHUB" ? `${base}/user` : type === "GITLAB" ? `${base}/api/v4/user` : type === "BITBUCKET" ? `${base}/2.0/user` : null;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: type === "GITLAB" ? { "PRIVATE-TOKEN": token } : { Authorization: `Bearer ${token}`, "User-Agent": "api-hub" },
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return `${SOURCE_META[type].label}: token recusado.`;
    return null;
  } catch {
    return null; // sem rede: não bloqueia, a sincronização mostrará o erro
  }
}

export async function saveSources(inputs: { type: SourceProvider; baseUrl?: string; token?: string }[]): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const s of inputs) {
    if (s.baseUrl && !/^https?:\/\//.test(s.baseUrl)) return { ok: false, error: `${SOURCE_META[s.type].label}: URL inválida.` };
    if (s.token) {
      const err = await verifySourceToken(s.type, s.baseUrl, s.token);
      if (err) return { ok: false, error: err };
    }
  }
  const keep = inputs.map((s) => s.type);
  await prisma.$transaction([
    prisma.sourceIntegration.deleteMany({ where: { type: { notIn: keep } } }),
    ...inputs.map((s) => {
      const data = { enabled: true, baseUrl: s.baseUrl || null, ...(s.token ? { tokenEnc: encryptSecret(s.token) } : {}) };
      return prisma.sourceIntegration.upsert({ where: { type: s.type }, create: { type: s.type, ...data }, update: data });
    }),
  ]);
  return { ok: true };
}

export async function sourcesForScreen() {
  const rows = await prisma.sourceIntegration.findMany();
  return rows.map((r) => ({ type: r.type, baseUrl: r.baseUrl ?? "", hasToken: !!r.tokenEnc, hasWebhookSecret: !!r.webhookSecretEnc }));
}

type EnvInput = { slug: string; name: string; branchPatterns: string[]; syncBranch?: string; color: string; isProduction: boolean };

/** RN-92/93: ambientes são casados por slug; remover exige que o ambiente não tenha specs nem variáveis. */
export async function saveEnvironments(inputs: EnvInput[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await prisma.environment.findMany({ include: { _count: { select: { specs: true, envVars: true } } } });
  const removed = current.filter((c) => !inputs.some((i) => i.slug === c.slug));
  const blocked = removed.filter((r) => r._count.specs + r._count.envVars > 0);
  if (blocked.length)
    return { ok: false, error: `Não dá para remover ${blocked.map((b) => b.name).join(", ")}: já tem specs ou variáveis. Renomeie em vez de remover.` };

  const ops: Prisma.PrismaPromise<unknown>[] = [prisma.environment.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } })];
  inputs.forEach((e, position) => {
    const data = { name: e.name, branchPatterns: e.branchPatterns, syncBranch: e.syncBranch || null, color: e.color, isProduction: e.isProduction, position };
    ops.push(prisma.environment.upsert({ where: { slug: e.slug }, create: { slug: e.slug, ...data }, update: data }));
  });
  await prisma.$transaction(ops);
  return { ok: true };
}

export async function environmentsForScreen() {
  const rows = await prisma.environment.findMany({ orderBy: { position: "asc" } });
  return rows.map((e) => ({ slug: e.slug, name: e.name, branchPatterns: e.branchPatterns, syncBranch: e.syncBranch ?? "", color: e.color, isProduction: e.isProduction }));
}

/** Avisos de configuração que não bloqueiam, mas mudam o comportamento (RN-98). */
export async function affiliationWarnings(): Promise<string[]> {
  const inst = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
  const providers = await prisma.authProvider.findMany();
  const w: string[] = [];
  for (const p of providers) {
    if (p.type === "GITHUB" && inst.allowedGithubOrgs.length === 0) w.push("GitHub sem organização informada: ninguém entra direto, todos pedem acesso.");
    if (["GOOGLE", "GITLAB", "OIDC"].includes(p.type) && inst.allowedEmailDomains.length === 0)
      w.push(`${PROVIDER_META[p.type].label} sem domínio de e-mail aceito: todos pedem acesso.`);
    if (p.type === "MICROSOFT" && !p.tenantId && inst.allowedEmailDomains.length === 0) w.push("Microsoft sem tenant nem domínio aceito: todos pedem acesso.");
  }
  return w;
}
