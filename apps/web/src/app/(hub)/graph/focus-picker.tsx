"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { GraphNode, NodeKind } from "@api-hub/core/graph";
import { RESOURCE_KIND_LABEL, type ResourceKind } from "@api-hub/core/types";
import { KIND } from "./constants";
import { useOutsideClose } from "./use-outside-close";

const KIND_ORDER = Object.keys(KIND) as NodeKind[];

/** Sem acento e sem caixa: "pagamentos" acha "Pagamentos API" e "integração" acha "Integrações". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");

/** Serviços primeiro, depois integrações, repositórios…; dentro de cada tipo, por nome. */
function sortNodes(nodes: GraphNode[]) {
  return [...nodes].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.label.localeCompare(b.label, "pt-BR"));
}

function detail(n: GraphNode) {
  if (n.kind === "resource" && n.sub && n.sub in RESOURCE_KIND_LABEL) return RESOURCE_KIND_LABEL[n.sub as ResourceKind];
  if (n.kind === "service") return n.sub;
  return undefined;
}

/**
 * "Foco ▾": escolhe o item que fica no centro do mapa, buscando pelo nome (achado D1 da auditoria
 * de UX de 02/10/2026; substitui o índice lateral). Combobox com lista: ↑ ↓ Home End movem,
 * Enter escolhe, Esc fecha e devolve o foco ao botão.
 */
export function FocusPicker({ nodes, focusId, onPick }: { nodes: GraphNode[]; focusId?: string; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (i: number) => `${uid}-opt-${i}`;

  const current = nodes.find((n) => n.id === focusId);
  const sorted = useMemo(() => sortNodes(nodes), [nodes]);
  const options = useMemo(() => {
    const q = fold(query.trim());
    return sorted.filter((n) => !q || fold(`${n.label} ${detail(n) ?? ""} ${KIND[n.kind].label}`).includes(q));
  }, [sorted, query]);
  // Mesma ordem da lista, com o índice global de cada opção (é ele que o teclado percorre).
  const groups = useMemo(
    () => KIND_ORDER.flatMap((kind) => {
      const items = options.flatMap((n, i) => (n.kind === kind ? [{ n, i }] : []));
      return items.length ? [{ kind, items }] : [];
    }),
    [options],
  );

  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(rootRef, open, close);

  // Mantém o item ativo à vista quando a navegação por teclado desce a lista.
  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);

  function openMenu() {
    setQuery("");
    setActive(Math.max(0, sorted.findIndex((n) => n.id === focusId)));
    setOpen(true);
  }

  function choose(id: string) {
    onPick(id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (options.length ? (i + 1) % options.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (options.length ? (i - 1 + options.length) % options.length : 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(0, options.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = options[active];
      if (picked) choose(picked.id);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} data-tour="graph-focus" className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex h-10 max-w-[19rem] items-center gap-2 rounded-control border border-line-strong bg-field px-3 text-sm hover:border-accent"
      >
        <span className="text-muted">Foco</span>
        <span className="min-w-0 truncate font-semibold">{current?.label ?? "Escolher um item"}</span>
        <span aria-hidden className="text-muted">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-[min(22rem,calc(100vw-2rem))] rounded-panel border border-line bg-raised p-2 shadow-[0_8px_24px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_20%,transparent)]">
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={options.length ? optionId(active) : undefined}
            aria-autocomplete="list"
            aria-label="Buscar item para o foco"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Buscar por nome"
            className="h-10 w-full rounded-control border border-line-strong bg-field px-3 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
          <div className="mt-2 max-h-72 overflow-y-auto">
            <p role="status" className="sr-only">{options.length === 1 ? "1 item" : `${options.length} itens`}</p>
            {options.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">Nada com “{query.trim()}”. Confira os tipos em “Tipos”.</p>
            ) : (
              <div id={listId} role="listbox" aria-label="Itens do mapa">
                {groups.map((g) => (
                  <div key={g.kind} role="group" aria-labelledby={`${uid}-group-${g.kind}`}>
                    <p id={`${uid}-group-${g.kind}`} className="px-2 pb-1 pt-2 text-xs font-medium text-muted">{KIND[g.kind].label}</p>
                    {g.items.map(({ n, i }) => {
                      const extra = detail(n);
                      return (
                        <div
                          key={n.id}
                          id={optionId(i)}
                          role="option"
                          aria-selected={n.id === focusId}
                          onMouseMove={() => active !== i && setActive(i)}
                          // mousedown no input perderia o foco antes do clique
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => choose(n.id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-control px-2 py-2 text-sm ${i === active ? "bg-paper" : ""} ${n.id === focusId ? "font-semibold" : ""}`}
                        >
                          <span className="min-w-0 flex-1 truncate">{n.label}</span>
                          {extra && <span className="shrink-0 text-xs text-muted">{extra}</span>}
                          {n.id === focusId && <span aria-hidden className="shrink-0 text-accent">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
