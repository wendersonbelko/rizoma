import { SERVICE_KINDS, type ServiceKind } from "@api-hub/core/types";
import { LIFECYCLE_LABEL } from "@api-hub/core/schemas";
import { queryWith, type QueryParams } from "@api-hub/core/pagination";

/**
 * Filtros do Catálogo (achado D2 da auditoria de UX de 02/10/2026). Os nomes dos parâmetros de URL
 * são em inglês e estáveis: `?q=`, `?team=`, `?kind=`, `?lifecycle=`, `?nospec=1`, `?mine=1`, `?tag=`.
 * Fica fora de query.ts para o servidor (SQL) e a tela (chips e selects) lerem a mesma regra.
 */
export type CatalogFilters = {
  q?: string;
  tag?: string;
  /** Slug do time responsável, ou NO_TEAM para os serviços sem time. */
  team?: string;
  kind?: ServiceKind;
  lifecycle?: string;
  /** Só serviços sem nenhuma spec publicada. */
  noSpec?: boolean;
  /** Só serviços dos times da pessoa. */
  mine?: boolean;
};

/** Uma opção do filtro "Time": o valor vai na URL (`?team=`) e o rótulo na tela. */
export type CatalogTeamOption = { value: string; label: string };

/** Valor de `?team=` para "Sem time". Não é um slug válido (slugs começam por letra ou número), então não colide com um time real. */
export const NO_TEAM = "_none";

/** Parâmetros de URL que são filtros: trocar qualquer um deles volta a lista para a página 1. */
export const CATALOG_FILTER_KEYS = ["q", "tag", "team", "kind", "lifecycle", "nospec", "mine"] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lê os filtros da URL. Valor desconhecido (um `?kind=` que não existe, por exemplo) é ignorado. */
export function readCatalogFilters(params: QueryParams): CatalogFilters {
  const q = first(params.q)?.trim();
  const tag = first(params.tag)?.trim();
  const team = first(params.team)?.trim();
  const kind = first(params.kind);
  const lifecycle = first(params.lifecycle);
  return {
    ...(q ? { q } : {}),
    ...(tag ? { tag } : {}),
    ...(team ? { team } : {}),
    ...(kind && (SERVICE_KINDS as string[]).includes(kind) ? { kind: kind as ServiceKind } : {}),
    ...(lifecycle && Object.hasOwn(LIFECYCLE_LABEL, lifecycle) ? { lifecycle } : {}),
    ...(first(params.nospec) === "1" ? { noSpec: true } : {}),
    ...(first(params.mine) === "1" ? { mine: true } : {}),
  };
}

/** Há algum filtro ligado? Decide entre "catálogo vazio" e "nenhum resultado para os filtros". */
export function hasCatalogFilters(f: CatalogFilters): boolean {
  return Object.keys(f).length > 0;
}

/** Endereço do catálogo sem nenhum filtro, mantendo o resto da URL (o "por página" escolhido). */
export function clearFiltersHref(params: QueryParams): string {
  const qs = queryWith(params, { ...Object.fromEntries(CATALOG_FILTER_KEYS.map((k) => [k, undefined])), page: undefined });
  return qs === "?" ? "/" : `/${qs}`;
}
