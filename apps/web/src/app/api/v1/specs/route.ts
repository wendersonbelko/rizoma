import { prisma } from "@api-hub/db";
import { ingestSpecSchema, resolveEnvironment, sha256, SpecError, MAX_SPEC_BYTES } from "@api-hub/core";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { storeSpec } from "@/lib/specs-store";

export const dynamic = "force-dynamic";

const err = (status: number, error: string, extra?: object) => Response.json({ error, ...extra }, { status });

/**
 * Publicação de spec pelo CI (RN-40 a RN-47, RN-90 a RN-91).
 *   POST /api/v1/specs
 *   Authorization: Bearer ahub_...
 *   Content-Type: application/json  → { "spec": <objeto ou texto>, "commitSha": "...", "branch": "main", "environment"?: "hml" }
 *   Content-Type: application/yaml  → corpo é a própria spec; ?commitSha=&branch=&environment=
 * O ambiente é o informado em `environment` ou o primeiro cuja regra de branch casar.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token.startsWith("ahub_")) return err(401, "Token ausente.");

  const found = await prisma.serviceToken.findUnique({ where: { hash: sha256(token) }, include: { service: true } });
  if (!found || found.revokedAt || (found.expiresAt && found.expiresAt < new Date()) || found.service.archivedAt) {
    return err(401, "Token inválido, revogado ou expirado.");
  }
  if (!rateLimit(`ingest:${found.id}`, 30, 60_000)) return err(429, "Limite de 30 publicações por minuto.");

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_SPEC_BYTES + 64_000) return err(413, "Spec maior que 5 MB.");

  const url = new URL(req.url);
  let raw: string;
  let commitSha: string | undefined;
  let branch: string | undefined;
  let envSlug: string | undefined = url.searchParams.get("environment") ?? undefined;
  const type = req.headers.get("content-type") ?? "";

  if (type.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const parsed = ingestSpecSchema.safeParse(body);
    if (!parsed.success) return err(422, "Corpo inválido. Esperado { spec, commitSha?, branch?, environment? }.");
    raw = typeof parsed.data.spec === "string" ? parsed.data.spec : JSON.stringify(parsed.data.spec);
    ({ commitSha, branch } = parsed.data);
    if (typeof body?.environment === "string") envSlug = body.environment;
  } else {
    raw = await req.text();
    commitSha = url.searchParams.get("commitSha") ?? undefined;
    branch = url.searchParams.get("branch") ?? undefined;
  }

  const envs = await prisma.environment.findMany({ orderBy: { position: "asc" } });
  const env = envSlug ? envs.find((e) => e.slug === envSlug) : branch ? resolveEnvironment(envs, branch) : envs.find((e) => e.isProduction) ?? null;
  if (!env) {
    return err(422, envSlug
      ? `Ambiente "${envSlug}" não existe.`
      : `A branch "${branch}" não corresponde a nenhum ambiente. Informe "environment" ou ajuste as regras em Configurações → Ambientes.`,
      { environments: envs.map((e) => ({ slug: e.slug, branches: e.branchPatterns })) });
  }

  let result;
  try {
    result = await storeSpec({ serviceId: found.serviceId, environmentId: env.id, raw, source: "CI_PUSH", commitSha, branch });
  } catch (e) {
    return err(422, e instanceof SpecError ? e.message : "Spec inválida.");
  }
  await prisma.serviceToken.update({ where: { id: found.id }, data: { lastUsedAt: new Date() } });
  if (result.status === "unchanged") return Response.json({ status: "unchanged", id: result.id, version: result.version, environment: env.slug });

  await audit({ action: "spec.published", targetType: "service", targetId: found.serviceId, metadata: { version: result.version, env: env.slug, token: found.prefix, commitSha: commitSha ?? null, branch: branch ?? null } });
  return Response.json({ status: "published", id: result.id, version: result.version, environment: env.slug, unknownDependencies: result.unknownDependencies, changeSummary: result.changeSummary }, { status: 201 });
}
