import { prisma, type Prisma } from "@api-hub/db";
import { RESOURCE_KIND_LABEL, can, pageInfo, queryWith, readPageRequest, type QueryParams, type ResourceKind } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { getEnvironments } from "@/lib/install";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { Pagination } from "@/components/pagination";
import { FormModal } from "@/components/form-modal";
import { LinkButton } from "@/components/ui";
import { ResourceForm } from "./form";
import { ResourcesTable } from "./resources-table";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const user = await requirePermission("catalog:read");
  const sp = await searchParams;
  // Um ?kind= que não existe é ignorado (antes virava erro do banco).
  const rawKind = first(sp.kind);
  const kind = rawKind && Object.hasOwn(RESOURCE_KIND_LABEL, rawKind) ? (rawKind as ResourceKind) : undefined;
  const envs = await getEnvironments();
  const canEdit = can(user, "link:edit");
  const where: Prisma.ExternalResourceWhereInput = kind ? { kind } : {};
  const [total, counts] = await Promise.all([
    prisma.externalResource.count({ where }),
    prisma.externalResource.groupBy({ by: ["kind"], _count: true }),
  ]);
  const info = pageInfo(total, readPageRequest(sp));
  const resources = await prisma.externalResource.findMany({
    where,
    include: { services: { include: { service: { select: { slug: true, name: true, archivedAt: true } } } } },
    orderBy: { name: "asc" },
    skip: info.skip,
    take: info.take,
  });

  // Trocar o tipo volta para a página 1 e mantém o "por página" escolhido.
  const kindHref = (value: string | undefined) => {
    const qs = queryWith(sp, { kind: value, page: undefined });
    return qs === "?" ? "/integrations" : qs;
  };

  return (
    <div className="max-w-6xl space-y-6">
      <header data-tour="integrations-header" className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrações externas</h1>
          <p className="text-muted">APIs de terceiros, filas, tópicos, webhooks e bancos usados pelos serviços.</p>
        </div>
        {canEdit && (
          // Id fixo: o ⌘K e o "+ Novo" abrem este modal por /integrations#new-integration.
          <FormModal id="new-integration" label="Nova integração" title="Nova integração" description="Dê um nome e escolha o tipo. Os endereços por ambiente podem ficar para depois." size="md" tone="primary">
            <ResourceForm envs={envs} />
          </FormModal>
        )}
      </header>

      <FilterChips
        label="Filtrar por tipo"
        tour="integrations-filters"
        items={[
          { label: "Todas", href: kindHref(undefined), active: !kind },
          ...counts.map((c) => ({ label: `${RESOURCE_KIND_LABEL[c.kind]} (${c._count})`, href: kindHref(c.kind), active: kind === c.kind })),
        ]}
      />

      {resources.length === 0 ? (
        <EmptyState
          tour="integrations-list"
          title={kind ? "Nenhuma integração deste tipo" : "Nenhuma integração cadastrada"}
          description="Cadastre as APIs de terceiros, filas e bancos de que os serviços dependem."
          action={canEdit ? <LinkButton href="#new-integration">Nova integração</LinkButton> : undefined}
        />
      ) : (
        <ResourcesTable resources={resources} pagination={<Pagination info={info} noun={["integração", "integrações"]} params={sp} />} />
      )}
    </div>
  );
}
