import { prisma } from "@api-hub/db";
import { safeEqual, sha256 } from "@api-hub/core";
import { syncService } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * RN-125: sincronização agendada dos serviços que leem a spec de URL ou do repositório.
 * Chame por um cron (Kubernetes CronJob, GitHub Actions agendado etc.):
 *   curl -X POST -H "Authorization: Bearer TOKEN" https://hub/api/v1/sync
 * O TOKEN é o gerado em Configurações → Repositórios (só o hash fica no banco).
 */
export async function POST(req: Request) {
  const inst = await prisma.installation.findUnique({ where: { id: "singleton" }, select: { syncTokenHash: true } });
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "");
  if (!inst?.syncTokenHash || got.length < 16 || !safeEqual(sha256(got), inst.syncTokenHash)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const services = await prisma.service.findMany({ where: { archivedAt: null, specSource: { in: ["URL_PULL", "REPO_FILE"] } }, select: { id: true, slug: true } });
  const report: Record<string, unknown> = {};
  for (const s of services) report[s.slug] = await syncService(s.id, null);
  return Response.json({ services: services.length, report });
}
