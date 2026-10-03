import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

/**
 * Padrão único de tabela do hub. Toda listagem tabular (catálogo, auditoria, pessoas, times,
 * vínculos, tokens, variáveis, integrações, permissões…) usa estas peças — nada de <table>
 * montado à mão nas páginas, para que espaçamento, cabeçalho, divisórias, hover e estado vazio
 * sejam sempre os mesmos.
 *
 *   <DataTable tour="…" minWidth={720} stickyHeader pagination={<Pagination …/>} footer={<form…/>}>
 *     <THead><Th>Nome</Th><Th align="right"><SrOnly>Ações</SrOnly></Th></THead>
 *     <TBody>
 *       <Tr><Td><CellTitle title="…" href="…" meta="…" /></Td><Td align="right"><RowActions>…</RowActions></Td></Tr>
 *     </TBody>
 *   </DataTable>
 *
 * Lista vazia não vira tabela com uma linha "nenhum item": use <EmptyState> no lugar.
 * Listagem que cresce com o uso é paginada (<Pagination> ou <ClientPagination>); só tabelas de
 * tamanho fixo (um item por ambiente, a matriz de permissões) ficam sem — ver design-system.test.ts.
 */

type Breakpoint = "sm" | "md" | "lg";
const HIDE_BELOW: Record<Breakpoint, string> = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };
type Align = "left" | "right" | "center";
const ALIGN: Record<Align, string> = { left: "text-left", right: "text-right", center: "text-center" };

export function DataTable({ children, tour, caption, minWidth, stickyHeader, pagination, footer, className = "" }: {
  children: ReactNode;
  tour?: string;
  /** Descrição para leitores de tela. */
  caption?: string;
  /** Largura mínima antes de a tabela rolar na horizontal (px). */
  minWidth?: number;
  /**
   * Cabeçalho fixo durante a rolagem. A rolagem acontece dentro do card (altura máxima de 70% da
   * tela) — é isso que faz o sticky funcionar: com overflow-x no contêiner, o cabeçalho só gruda
   * se o próprio contêiner for quem rola na vertical.
   */
  stickyHeader?: boolean;
  /** Barra de paginação, logo abaixo das linhas (<Pagination> ou <ClientPagination>). */
  pagination?: ReactNode;
  /** Área abaixo das linhas, dentro do card — ex.: formulário "adicionar mais um". */
  footer?: ReactNode;
  className?: string;
}) {
  const style: CSSProperties | undefined = minWidth ? { minWidth } : undefined;
  return (
    // data-list / data-scroll-area: é por eles que a paginação volta a tabela para o topo.
    <div data-tour={tour} data-list="" className={`flex scroll-mt-6 flex-col overflow-hidden rounded-panel border border-line bg-sheet shadow-[0_1px_2px_color-mix(in_srgb,var(--color-ink)_4%,transparent)] ${className}`}>
      <div data-scroll-area="" className={stickyHeader ? "max-h-[70vh] min-h-0 flex-1 overflow-auto" : "overflow-x-auto"}>
        <table className="w-full border-collapse text-left text-sm" style={style}>
          {caption && <caption className="sr-only">{caption}</caption>}
          {children}
        </table>
      </div>
      {pagination && <div className="border-t border-line px-4 py-2.5">{pagination}</div>}
      {footer && <div className="border-t border-line bg-paper/50 px-4 py-3">{footer}</div>}
    </div>
  );
}

export function THead({ children, sticky }: { children: ReactNode; sticky?: boolean }) {
  return (
    <thead className={sticky ? "sticky top-0 z-10" : undefined}>
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, align = "left", hideBelow, width, className = "" }: {
  children?: ReactNode; align?: Align; hideBelow?: Breakpoint; width?: number | string; className?: string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      // Linha inferior como sombra (não border): com border-collapse, a borda some no cabeçalho fixo.
      className={`whitespace-nowrap bg-paper/70 px-4 py-2.5 text-xs font-medium text-muted shadow-[inset_0_-1px_0_var(--color-line)] ${ALIGN[align]} ${hideBelow ? HIDE_BELOW[hideBelow] : ""} ${className}`}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`group align-top transition-colors duration-150 hover:bg-paper/80 ${className}`}>{children}</tr>;
}

export function Td({ children, align = "left", hideBelow, muted, mono, nowrap, className = "" }: {
  children?: ReactNode; align?: Align; hideBelow?: Breakpoint; muted?: boolean; mono?: boolean; nowrap?: boolean; className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 ${ALIGN[align]} ${hideBelow ? HIDE_BELOW[hideBelow] : ""} ${muted ? "text-muted" : ""} ${mono ? "break-all font-mono text-[13px]" : ""} ${nowrap ? "whitespace-nowrap" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

/** Linha de agrupamento que atravessa todas as colunas (ex.: grupos da matriz de permissões). */
export function TableGroupRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="bg-paper px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{children}</td>
    </tr>
  );
}

/**
 * Célula principal de uma linha: título (link, se houver destino), selo ao lado, uma linha de
 * detalhe abaixo e, opcionalmente, um elemento à esquerda e conteúdo extra (tags).
 */
export function CellTitle({ title, href, badge, meta, leading, children }: {
  title: ReactNode; href?: string; badge?: ReactNode; meta?: ReactNode; leading?: ReactNode; children?: ReactNode;
}) {
  const external = href && !href.startsWith("/");
  const heading = !href ? (
    <span className="font-semibold text-ink">{title}</span>
  ) : external ? (
    <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-ink group-hover:text-accent">{title} ↗</a>
  ) : (
    <Link href={href} className="font-semibold text-ink group-hover:text-accent">{title}</Link>
  );
  const body = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">{heading}{badge}</div>
      {meta && <div className="mt-0.5 text-muted">{meta}</div>}
      {children}
    </div>
  );
  return leading ? <div className="flex items-start gap-3">{leading}{body}</div> : body;
}

/** Contêiner das ações no fim da linha (Editar, Remover…), sempre alinhadas à direita. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-3 whitespace-nowrap">{children}</div>;
}

export type RowActionTone = "default" | "danger";
export const rowActionClass = (tone: RowActionTone = "default") =>
  `text-sm underline-offset-2 hover:underline disabled:opacity-50 ${tone === "danger" ? "text-danger" : "text-accent"}`;

export function RowActionLink({ href, children, tone }: { href: string; children: ReactNode; tone?: RowActionTone }) {
  return <Link href={href} className={rowActionClass(tone)}>{children}</Link>;
}

/** Ação de linha como botão — dentro de um <form action={…}> vira submit. */
export function RowActionButton({ tone, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: RowActionTone }) {
  return <button {...props} className={`${rowActionClass(tone)} ${className}`} />;
}

export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
