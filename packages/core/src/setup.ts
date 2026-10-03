import { z } from "zod";
import { providersInputSchema } from "./auth-providers";
import { branchPatternRegex, envSlugSchemaRegex } from "./environments";
import { HEX } from "./themes";
import { mailSettingsSchema } from "./mail";
import { SOURCE_PROVIDERS } from "./sources";

/** Quem fez isso e onde saber mais — exibido na tela de boas-vindas do assistente. */
export const CREDITS = { name: "Belko", url: "https://belko.com.br" } as const;

/** Ordem fixa do assistente de instalação (RN-60 a RN-68).
 *  "welcome" e "database" não passam pelo POST /api/setup: o primeiro é só informativo,
 *  e o segundo só é considerado concluído quando o servidor já enxerga o banco (RN-91). */
export const SETUP_STEPS = [
  { id: "welcome", title: "Bem-vindo", description: "O que o hub é, o que este assistente configura e o que ter em mãos." },
  { id: "database", title: "Banco de dados", description: "Escolha, teste e acompanhe as migrations do banco." },
  { id: "login", title: "Formas de login", description: "Escolha como as pessoas vão entrar: redes sociais, provedores corporativos ou e-mail e senha." },
  { id: "email", title: "E-mail", description: "Servidor SMTP para convite e nova senha. Pode pular e configurar depois." },
  { id: "organization", title: "Organização", description: "Nome da empresa, título do sistema e o que conta como vínculo com a empresa." },
  { id: "repositories", title: "Repositórios", description: "Onde está o código e de onde as specs podem ser lidas." },
  { id: "policies", title: "Regras de acesso", description: "Quem entra direto e quem precisa de aprovação." },
  { id: "environments", title: "Ambientes", description: "Dev, homologação, produção ou outros, e quais branches caem em cada um." },
  { id: "owner", title: "Primeiro administrador", description: "Quem será o OWNER da instalação." },
  { id: "review", title: "Revisar e concluir", description: "Confira tudo e libere o hub." },
] as const;

export type SetupStepId = (typeof SETUP_STEPS)[number]["id"];

const LEGACY_STEP: Record<string, SetupStepId> = {
  verificacao: "welcome",
  banco_dados: "database",
  organizacao: "organization",
  repositorios: "repositories",
  politicas: "policies",
  ambientes: "environments",
  administrador: "owner",
  revisao: "review",
};

/** Aceita o id antigo gravado no banco e devolve o id em inglês. */
export function canonicalStep(id: string | null | undefined): SetupStepId {
  if (!id) return "welcome";
  if (LEGACY_STEP[id]) return LEGACY_STEP[id];
  return (SETUP_STEPS.some((s) => s.id === id) ? id : "welcome") as SetupStepId;
}

export function stepIndex(id: SetupStepId): number {
  return SETUP_STEPS.findIndex((s) => s.id === id);
}

export function nextStep(id: SetupStepId): SetupStepId {
  const i = stepIndex(id);
  return SETUP_STEPS[Math.min(i + 1, SETUP_STEPS.length - 1)]!.id;
}

const githubName = z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{0,38})$/, "Nome de organização do GitHub inválido.");
const domain = z.string().trim().toLowerCase().transform((d) => d.replace(/^@/, "")).pipe(z.string().regex(/^([a-z0-9-]+\.)+[a-z]{2,}$/, "Domínio inválido (ex.: acme.com.br)."));

export const environmentInputSchema = z.object({
  id: z.string().optional(),
  slug: z.string().trim().toLowerCase().regex(envSlugSchemaRegex, "Identificador do ambiente: letras minúsculas, números e hífen (até 20)."),
  name: z.string().trim().min(2).max(40),
  branchPatterns: z.array(z.string().trim().regex(branchPatternRegex, "Padrão de branch inválido.")).min(1, "Informe ao menos uma branch ou padrão."),
  syncBranch: z.string().trim().max(100).optional(),
  color: z.string().regex(HEX, "Cor inválida."),
  isProduction: z.boolean(),
});

export const environmentsInputSchema = z
  .array(environmentInputSchema)
  .min(1, "Crie pelo menos um ambiente.")
  .max(10)
  .refine((l) => new Set(l.map((e) => e.slug)).size === l.length, "Dois ambientes com o mesmo identificador.");

export const sourceInputSchema = z.object({
  type: z.enum(SOURCE_PROVIDERS),
  baseUrl: z.string().trim().optional(),
  token: z.string().trim().optional(),
});

/** Motores de banco que a tela "Banco de dados" pode oferecer. Só "postgresql" está pronto hoje:
 *  o schema usa arrays e JSON nativos do Postgres. Os demais aparecem desabilitados ("em breve"). */
export const DATABASE_ENGINES = ["postgresql", "mysql", "sqlite", "sqlserver"] as const;
export type DatabaseEngine = (typeof DATABASE_ENGINES)[number];
export const SUPPORTED_DATABASE_ENGINES: DatabaseEngine[] = ["postgresql"];

export const databaseFieldsSchema = z.object({
  host: z.string().trim().min(1, "Informe o host."),
  port: z.coerce.number().int().min(1).max(65535).default(5432),
  database: z.string().trim().min(1, "Informe o nome do banco."),
  user: z.string().trim().min(1, "Informe o usuário."),
  password: z.string(),
  ssl: z.boolean().default(false),
});

export const databaseInputSchema = z.union([
  z.object({ mode: z.literal("url"), url: z.string().trim().min(10, "Informe a URL de conexão.") }),
  z.object({ mode: z.literal("fields") }).extend(databaseFieldsSchema.shape),
]);
export type DatabaseInput = z.infer<typeof databaseInputSchema>;

/** Só as etapas que o assistente de fato grava via POST /api/setup precisam de validação aqui. */
export const setupSchemas = {
  login: z.object({ providers: providersInputSchema }),
  email: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("skip") }),
    z.object({ mode: z.literal("save"), settings: mailSettingsSchema }),
  ]),
  organization: z.object({
    orgName: z.string().trim().min(2).max(80),
    orgSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, "Use letras minúsculas, números e hífen."),
    appName: z.string().trim().min(2).max(40),
    allowedGithubOrgs: z.array(githubName).max(10),
    allowedEmailDomains: z.array(domain).max(20),
  }),
  repositories: z.object({ sources: z.array(sourceInputSchema).max(4) }),
  policies: z.object({
    autoApproveOrgMembers: z.boolean(),
    outsiderPolicy: z.enum(["REQUEST_APPROVAL", "BLOCK"]),
    sessionMaxAgeHours: z.number().int().min(1).max(72),
    membershipRecheckHours: z.number().int().min(1).max(72),
    accessRequestTtlDays: z.number().int().min(1).max(90),
  }),
  environments: z.object({ environments: environmentsInputSchema }),
  owner: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("provider"), ownerIdentifier: z.string().trim().toLowerCase().min(2).max(120) }),
    z.object({
      mode: z.literal("password"),
      name: z.string().trim().min(2).max(80),
      email: z.email("E-mail inválido.").transform((e) => e.toLowerCase()),
      password: z.string(),
    }),
  ]),
  review: z.object({ confirm: z.literal(true) }),
} satisfies Partial<Record<SetupStepId, z.ZodTypeAny>>;
