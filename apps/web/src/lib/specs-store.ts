import { prisma } from "@api-hub/db";
import { diffSpecs, listOperations, parseSpec, summarizeDiff, type ChangeSummary, type ParsedSpec } from "@api-hub/core";
import { notifyBreakingChange } from "./break-notice";

export type StoreResult =
  | { status: "unchanged"; id: string; version: string }
  | { status: "published"; id: string; version: string; unknownDependencies: string[]; changeSummary: ChangeSummary | null };

/**
 * Grava uma spec num ambiente (RN-40 a RN-46, RN-91): ignora repetição por checksum,
 * marca como atual só dentro do ambiente e cria as dependências declaradas.
 */
export async function storeSpec(input: {
  serviceId: string;
  environmentId: string;
  raw: string;
  source: "CI_PUSH" | "REPO_FILE" | "URL_PULL" | "MANUAL_UPLOAD";
  commitSha?: string;
  branch?: string;
}): Promise<StoreResult & { spec: ParsedSpec }> {
  const spec = parseSpec(input.raw);
  const previous = await prisma.apiSpec.findFirst({
    where: { serviceId: input.serviceId, environmentId: input.environmentId, isLatest: true },
    select: { id: true, content: true },
  });
  const existing = await prisma.apiSpec.findUnique({
    where: { serviceId_environmentId_checksum: { serviceId: input.serviceId, environmentId: input.environmentId, checksum: spec.checksum } },
  });
  if (existing) {
    if (!existing.isLatest) {
      // Voltou para uma versão anterior: ela passa a ser a atual.
      await prisma.$transaction([
        prisma.apiSpec.updateMany({ where: { serviceId: input.serviceId, environmentId: input.environmentId, isLatest: true }, data: { isLatest: false } }),
        prisma.apiSpec.update({ where: { id: existing.id }, data: { isLatest: true } }),
      ]);
    }
    await indexOperations(input.serviceId, input.environmentId, spec.normalized);
    return { status: "unchanged", id: existing.id, version: existing.version, spec };
  }

  const summary = previous ? summarizeDiff(diffSpecs(previous.content, spec.normalized)) : undefined;
  const created = await prisma.$transaction(async (tx) => {
    await tx.apiSpec.updateMany({ where: { serviceId: input.serviceId, environmentId: input.environmentId, isLatest: true }, data: { isLatest: false } });
    return tx.apiSpec.create({
      data: {
        serviceId: input.serviceId, environmentId: input.environmentId, version: spec.version, format: spec.format, title: spec.title,
        content: spec.normalized, checksum: spec.checksum, sizeBytes: spec.sizeBytes, commitSha: input.commitSha, branch: input.branch,
        source: input.source, isLatest: true, changeSummary: summary ?? undefined,
      },
    });
  });
  await indexOperations(input.serviceId, input.environmentId, spec.normalized);

  // RN-53: dependências declaradas em x-api-hub.dependsOn viram vínculos detectados.
  const unknownDependencies: string[] = [];
  for (const slug of spec.declaredDependencies) {
    const target = await prisma.service.findUnique({ where: { slug } });
    if (!target || target.id === input.serviceId) { unknownDependencies.push(slug); continue; }
    await prisma.serviceDependency.upsert({
      where: { fromServiceId_toServiceId_kind: { fromServiceId: input.serviceId, toServiceId: target.id, kind: "CONSUMES" } },
      create: { fromServiceId: input.serviceId, toServiceId: target.id, kind: "CONSUMES", detected: true },
      update: {},
    });
  }
  if (summary?.breaking) await notifyBreakingChange(input.serviceId, summary);
  return { status: "published", id: created.id, version: created.version, unknownDependencies, spec, changeSummary: summary ?? null };
}

async function indexOperations(serviceId: string, environmentId: string, normalized: string) {
  const ops = listOperations(normalized);
  await prisma.specOperation.deleteMany({ where: { serviceId, environmentId } });
  if (ops.length) {
    await prisma.specOperation.createMany({
      data: ops.map((o) => ({ serviceId, environmentId, method: o.method, path: o.path.slice(0, 500), deprecated: o.deprecated })),
    });
  }
}
