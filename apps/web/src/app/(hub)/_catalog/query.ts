import { prisma, type Prisma } from "@api-hub/db";
import { pageInfo, type PageRequest } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { catalogVisibilityWhere, serviceSearchWhere } from "@/lib/catalog-search";
import { NO_TEAM, type CatalogFilters, type CatalogTeamOption } from "./filters";

export type CatalogService = Prisma.ServiceGetPayload<{
  include: {
    ownerTeam: { select: { name: true } };
    specs: { where: { isLatest: true }; select: { version: true; environmentId: true } };
    _count: { select: { incoming: true; outgoing: true; resources: true } };
  };
}>;

/**
 * Camada de dados do catálogo, separada da apresentação (mesmo padrão de admin/audit/query.ts):
 * a página só chama isto e desenha o resultado — não sabe como o Prisma monta o `where`.
 *
 * RN-30 é aplicada aqui em SQL, em vez de carregar tudo e filtrar com canSeeService() depois:
 * só assim a paginação reflete o total real. A regra (visibilidade e busca por nome, slug,
 * descrição ou endpoint) mora em lib/catalog-search.ts, porque a busca global ⌘K usa a mesma.
 */

/** Serviços que aparecem no catálogo para esta pessoa: não arquivados e visíveis (RN-30). */
function listedWhere(user: CurrentUser): Prisma.ServiceWhereInput {
  return { AND: [{ archivedAt: null }, catalogVisibilityWhere(user)] };
}

/**
 * Achado D2 da auditoria de UX de 02/10/2026: time, tipo, situação, "sem spec" e "meus serviços"
 * também são filtrados aqui, em SQL, para o total da paginação continuar sendo o real.
 */
function filtersWhere(user: CurrentUser, f: CatalogFilters): Prisma.ServiceWhereInput[] {
  return [
    ...(f.q ? [serviceSearchWhere(f.q)] : []),
    ...(f.tag ? [{ tags: { has: f.tag } }] : []),
    ...(f.team ? [f.team === NO_TEAM ? { ownerTeamId: null } : { ownerTeam: { slug: f.team } }] : []),
    ...(f.kind ? [{ kind: f.kind }] : []),
    ...(f.lifecycle ? [{ lifecycle: f.lifecycle }] : []),
    // "Sem spec" = nenhuma spec atual em ambiente nenhum, o mesmo critério do selo "Sem spec" da linha.
    ...(f.noSpec ? [{ specs: { none: { isLatest: true } } }] : []),
    ...(f.mine ? [{ ownerTeamId: { in: user.teamIds } }] : []),
  ];
}

export async function getCatalogPage(user: CurrentUser, filters: CatalogFilters, request: PageRequest) {
  const where: Prisma.ServiceWhereInput = { AND: [listedWhere(user), ...filtersWhere(user, filters)] };

  const info = pageInfo(await prisma.service.count({ where }), request);
  const services = await prisma.service.findMany({
    where,
    include: {
      ownerTeam: { select: { name: true } },
      specs: { where: { isLatest: true }, select: { version: true, environmentId: true } },
      _count: { select: { incoming: true, outgoing: true, resources: true } },
    },
    orderBy: { name: "asc" },
    skip: info.skip,
    take: info.take,
  });

  return { services, info };
}

/**
 * Opções do filtro "Time": só times que têm algum serviço visível para esta pessoa (um time sem
 * serviço não filtra nada) e, se houver, "Sem time". O valor é o slug do time — estável e legível na URL.
 */
export async function getCatalogTeamOptions(user: CurrentUser): Promise<CatalogTeamOption[]> {
  const listed = listedWhere(user);
  const [teams, withoutTeam] = await Promise.all([
    prisma.team.findMany({ where: { services: { some: listed } }, select: { slug: true, name: true }, orderBy: { name: "asc" } }),
    prisma.service.count({ where: { AND: [listed, { ownerTeamId: null }] } }),
  ]);
  return [
    ...teams.map((t) => ({ value: t.slug, label: t.name })),
    ...(withoutTeam > 0 ? [{ value: NO_TEAM, label: "Sem time" }] : []),
  ];
}
