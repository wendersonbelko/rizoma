import { can, countLabel, readPageRequest } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { getEnvironments } from "@/lib/install";
import { Pagination } from "@/components/pagination";
import { getCatalogPage } from "./_catalog/query";
import { CatalogSearchForm } from "./_catalog/search-form";
import { ActiveTagFilter } from "./_catalog/active-tag-filter";
import { NoResults } from "./_catalog/no-results";
import { EmptyCatalog } from "./_catalog/empty-catalog";
import { ServiceTable } from "./_catalog/service-table";

/**
 * Página do Catálogo: só busca dados e monta a tela a partir de peças com responsabilidade
 * única (apps/web/src/app/(hub)/_catalog/*). Nenhuma regra de tabela, chip ou paginação mora
 * aqui — quem quiser mudar como uma linha é desenhada mexe em service-row.tsx, não aqui.
 */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string; page?: string; size?: string }> }) {
  const user = await requirePermission("catalog:read");
  const sp = await searchParams;
  const { q = "", tag } = sp;
  const envs = await getEnvironments();
  const { services, info } = await getCatalogPage(user, { q, tag }, readPageRequest(sp));

  const canCreate = can(user, "service:create") && can(user, "link:edit");
  const filtering = Boolean(q || tag);

  return (
    <div className="max-w-6xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Catálogo de APIs</h1>
      {info.total > 0 && <p className="mb-6 text-muted">{countLabel(info.total, "serviço", "serviços")}. A versão de cada ambiente aparece ao lado.</p>}

      <CatalogSearchForm defaultValue={q} pageSize={sp.size} />
      {tag && <ActiveTagFilter tag={tag} q={q} />}

      {info.total === 0 && filtering ? (
        <NoResults />
      ) : info.total === 0 ? (
        <EmptyCatalog canCreate={canCreate} />
      ) : (
        <ServiceTable services={services} envs={envs} pagination={<Pagination info={info} noun={["serviço", "serviços"]} params={sp} />} />
      )}
    </div>
  );
}
