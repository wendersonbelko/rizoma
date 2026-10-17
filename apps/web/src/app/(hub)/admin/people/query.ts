import { prisma } from "@api-hub/db";
import type { PageInfo } from "@api-hub/core";
import { targetNames } from "../audit/query";

/** Quem aparece como autor nas frases de evento. */
const ACTOR = { select: { name: true, githubLogin: true, email: true } } as const;

/** Eventos de acesso (`access.*`) com o que a frase precisa: autor, alvo e metadata. */
const EVENT_SELECT = {
  id: true, createdAt: true, action: true, actorId: true, targetType: true, targetId: true, metadata: true, actor: ACTOR,
} as const;

/** Solicitações pendentes e pessoas já decididas. Solicitação vencida vira EXPIRED antes de listar. */
export async function loadPeople() {
  await prisma.accessRequest.updateMany({ where: { status: "PENDING", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
  const [requests, users, historyTotal] = await Promise.all([
    prisma.accessRequest.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: [{ role: "asc" }, { email: "asc" }, { id: "asc" }],
      include: { teams: { include: { team: { select: { name: true, slug: true } } } } },
    }),
    prisma.auditLog.count({ where: { action: { startsWith: "access." } } }),
  ]);
  return { requests, users, historyTotal };
}

/** Uma página do histórico de decisões, já com os nomes dos alvos. */
export async function loadHistory(info: PageInfo) {
  const entries = await prisma.auditLog.findMany({
    where: { action: { startsWith: "access." } },
    orderBy: { createdAt: "desc" },
    skip: info.skip,
    take: info.take,
    select: EVENT_SELECT,
  });
  return { entries, targets: await targetNames(entries) };
}

/** Últimos eventos de acesso em que a pessoa é autora ou alvo. */
export async function loadPersonEvents(userId: string) {
  const entries = await prisma.auditLog.findMany({
    where: { OR: [{ actorId: userId }, { targetId: userId }], action: { startsWith: "access." } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: EVENT_SELECT,
  });
  return { entries, targets: await targetNames(entries) };
}
