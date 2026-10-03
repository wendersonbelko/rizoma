import { Fragment, type ReactNode } from "react";
import { pageWindow, type PageInfo } from "@api-hub/core/pagination";
import { plural } from "@api-hub/core/text";

/** Nome do item listado no singular e no plural: ["serviço", "serviços"]. */
export type Noun = readonly [one: string, many: string];

/** Como a tela chega a uma página: link (paginação por URL) ou botão (estado local). */
export type PageControl = (props: { page: number; label: string; className: string; children: ReactNode }) => ReactNode;

const item = "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-control px-2 tabular-nums";
const linkClass = `${item} text-ink hover:bg-paper`;
const currentClass = `${item} bg-accent font-semibold text-accent-ink`;
const disabledClass = `${item} cursor-not-allowed text-muted opacity-50`;

/**
 * Barra de paginação: "Mostrando 1–10 de 123 serviços", seletor "Por página" e os números de
 * página. Só desenha — quem sabe navegar é o `control` recebido (ver Pagination e
 * ClientPagination). Aparece mesmo com uma página só, para a listagem ter sempre a mesma cara.
 */
export function PaginationBar({ info, noun, control, sizeControl, framed }: {
  info: PageInfo; noun: Noun; control: PageControl; sizeControl?: ReactNode;
  /** Fora de uma DataTable (ex.: lista de seções), a barra ganha o próprio card. */
  framed?: boolean;
}) {
  const { page, pages, from, to, total } = info;
  if (total === 0) return null;

  const edge = (target: number, label: string, children: ReactNode, enabled: boolean) =>
    enabled ? control({ page: target, label, className: linkClass, children }) : <span aria-disabled="true" className={disabledClass}>{children}</span>;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm ${framed ? "rounded-panel border border-line bg-sheet px-4 py-2.5" : ""}`}>
      <p className="text-muted">
        Mostrando <span className="font-medium tabular-nums text-ink">{from}–{to}</span> de{" "}
        <span className="font-medium tabular-nums text-ink">{total.toLocaleString("pt-BR")}</span> {plural(total, noun[0], noun[1])}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {sizeControl}
        <nav aria-label="Paginação" className="flex flex-wrap items-center gap-0.5">
          {edge(page - 1, "Página anterior", <><span aria-hidden="true">‹</span><span className="hidden sm:inline">Anterior</span></>, page > 1)}
          {pageWindow(page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">…</span>
            ) : p === page ? (
              <span key={p} aria-current="page" className={currentClass}>{p}</span>
            ) : (
              <Fragment key={p}>{control({ page: p, label: `Página ${p}`, className: linkClass, children: p })}</Fragment>
            ),
          )}
          {edge(page + 1, "Próxima página", <><span className="hidden sm:inline">Próxima</span><span aria-hidden="true">›</span></>, page < pages)}
        </nav>
      </div>
    </div>
  );
}
