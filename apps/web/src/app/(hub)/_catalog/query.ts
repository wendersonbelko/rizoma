import { prisma, type Prisma } from "@api-hub/db";
import { catalogVisibility, pageInfo, type PageRequest } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";

export type CatalogFilters = { q?: string; tag?: string };

export type CatalogService = Prisma.ServiceGetPayload<{
  include: {
    ownerTeam: { select: { name: true } };
    specs: { where: { isLatest: true }; select: { version: true; environmentId: true; createdAt: true } };
    channels: { select: { protocol: true } };
    resources: { select: { resource: { select: { kind: true; provider: true } } } };
    _count: { select: { incoming: true; outgoing: true; resources: true } };
  };
}>;

/**
 * Camada de dados do catálogo, separada da apresentação (mesmo padrão de admin/audit/query.ts):
 * a página só chama isto e desenha o resultado — não sabe como o Prisma monta o `where`.
 *
 * RN-30 é aplicada aqui em SQL, em vez de carregar tudo e filtrar com canSeeService() depois:
 * só assim a paginação reflete o total real. A regra é a mesma: ORG é visível a quem lê o
 * catálogo; TEAM só ao próprio time ou a quem tem catalog:read_private.
 */
function visibilityWhere(user: CurrentUser): Prisma.ServiceWhereInput {
  const filter = catalogVisibility(user);
  if (filter.scope === "none") return { id: { in: [] } };
  if (filter.scope === "all") return {};
  return { OR: [{ visibility: "ORG" }, { ownerTeamId: { in: filter.teamIds } }] };
}

function searchWhere(q: string): Prisma.ServiceWhereInput {
  const methodPath = q.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)\s+(\S+)$/i);
  const operation: Prisma.ServiceWhereInput = methodPath
    ? { operations: { some: { method: methodPath[1]!.toUpperCase(), path: { contains: methodPath[2], mode: "insensitive" } } } }
    : { operations: { some: { path: { contains: q, mode: "insensitive" } } } };
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q } },
      { description: { contains: q, mode: "insensitive" } },
      operation,
    ],
  };
}

export async function getCatalogPage(user: CurrentUser, filters: CatalogFilters, request: PageRequest) {
  const { q = "", tag } = filters;
  const where: Prisma.ServiceWhereInput = {
    AND: [
      { archivedAt: null },
      visibilityWhere(user),
      ...(q ? [searchWhere(q)] : []),
      ...(tag ? [{ tags: { has: tag } }] : []),
    ],
  };

  const info = pageInfo(await prisma.service.count({ where }), request);
  const services = await prisma.service.findMany({
    where,
    include: {
      ownerTeam: { select: { name: true } },
      specs: { where: { isLatest: true }, select: { version: true, environmentId: true, createdAt: true } },
      channels: { select: { protocol: true } },
      resources: { select: { resource: { select: { kind: true, provider: true } } } },
      _count: { select: { incoming: true, outgoing: true, resources: true } },
    },
    orderBy: { name: "asc" },
    skip: info.skip,
    take: info.take,
  });

  return { services, info };
}
