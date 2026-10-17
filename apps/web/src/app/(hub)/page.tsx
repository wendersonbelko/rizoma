import { can, countLabel, readPageRequest } from "@api-hub/core";
import type { QueryParams } from "@api-hub/core/pagination";
import { requirePermission } from "@/lib/guards";
import { getEnvironments } from "@/lib/install";
import { Pagination } from "@/components/pagination";
import { getCatalogPage, getCatalogTeamOptions } from "./_catalog/query";
import { clearFiltersHref, hasCatalogFilters, readCatalogFilters } from "./_catalog/filters";
import { CatalogFilterBar } from "./_catalog/catalog-filters";
import { NoResults } from "./_catalog/no-results";
import { EmptyCatalog } from "./_catalog/empty-catalog";
import { ServiceTable } from "./_catalog/service-table";

/**
 * Página do Catálogo: só busca dados e monta a tela a partir de peças com responsabilidade
 * única (apps/web/src/app/(hub)/_catalog/*). Nenhuma regra de tabela, chip ou paginação mora
 * aqui — quem quiser mudar como uma linha é desenhada mexe em service-row.tsx, não aqui.
 *
 * Filtros (achado D2): `?q=`, `?team=`, `?kind=`, `?lifecycle=`, `?nospec=1`, `?mine=1` e `?tag=`,
 * todos aplicados em SQL por query.ts e mantidos na paginação.
 */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const user = await requirePermission("catalog:read");
  const sp = await searchParams;
  const filters = readCatalogFilters(sp);
  const [envs, teams, { services, info }] = await Promise.all([
    getEnvironments(),
    getCatalogTeamOptions(user),
    getCatalogPage(user, filters, readPageRequest(sp)),
  ]);

  // O serviço novo nasce em /admin/services (um passo só: nome, time e tipo), então basta service:create.
  const canCreate = can(user, "service:create");
  const filtering = hasCatalogFilters(filters);

  return (
    <div className="max-w-6xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Catálogo</h1>
      <p className="mb-6 text-muted">
        {info.total > 0 || filtering
          ? `${countLabel(info.total, "serviço", "serviços")}${filtering ? " com estes filtros" : ""}. A versão de cada ambiente aparece ao lado.`
          : "Os serviços da empresa, com a versão de cada ambiente e os vínculos entre eles."}
      </p>

      <CatalogFilterBar params={sp} filters={filters} teams={teams} canMine={user.teamIds.length > 0} />

      {info.total === 0 && filtering ? (
        <NoResults clearHref={clearFiltersHref(sp)} />
      ) : info.total === 0 ? (
        <EmptyCatalog canCreate={canCreate} />
      ) : (
        <ServiceTable services={services} envs={envs} user={user} pagination={<Pagination info={info} noun={["serviço", "serviços"]} params={sp} />} />
      )}
    </div>
  );
}
