/**
 * Regras de paginação, sem React nem Prisma: usadas por toda listagem paginada do hub — tanto as
 * que paginam no banco (skip/take) quanto as que paginam uma lista já carregada em memória.
 */

/** Opções do seletor "por página". Um ?size= fora desta lista é ignorado. */
export const PAGE_SIZES = [10, 20, 50, 100] as const;
/** Toda listagem paginada começa em 10. O seletor ainda oferece 20, 50 e 100. */
export const DEFAULT_PAGE_SIZE = 10;
/** Tabelas que já pediam 10 antes do padrão único (histórico, abas, times, auditoria). */
export const SECONDARY_PAGE_SIZE = 10;

export type PageRequest = { page: number; pageSize: number };

export type PageInfo = {
  page: number;
  pages: number;
  pageSize: number;
  total: number;
  /** Primeiro e último item exibidos, contando de 1 (0 e 0 quando não há itens). */
  from: number;
  to: number;
  /** Prontos para o Prisma. */
  skip: number;
  take: number;
};

export type QueryParams = Record<string, string | string[] | undefined>;

/** Nomes dos parâmetros de URL de uma listagem — telas com duas listagens usam nomes diferentes. */
export type PageKeys = { pageKey?: string; sizeKey?: string };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lê a página e o tamanho pedidos na URL; valor inválido volta para o padrão. */
export function readPageRequest(
  params: QueryParams,
  { pageKey = "page", sizeKey = "size", defaultSize = DEFAULT_PAGE_SIZE }: PageKeys & { defaultSize?: number } = {},
): PageRequest {
  const page = Math.floor(Number(first(params[pageKey])));
  const size = Number(first(params[sizeKey]));
  return {
    page: page >= 1 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? size : defaultSize,
  };
}

/** Resolve o pedido contra o total real: uma página além da última vira a última. */
export function pageInfo(total: number, req: PageRequest): PageInfo {
  const pageSize = Math.max(1, req.pageSize);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, req.page), pages);
  const skip = (page - 1) * pageSize;
  return { page, pages, pageSize, total, skip, take: pageSize, from: total === 0 ? 0 : skip + 1, to: Math.min(skip + pageSize, total) };
}

/** Pagina uma lista já carregada (quando o filtro só existe em memória, ex.: permissão por serviço). */
export function paginate<T>(items: readonly T[], req: PageRequest): { items: T[]; info: PageInfo } {
  const info = pageInfo(items.length, req);
  return { items: items.slice(info.skip, info.skip + info.take), info };
}

/**
 * Números de página a mostrar: a primeira, a última, a atual com as vizinhas e "…" nos buracos
 * (1 … 4 5 6 … 12). Um buraco de uma página só mostra o número em vez de "…".
 */
export function pageWindow(page: number, pages: number, siblings = 1): (number | "…")[] {
  const keep = (p: number) => p === 1 || p === pages || Math.abs(p - page) <= siblings;
  const out: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (keep(p) || (keep(p - 1) && keep(p + 1))) out.push(p);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

/**
 * Querystring relativa ("?a=1&b=2") com os parâmetros atuais e o `patch` aplicado — chave com
 * valor vazio sai da URL. Mantém filtros, aba e a página das outras listagens da tela.
 */
export function queryWith(params: QueryParams, patch: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k in patch) continue;
    for (const item of Array.isArray(v) ? v : [v]) if (item) q.append(k, item);
  }
  for (const [k, v] of Object.entries(patch)) if (v !== undefined && v !== "") q.set(k, String(v));
  return `?${q}`;
}

/** URL de uma página da listagem (a página 1 não aparece na URL). */
export function pageHref(params: QueryParams, page: number, { pageKey = "page" }: PageKeys = {}): string {
  return queryWith(params, { [pageKey]: page > 1 ? page : undefined });
}

/** URL com outro tamanho de página — sempre volta para a página 1. */
export function pageSizeHref(params: QueryParams, size: number, { pageKey = "page", sizeKey = "size" }: PageKeys = {}): string {
  return queryWith(params, { [sizeKey]: size, [pageKey]: undefined });
}
