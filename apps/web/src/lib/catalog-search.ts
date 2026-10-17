import type { Prisma } from "@api-hub/db";
import { catalogVisibility, parseEndpointQuery } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";

/**
 * Regras de "quais serviços esta pessoa vê" e "o que casa com a busca", em SQL. Um lugar só para
 * as duas telas que listam serviços: o Catálogo (app/(hub)/_catalog/query.ts) e a busca global ⌘K
 * (app/(hub)/_search/actions.ts). Assim a paleta nunca mostra um serviço que o catálogo esconde.
 *
 * RN-30 é aplicada em SQL, em vez de carregar tudo e filtrar com canSeeService() depois: só assim
 * a paginação reflete o total real. A regra é a mesma: ORG é visível a quem lê o catálogo; TEAM só
 * ao próprio time ou a quem tem catalog:read_private.
 */
export function catalogVisibilityWhere(user: CurrentUser): Prisma.ServiceWhereInput {
  const filter = catalogVisibility(user);
  if (filter.scope === "none") return { id: { in: [] } };
  if (filter.scope === "all") return {};
  return { OR: [{ visibility: "ORG" }, { ownerTeamId: { in: filter.teamIds } }] };
}

/** Operação cujo caminho (e, se a pessoa digitou "GET /pedidos", o método) casa com a busca. */
export function operationMatchWhere(q: string): Prisma.SpecOperationWhereInput {
  const endpoint = parseEndpointQuery(q);
  return endpoint
    ? { method: endpoint.method, path: { contains: endpoint.path, mode: "insensitive" } }
    : { path: { contains: q, mode: "insensitive" } };
}

/** Busca por nome, slug, descrição ou endpoint (o catálogo e o ⌘K usam esta mesma regra). */
export function serviceSearchWhere(q: string): Prisma.ServiceWhereInput {
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { operations: { some: operationMatchWhere(q) } },
    ],
  };
}
