import Link from "next/link";
import { SECONDARY_PAGE_SIZE, countLabel, readPageRequest } from "@api-hub/core";
import { prisma } from "@api-hub/db";
import { requirePermission } from "@/lib/guards";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { FormModal } from "@/components/form-modal";
import { Pagination } from "@/components/pagination";
import { Button, Field, Input } from "@/components/ui";
import { AUDIT_GROUPS, queryAudit, targetNameFor, type AuditFilters } from "./query";
import { AuditDetail } from "./audit-detail";
import { AuditTable } from "./audit-table";

const text = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function href(f: AuditFilters, patch: Partial<AuditFilters> = {}) {
  const next = { ...f, ...patch };
  const p = new URLSearchParams();
  for (const key of ["actor", "group", "from", "to", "target", "size", "id"] as const) {
    const value = next[key];
    if (value) p.set(key, value);
  }
  const s = p.toString();
  return s ? `/admin/audit?${s}` : "/admin/audit";
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditFilters> }) {
  await requirePermission("audit:read");
  const f = await searchParams;
  const id = text(f.id);
  const { rows, info, targets } = await queryAudit(f, readPageRequest(f, { defaultSize: SECONDARY_PAGE_SIZE }));
  const opened = id
    ? await prisma.auditLog.findUnique({ where: { id }, include: { actor: { select: { githubLogin: true, email: true } } } })
    : null;
  const openedName = opened?.targetId ? (await targetNameFor(opened.targetType, opened.targetId)) : undefined;

  return (
    <div className="max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
          <p className="text-sm text-muted">{countLabel(info.total, "registro", "registros")} com esses filtros. Abra um registro para ver o detalhe.</p>
        </div>
        <a data-tour="audit-export" href={`/api/admin/audit?${new URLSearchParams(Object.entries(f).filter((e): e is [string, string] => !!e[1] && e[0] !== "id" && e[0] !== "page"))}`} className="text-sm text-accent">Baixar CSV</a>
      </header>

      {opened ? (
        <div className="space-y-4">
          <Link href={href(f, { id: "" })} className="text-sm text-muted hover:text-ink">← Auditoria</Link>
          <AuditDetail row={opened} targetName={openedName} />
        </div>
      ) : (
        <>
          <div data-tour="audit-filters" className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <form action="/admin/audit" className="flex flex-wrap items-center gap-3">
              {f.group && <input type="hidden" name="group" value={f.group} />}
              {f.from && <input type="hidden" name="from" value={f.from} />}
              {f.to && <input type="hidden" name="to" value={f.to} />}
              {f.size && <input type="hidden" name="size" value={f.size} />}
              <input
                name="actor"
                defaultValue={f.actor}
                placeholder="Buscar pessoa (@usuario)"
                aria-label="Buscar pessoa"
                className="h-11 w-full max-w-sm rounded-control border border-line bg-field px-3 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
            </form>
            <FormModal label={f.from || f.to ? `${f.from || "…"} – ${f.to || "…"}` : "Período"} title="Período" tone="quiet">
              <form action="/admin/audit" className="space-y-4">
                {f.actor && <input type="hidden" name="actor" value={f.actor} />}
                {f.group && <input type="hidden" name="group" value={f.group} />}
                {f.size && <input type="hidden" name="size" value={f.size} />}
                <Field label="De"><Input name="from" type="date" defaultValue={f.from} /></Field>
                <Field label="Até"><Input name="to" type="date" defaultValue={f.to} /></Field>
                <Button type="submit">Aplicar</Button>
              </form>
            </FormModal>
            {(f.from || f.to || f.actor || f.group || f.target) && <Link href="/admin/audit" className="text-sm text-muted hover:text-ink">Limpar</Link>}
          </div>

          <FilterChips
            label="Tipo de evento"
            items={[
              { label: "Todos", href: href(f, { group: "", page: "", id: "" }), active: !f.group },
              ...Object.entries(AUDIT_GROUPS).map(([k, label]) => ({ label, href: href(f, { group: k, page: "", id: "" }), active: f.group === k })),
            ]}
          />
          </div>

          {rows.length === 0 ? (
            <EmptyState tour="audit-table" title="Nenhum registro com esses filtros" description="Ajuste o período, a pessoa ou o tipo de evento." />
          ) : (
            <AuditTable rows={rows} targets={targets} hrefFor={(rowId) => href(f, { id: rowId })} pagination={<Pagination info={info} noun={["registro", "registros"]} params={f} />} />
          )}
        </>
      )}
    </div>
  );
}
