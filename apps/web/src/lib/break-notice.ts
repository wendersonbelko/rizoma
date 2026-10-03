import { prisma } from "@api-hub/db";
import type { ChangeSummary } from "@api-hub/core";
import { audit } from "./audit";
import { sendHubMail } from "./mail";

/**
 * Avisa por e-mail quando a publicação remove endpoint.
 * Destinatários: Owner e Admin ativos, o time do serviço e os times que dependem dele.
 * Sem SMTP, não faz nada.
 */
export async function notifyBreakingChange(serviceId: string, summary: ChangeSummary) {
  if (!summary.breaking) return;
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { slug: true, name: true, ownerTeamId: true },
  });
  if (!service) return;
  const removed = summary.sample.filter((s) => s.kind === "removed");
  const [deps, calls, admins] = await Promise.all([
    prisma.serviceDependency.findMany({ where: { toServiceId: serviceId, kind: "CONSUMES" }, select: { from: { select: { ownerTeamId: true } } } }),
    removed.length
      ? prisma.operationCall.findMany({
        where: { toServiceId: serviceId, OR: removed.map((r) => ({ method: r.method, path: r.path })) },
        select: { from: { select: { ownerTeamId: true } } },
      })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] }, email: { not: null } },
      select: { email: true },
    }),
  ]);
  const teamIds = [...new Set([service.ownerTeamId, ...deps.map((row) => row.from.ownerTeamId), ...calls.map((row) => row.from.ownerTeamId)].filter((id): id is string => !!id))];
  const members = teamIds.length
    ? await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds }, user: { status: "ACTIVE", email: { not: null } } },
      select: { user: { select: { email: true } } },
    })
    : [];
  const emails = [...new Set([
    ...admins.map((user) => user.email),
    ...members.map((member) => member.user.email),
  ].filter((email): email is string => !!email))];
  if (!emails.length) return;
  const lines = summary.sample.map((s) => `${s.method} ${s.path} (${s.kind})`).join("\n");
  const text = `${service.name} publicou uma versão que remove endpoints.\n${summary.added} novos, ${summary.removed} removidos, ${summary.changed} alterados, ${summary.deprecated} descontinuados.\n\n${lines}`;
  const first = await sendHubMail(emails[0]!, `Mudança incompatível em ${service.name}`, text);
  if ("skipped" in first && first.skipped) return;
  let sent = first.ok ? 1 : 0;
  for (const email of emails.slice(1)) {
    const r = await sendHubMail(email, `Mudança incompatível em ${service.name}`, text);
    if (r.ok) sent++;
  }
  await audit({ action: "spec.breaking_notice", targetType: "service", targetId: serviceId, metadata: { slug: service.slug, recipients: emails.length, sent } });
}
