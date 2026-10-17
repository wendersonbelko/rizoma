import { prisma } from "@api-hub/db";
import { can } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { buildChecklist, type Checklist } from "./checklist";
import type { ServiceDetail } from "./types";

/**
 * Fatos para o checklist "Rascunho" (achado M2 da auditoria de UX de 02/10/2026). Duas consultas
 * leves, só para quem gerencia o serviço: ter alguma spec e ter um token de CI ativo.
 * O token só é consultado quando a origem é o CI; nos outros jeitos o passo nem existe.
 */
export async function loadChecklist(user: CurrentUser, service: ServiceDetail): Promise<Checklist> {
  const [spec, token] = await Promise.all([
    prisma.apiSpec.findFirst({ where: { serviceId: service.id }, select: { id: true } }),
    service.specSource === "CI_PUSH"
      ? prisma.serviceToken.findFirst({
          where: { serviceId: service.id, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          select: { id: true },
        })
      : null,
  ]);
  return buildChecklist({
    serviceId: service.id,
    slug: service.slug,
    teamName: service.ownerTeam?.name ?? null,
    visibility: service.visibility,
    specSource: service.specSource,
    hasSourceRepository: service.repositories.some((r) => r.role === "SOURCE"),
    hasSpec: spec !== null,
    hasActiveToken: token !== null,
    canLink: can(user, "link:edit"),
    canToken: can(user, "token:manage"),
  });
}
