import { z } from "zod";
import { CHANNEL_PROTOCOLS, LINK_KINDS, SERVICE_KINDS } from "./types";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,62}$/, "Use só letras minúsculas, números e hífen (2 a 63 caracteres), começando por letra ou número.");
export const repoFullNameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/, "Use o formato dono/repositorio.");

export const ingestSpecSchema = z.object({
  spec: z.union([z.string(), z.record(z.string(), z.unknown())]),
  commitSha: z.string().regex(/^[0-9a-f]{7,40}$/i).optional(),
  branch: z.string().max(200).optional(),
});

export const createServiceSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(80, "Nome muito longo (máx. 80)."),
  description: z.string().trim().max(500).optional(),
  ownerTeamId: z.string().optional(),
  visibility: z.enum(["ORG", "TEAM"]).default("ORG"),
  kind: z.enum(SERVICE_KINDS).default("API"),
  tags: z.array(z.string().trim().toLowerCase().max(30)).max(10).default([]),
});

export const linkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("service"), fromId: z.string(), toId: z.string(), kind: z.enum(LINK_KINDS), protocol: z.enum(CHANNEL_PROTOCOLS).optional(), note: z.string().max(300).optional() }),
  z.object({ type: z.literal("repository"), fromId: z.string(), toId: z.string(), kind: z.enum(LINK_KINDS), note: z.string().max(300).optional() }),
  z.object({ type: z.literal("service-repository"), serviceId: z.string(), repositoryId: z.string(), role: z.enum(["SOURCE", "CLIENT_SDK", "INFRA", "CONTRACT"]) }),
]);

/** RN-52: um vínculo não pode apontar para si mesmo. */
export function isSelfLink(input: z.infer<typeof linkSchema>): boolean {
  return input.type !== "service-repository" && input.fromId === input.toId;
}

export const updateServiceSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(80, "Nome muito longo (máx. 80)."),
  description: z.string().trim().max(500).optional(),
  ownerTeamId: z.string().optional(),
  visibility: z.enum(["ORG", "TEAM"]),
  lifecycle: z.enum(["experimental", "production", "deprecated"]),
  kind: z.enum(SERVICE_KINDS).default("API"),
  tags: z.array(z.string().trim().toLowerCase().max(30)).max(10),
});

export const LIFECYCLE_LABEL: Record<string, string> = {
  experimental: "Experimental",
  production: "Em produção",
  deprecated: "Descontinuado",
};

// ─── Variáveis, integrações e documentação ──────────────────────────────

export const envVarSchema = z.object({
  serviceId: z.string(),
  environmentId: z.string(),
  key: z.string().trim().toUpperCase().regex(/^[A-Z_][A-Z0-9_]{0,127}$/, "Nome inválido: use LETRAS_MAIUSCULAS, números e _."),
  value: z.string().max(10_000, "Valor muito grande (máx. 10.000 caracteres)."),
  isSecret: z.boolean(),
  description: z.string().trim().max(2_000).optional(),
});

export const resourceSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(80, "Nome muito longo (máx. 80)."),
  kind: z.enum(["HTTP_API", "QUEUE", "TOPIC", "WEBHOOK", "DATABASE", "CACHE", "STORAGE", "EMAIL_SMS", "OTHER"]),
  provider: z.string().trim().max(60).optional(),
  description: z.string().trim().max(5_000).optional(),
  docsUrl: z.url("URL inválida.").optional(),
});

export const serviceResourceSchema = z.object({
  serviceId: z.string(),
  resourceId: z.string(),
  relation: z.enum(["CONSUMES", "PROVIDES", "PUBLISHES", "SUBSCRIBES", "SENDS_WEBHOOK", "RECEIVES_WEBHOOK", "READS", "WRITES"]),
  note: z.string().trim().max(2_000).optional(),
});

export const docSchema = z.object({
  serviceId: z.string(),
  id: z.string().optional(),
  title: z.string().trim().min(2).max(80),
  content: z.string().max(200_000, "Documento muito grande (máx. 200 mil caracteres)."),
});

export const specSourceSchema = z.object({
  serviceId: z.string(),
  specSource: z.enum(["CI_PUSH", "REPO_FILE", "URL_PULL", "MANUAL_UPLOAD"]),
  specRepositoryId: z.string().optional(),
  specPath: z.string().trim().regex(/^[\w./-]{1,300}$/, "Caminho inválido.").optional(),
  pullUrl: z.string().trim().max(500).optional(),
  pullHeaders: z.string().trim().max(2_000).optional(),
});
