"use client";

import { useMemo, useState } from "react";
import type { GraphNode, NodeKind } from "@api-hub/core/graph";
import { RESOURCE_KIND_LABEL, type ResourceKind } from "@api-hub/core/types";
import { KIND } from "./constants";

const DOT: Record<NodeKind, string> = {
  service: "bg-accent",
  resource: "bg-wait",
  repository: "bg-ink",
  team: "bg-muted",
  person: "bg-line",
};

function detail(n: GraphNode) {
  if (n.kind === "resource" && n.sub && n.sub in RESOURCE_KIND_LABEL) return RESOURCE_KIND_LABEL[n.sub as ResourceKind];
  if (n.kind === "service") return n.sub;
  return undefined;
}

/** Lista do que está no mapa, para achar um item e focar nele sem procurar no desenho. */
export function GraphIndex({ nodes, focus, selected, onPick }: { nodes: GraphNode[]; focus?: string; selected: string[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(true);
  const [closed, setClosed] = useState<Set<NodeKind>>(() => new Set(Object.keys(KIND) as NodeKind[]));
  const groups = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("pt-BR");
    const visible = nodes.filter((n) => !query || `${n.label} ${n.sub ?? ""}`.toLocaleLowerCase("pt-BR").includes(query));
    const order = Object.keys(KIND) as NodeKind[];
    return order.flatMap((kind) => {
      const items = visible.filter((n) => n.kind === kind).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
      return items.length ? [{ kind, label: KIND[kind].label, items }] : [];
    });
  }, [nodes, q]);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="flex h-10 shrink-0 items-center gap-2 self-start rounded-panel border border-line bg-sheet px-3 text-sm font-semibold"
      >
        Índice
        <span className="text-xs font-normal text-muted">{shown}</span>
      </button>
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-panel border border-line bg-sheet">
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Índice</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{shown}</span>
            <button type="button" onClick={() => setOpen(false)} aria-expanded className="rounded-control px-2 py-1 text-xs font-medium text-muted hover:bg-paper hover:text-ink">
              Fechar
            </button>
          </div>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar no mapa"
          aria-label="Buscar no índice"
          className="mt-3 h-10 w-full rounded-control border border-line bg-paper px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted">Nada com esses filtros.</p>}
        {groups.map((g) => (
          <section key={g.kind} className="mb-2">
            <button
              type="button"
              aria-expanded={!closed.has(g.kind)}
              onClick={() => setClosed((current) => {
                const next = new Set(current);
                if (next.has(g.kind)) next.delete(g.kind);
                else next.add(g.kind);
                return next;
              })}
              className="sticky top-0 z-10 flex w-full items-center justify-between bg-sheet px-2 py-2 text-xs font-medium text-muted hover:text-ink"
            >
              <span>{g.label}</span>
              <span className="flex items-center gap-2">
                {g.items.length}
                <span aria-hidden>{closed.has(g.kind) ? "+" : "–"}</span>
              </span>
            </button>
            {!closed.has(g.kind) && (
            <ul className="space-y-0.5">
              {g.items.map((n) => {
                const on = focus === n.id;
                const order = selected.indexOf(n.id);
                const extra = detail(n);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onPick(n.id)}
                      aria-current={on ? "true" : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-control px-2 py-2 text-left text-sm transition ${
                        on ? "bg-paper font-semibold text-ink shadow-[inset_3px_0_0_var(--color-accent)]" : order >= 0 ? "bg-accent/10 text-ink" : "text-ink/90 hover:bg-paper/70"
                      }`}
                    >
                      <span className={`size-1.5 shrink-0 rounded-full ${DOT[n.kind]}`} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{n.label}</span>
                      {order >= 0 && <span className="shrink-0 text-[11px] font-semibold text-accent">{order + 1}</span>}
                      {extra && <span className={`shrink-0 text-[11px] ${on ? "text-accent" : "text-muted"}`}>{extra}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            )}
          </section>
        ))}
      </div>
    </aside>
  );
}
