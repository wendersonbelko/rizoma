"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { queryWith, type QueryParams } from "@api-hub/core/pagination";
import { LIFECYCLE_LABEL } from "@api-hub/core/schemas";
import { SERVICE_KIND_LABEL } from "@api-hub/core/types";
import { FilterChips, type FilterChip } from "@/components/filter-chips";
import { Input, Select } from "@/components/ui";
import { clearFiltersHref, type CatalogFilters, type CatalogTeamOption } from "./filters";

type SelectValues = { team: string; kind: string; lifecycle: string };
type Patch = Record<string, string | undefined>;

/**
 * Barra de filtros do Catálogo (achado D2 da auditoria de UX de 02/10/2026): busca + Time ▾ + Tipo ▾ +
 * Situação ▾ + chips "Sem spec" e "Meus serviços". Cada controle só troca um parâmetro da URL
 * (a regra de filtro mora em query.ts, em SQL) e mantém os outros, inclusive "por página"; trocar
 * qualquer filtro volta para a página 1.
 *
 * É client só para os selects navegarem ao trocar o valor, sem botão "Aplicar". O select mostra a
 * escolha na hora (useOptimistic) e se acerta com a URL quando a página nova chega.
 */
export function CatalogFilterBar({ params, filters, teams, canMine }: {
  /** Parâmetros atuais da URL, para os controles não derrubarem os outros filtros. */
  params: QueryParams;
  filters: CatalogFilters;
  teams: CatalogTeamOption[];
  /** A pessoa faz parte de algum time? Sem time, "Meus serviços" não teria o que mostrar. */
  canMine: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic<SelectValues, Partial<SelectValues>>(
    { team: filters.team ?? "", kind: filters.kind ?? "", lifecycle: filters.lifecycle ?? "" },
    (current, change) => ({ ...current, ...change }),
  );

  // O texto da busca é do campo enquanto a pessoa digita; se a URL mudar por fora (Limpar filtros), ele a acompanha.
  const urlQuery = filters.q ?? "";
  const [text, setText] = useState(urlQuery);
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  if (seenQuery !== urlQuery) {
    setSeenQuery(urlQuery);
    setText(urlQuery);
  }

  const hrefWith = (patch: Patch) => {
    const qs = queryWith(params, { ...patch, page: undefined });
    return qs === "?" ? "/" : `/${qs}`;
  };

  function go(patch: Patch, optimistic?: Partial<SelectValues>) {
    startTransition(() => {
      if (optimistic) setShown(optimistic);
      router.push(hrefWith(patch));
    });
  }

  const active = Object.keys(filters).length > 0;
  const clearHref = clearFiltersHref(params);

  const chips: FilterChip[] = [
    { label: "Sem spec", href: hrefWith({ nospec: filters.noSpec ? undefined : "1" }), active: Boolean(filters.noSpec) },
    ...(canMine ? [{ label: "Meus serviços", href: hrefWith({ mine: filters.mine ? undefined : "1" }), active: Boolean(filters.mine) }] : []),
    // A tag só se escolhe pela página do serviço; aqui ela aparece como um filtro ligado, com × para tirar.
    ...(filters.tag ? [{ label: `Tag #${filters.tag} ×`, href: hrefWith({ tag: undefined }), active: true }] : []),
  ];

  return (
    <div data-tour="catalog-filters" aria-busy={pending} className="mb-4 space-y-3">
      <form
        role="search"
        className="max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: text.trim() || undefined });
        }}
      >
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted" aria-hidden>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <Input
            data-tour="catalog-search"
            type="search"
            name="q"
            aria-label="Buscar serviço"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Buscar por nome, slug ou endpoint"
            className="pl-9"
          />
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Filtrar por time" className="w-52" value={shown.team} onChange={(e) => go({ team: e.target.value || undefined }, { team: e.target.value })}>
          <option value="">Todos os times</option>
          {teams.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select aria-label="Filtrar por tipo" className="w-44" value={shown.kind} onChange={(e) => go({ kind: e.target.value || undefined }, { kind: e.target.value })}>
          <option value="">Todos os tipos</option>
          {Object.entries(SERVICE_KIND_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Select aria-label="Filtrar por situação" className="w-48" value={shown.lifecycle} onChange={(e) => go({ lifecycle: e.target.value || undefined }, { lifecycle: e.target.value })}>
          <option value="">Todas as situações</option>
          {Object.entries(LIFECYCLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <FilterChips label="Filtros rápidos" items={chips} />
        {active && <Link href={clearHref} className="px-1 text-sm text-accent underline-offset-2 hover:underline">Limpar filtros</Link>}
      </div>
    </div>
  );
}
