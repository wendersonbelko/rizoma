"use client";

import type { FocusScope, GraphNode, NodeKind } from "@api-hub/core/graph";
import type { ServiceKind } from "@api-hub/core/types";
import { FOCUS_SCOPES, type GraphMode } from "./constants";
import { FocusPicker } from "./focus-picker";
import { TypesMenu } from "./types-menu";

/** Grupo de botões de escolha única (Mapa/Lista, 1º grau/2º grau/Tudo): o mesmo desenho nos dois. */
function Segmented<T extends string | number>({ label, value, options, onChange, tour }: {
  label: string; value: T; options: { id: T; label: string; hint?: string }[]; onChange: (id: T) => void; tour?: string;
}) {
  return (
    <div data-tour={tour} role="group" aria-label={label} className="flex rounded-control border border-line-strong bg-field p-0.5">
      {options.map((o) => (
        <button
          key={String(o.id)} type="button" aria-pressed={value === o.id} title={o.hint} onClick={() => onChange(o.id)}
          className={`h-8 rounded-[8px] px-3 text-sm ${value === o.id ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const MODES: { id: GraphMode; label: string }[] = [{ id: "map", label: "Mapa" }, { id: "list", label: "Lista" }];
const SCOPE_HINT: Record<string, string> = { "1": "Só os vizinhos diretos do foco", "2": "Os vizinhos e os vizinhos deles", all: "Todos os itens, sem esmaecer" };

/**
 * Barra de controles do mapa: modo, foco, alcance e tipos. Achado D1 da auditoria de UX de
 * 02/10/2026: sai o "Selecionar até N" e entram "Foco ▾" e "1º grau · 2º grau · Tudo".
 */
export function GraphToolbar({ mode, onModeChange, nodes, focusId, onFocus, scope, onScopeChange, kinds, onKindsChange, serviceKinds, onServiceKindsChange, summary }: {
  mode: GraphMode; onModeChange: (m: GraphMode) => void;
  /** Itens que podem receber o foco (já filtrados por tipo). */
  nodes: GraphNode[]; focusId?: string; onFocus: (id: string) => void;
  scope: FocusScope; onScopeChange: (s: FocusScope) => void;
  kinds: NodeKind[]; onKindsChange: (kinds: NodeKind[]) => void;
  serviceKinds: ServiceKind[]; onServiceKindsChange: (kinds: ServiceKind[]) => void;
  /** Quantos itens estão em foco, para a pessoa saber o que o esmaecimento escondeu. */
  summary: string;
}) {
  return (
    <div data-tour="graph-toolbar" className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Segmented tour="graph-mode" label="Modo de exibição" value={mode} options={MODES} onChange={onModeChange} />
      <FocusPicker nodes={nodes} focusId={focusId} onPick={onFocus} />
      <Segmented
        tour="graph-depth" label="Alcance do foco" value={scope} onChange={onScopeChange}
        options={FOCUS_SCOPES.map((s) => ({ ...s, hint: SCOPE_HINT[String(s.id)] }))}
      />
      <TypesMenu kinds={kinds} onKindsChange={onKindsChange} serviceKinds={serviceKinds} onServiceKindsChange={onServiceKindsChange} />
      <p role="status" className="ml-auto text-sm text-muted">{summary}</p>
    </div>
  );
}
