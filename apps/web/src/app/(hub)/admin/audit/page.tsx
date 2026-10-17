import { redirect } from "next/navigation";
import { SECONDARY_PAGE_SIZE, countLabel, readPageRequest } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { AuditFilterForm } from "./audit-filters";
import { AuditTable } from "./audit-table";
import { queryAudit, type AuditFilters } from "./query";

/** Parâmetros que o link "Baixar CSV" repassa: os filtros, sem a página (o CSV traz tudo). */
function csvHref(f: AuditFilters) {
  const params = new URLSearchParams(Object.entries(f).filter((e): e is [string, string] => !!e[1] && e[0] !== "id" && e[0] !== "page"));
  return `/api/admin/audit?${params}`;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditFilters> }) {
  await requirePermission("audit:read");
  const f = await searchParams;
  // Antes cada registro abria numa tela própria (?id=). Agora o detalhe vive na linha; link antigo cai na lista.
  if (f.id) {
    const params = new URLSearchParams(Object.entries(f).filter((e): e is [string, string] => !!e[1] && e[0] !== "id"));
    const rest = params.toString();
    redirect(rest ? `/admin/audit?${rest}` : "/admin/audit");
  }
  const { rows, info, targets } = await queryAudit(f, readPageRequest(f, { defaultSize: SECONDARY_PAGE_SIZE }));

  return (
    <div className="max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
          <p className="text-sm text-muted">
            Quem fez o quê e quando. {countLabel(info.total, "registro", "registros")} com esses filtros; abra Detalhes para ver o código da ação, o IP e os dados do evento.
          </p>
        </div>
        <a data-tour="audit-export" href={csvHref(f)} className="text-sm text-accent underline-offset-2 hover:underline">Baixar CSV</a>
      </header>

      <div data-tour="audit-filters">
        <AuditFilterForm filters={f} />
      </div>

      {rows.length === 0 ? (
        <EmptyState tour="audit-table" title="Nenhum registro com esses filtros" description="Ajuste o período, a pessoa ou o tipo de evento." />
      ) : (
        <AuditTable rows={rows} targets={targets} pagination={<Pagination info={info} noun={["registro", "registros"]} params={f} />} />
      )}
    </div>
  );
}
