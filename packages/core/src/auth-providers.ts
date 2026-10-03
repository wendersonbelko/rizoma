import { z } from "zod";

export const AUTH_PROVIDER_TYPES = ["GITHUB", "GOOGLE", "MICROSOFT", "GITLAB", "FACEBOOK", "OIDC", "CREDENTIALS"] as const;
export type AuthProviderType = (typeof AUTH_PROVIDER_TYPES)[number];

/** Id usado pelo Auth.js em rotas e botões. */
export const AUTHJS_ID: Record<AuthProviderType, string> = {
  GITHUB: "github",
  GOOGLE: "google",
  MICROSOFT: "microsoft-entra-id",
  GITLAB: "gitlab",
  FACEBOOK: "facebook",
  OIDC: "oidc",
  CREDENTIALS: "credentials",
};

export const PROVIDER_META: Record<AuthProviderType, {
  label: string;
  affiliation: string;
  fields: ("clientId" | "clientSecret" | "issuer" | "tenantId" | "label" | "allowSignup")[];
  help: string;
}> = {
  GITHUB: { label: "GitHub", affiliation: "membro ativo de uma organização do GitHub", fields: ["clientId", "clientSecret"], help: "Organização → Settings → Developer settings → OAuth Apps." },
  GOOGLE: { label: "Google", affiliation: "e-mail verificado de um domínio aceito (Google Workspace)", fields: ["clientId", "clientSecret"], help: "Google Cloud Console → APIs e serviços → Credenciais → ID do cliente OAuth (aplicativo da Web)." },
  MICROSOFT: { label: "Microsoft", affiliation: "conta do diretório (tenant) informado ou de um domínio aceito", fields: ["clientId", "clientSecret", "tenantId"], help: "Entra ID → Registros de aplicativo → Novo registro. Use o ID do diretório para aceitar só a sua empresa." },
  GITLAB: { label: "GitLab", affiliation: "e-mail de um domínio aceito", fields: ["clientId", "clientSecret", "issuer"], help: "GitLab → Preferences → Applications (escopos read_user e openid). Para GitLab próprio, informe a URL." },
  FACEBOOK: { label: "Facebook", affiliation: "não comprova vínculo: todo acesso passa por aprovação", fields: ["clientId", "clientSecret"], help: "Meta for Developers → Meus apps → Login do Facebook." },
  OIDC: { label: "OIDC (Keycloak, Okta, Auth0…)", affiliation: "e-mail verificado de um domínio aceito", fields: ["label", "issuer", "clientId", "clientSecret"], help: "Qualquer provedor OpenID Connect. O emissor precisa publicar /.well-known/openid-configuration." },
  CREDENTIALS: { label: "E-mail e senha", affiliation: "não comprova vínculo: entra por convite ou por aprovação", fields: ["allowSignup"], help: "Sessão em JWT. Contas criadas por convite do administrador (ou cadastro com aprovação, se liberado)." },
};

const secret = z.string().trim().min(8, "Informe o client secret.");
const clientId = z.string().trim().min(2, "Informe o client ID.").max(200);
const url = z.url("URL inválida.").refine((u) => u.startsWith("https://") || u.startsWith("http://localhost"), "Use HTTPS.");

/**
 * Configuração de um provedor vinda da tela. `clientSecret` vazio num provedor já salvo
 * mantém o secret atual (RN-101).
 */
export const providerInputSchema = z.object({
  type: z.enum(AUTH_PROVIDER_TYPES),
  clientId: z.string().trim().optional(),
  clientSecret: z.string().trim().optional(),
  issuer: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
  label: z.string().trim().max(40).optional(),
  allowSignup: z.boolean().optional(),
}).superRefine((p, ctx) => {
  const need = PROVIDER_META[p.type].fields;
  const err = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message: `${PROVIDER_META[p.type].label}: ${message}` });
  if (need.includes("clientId") && !clientId.safeParse(p.clientId).success) err("clientId", "informe o client ID.");
  if (p.type === "GOOGLE" && p.clientId && !p.clientId.endsWith(".apps.googleusercontent.com")) err("clientId", "o client ID do Google termina em .apps.googleusercontent.com.");
  if (p.type === "FACEBOOK" && p.clientId && !/^\d{6,20}$/.test(p.clientId)) err("clientId", "o App ID do Facebook é numérico.");
  if (p.type === "MICROSOFT" && p.tenantId && !/^([0-9a-f-]{36}|[a-z0-9.-]+\.[a-z]{2,})$/i.test(p.tenantId)) err("tenantId", "use o ID do diretório (GUID) ou o domínio do tenant.");
  if (p.type === "OIDC") {
    if (!p.issuer || !url.safeParse(p.issuer).success) err("issuer", "informe a URL HTTPS do emissor.");
    if (!p.label) err("label", "informe o nome do botão (ex.: Keycloak).");
  }
  if (p.type === "GITLAB" && p.issuer && !url.safeParse(p.issuer).success) err("issuer", "URL da instância inválida.");
  if (p.clientSecret !== undefined && p.clientSecret !== "" && !secret.safeParse(p.clientSecret).success) err("clientSecret", "client secret muito curto.");
});

export type ProviderInput = z.infer<typeof providerInputSchema>;

export const providersInputSchema = z
  .array(providerInputSchema)
  .min(1, "Escolha pelo menos uma forma de login.")
  .refine((l) => new Set(l.map((p) => p.type)).size === l.length, "Forma de login repetida.");
