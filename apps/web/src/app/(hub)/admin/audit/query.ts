import { prisma, type Prisma } from "@api-hub/db";
import { pageInfo, personLabel, type PageRequest } from "@api-hub/core";
import { AUDIT_GROUP_LIST } from "./events";

export type AuditFilters = { actor?: string; group?: string; from?: string; to?: string; target?: string; page?: string; size?: string; id?: string };

function auditWhere(f: AuditFilters): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [];
  const group = AUDIT_GROUP_LIST.find((g) => g.key === f.group);
  if (group) and.push({ OR: group.prefixes.map((startsWith) => ({ action: { startsWith } })) });
  if (f.actor?.trim()) {
    const typed = f.actor.trim().replace(/^@/, "");
    const who = typed.toLowerCase();
    // O filtro "Pessoa" aceita @usuário, e-mail ou parte do nome. @usuário e e-mail seguem exatos, como antes.
    and.push({
      actor: {
        OR: [
          { githubLogin: who },
          ...(who.includes("@") ? [{ email: who }] : []),
          { name: { contains: typed, mode: "insensitive" as const } },
        ],
      },
    });
  }
  if (f.target) and.push({ targetId: f.target.trim() });
  const from = f.from ? new Date(`${f.from}T00:00:00`) : null;
  const to = f.to ? new Date(`${f.to}T23:59:59.999`) : null;
  if ((from && !isNaN(+from)) || (to && !isNaN(+to))) {
    and.push({ createdAt: { ...(from && !isNaN(+from) ? { gte: from } : {}), ...(to && !isNaN(+to) ? { lte: to } : {}) } });
  }
  return and.length ? { AND: and } : {};
}

export async function queryAudit(f: AuditFilters, request: PageRequest) {
  const where = auditWhere(f);
  const info = pageInfo(await prisma.auditLog.count({ where }), request);
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: info.skip,
    take: info.take,
    include: { actor: { select: { name: true, githubLogin: true, email: true } } },
  });
  return { rows, info, targets: await targetNames(rows) };
}

/**
 * Nomes legíveis para os alvos (serviço, pessoa, time, integração) em vez do id interno. Pessoa usa
 * `personLabel`, que nunca devolve vazio nem "@null" (achado V1 da auditoria de UX de 02/10/2026).
 * Quem foi apagado simplesmente não aparece no mapa, e a frase omite o alvo.
 */
export async function targetNames(rows: { targetType: string | null; targetId: string | null }[]) {
  const ids = (type: string) => [...new Set(rows.filter((r) => r.targetType === type && r.targetId).map((r) => r.targetId!))];
  const [services, users, teams, integrations] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: ids("service") } }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { id: { in: ids("user") } }, select: { id: true, name: true, githubLogin: true, email: true } }),
    prisma.team.findMany({ where: { id: { in: ids("team") } }, select: { id: true, name: true } }),
    prisma.externalResource.findMany({ where: { id: { in: ids("integration") } }, select: { id: true, name: true } }),
  ]);
  const names = new Map<string, string>();
  for (const x of [...services, ...teams, ...integrations]) names.set(x.id, x.name);
  for (const x of users) names.set(x.id, personLabel(x));
  return Object.fromEntries(names);
}
