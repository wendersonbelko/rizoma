import { prisma } from "@api-hub/db";
import { buildMatrix, can, canSeeService, toDotenv } from "@api-hub/core";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** RN-86: .env do ambiente, com segredos em branco. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, include: { teams: { select: { teamId: true } } } })
    : null;
  if (!user || user.status !== "ACTIVE" || session!.user.tv !== user.tokenVersion) return new Response("Não encontrado", { status: 404 });
  const subject = { permissions: buildMatrix(await prisma.rolePermission.findMany())[user.role], teamIds: user.teams.map((t) => t.teamId) };

  const { slug } = await params;
  const envSlug = new URL(req.url).searchParams.get("env") ?? "";
  const [service, env] = await Promise.all([prisma.service.findUnique({ where: { slug } }), prisma.environment.findUnique({ where: { slug: envSlug } })]);
  if (!service || !env || !canSeeService(subject, service) || !can(subject, "envvars:read")) return new Response("Não encontrado", { status: 404 });

  const vars = await prisma.serviceEnvVar.findMany({ where: { serviceId: service.id, environmentId: env.id } });
  await audit({ actorId: user.id, action: "envvar.exported", targetType: "service", targetId: service.id, metadata: { env: env.slug, count: vars.length } });
  const body = toDotenv(vars, `${service.name} · ${env.name} · gerado em ${new Date().toISOString()}`);
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${service.slug}.${env.slug}.env"`,
      "Cache-Control": "no-store",
    },
  });
}
