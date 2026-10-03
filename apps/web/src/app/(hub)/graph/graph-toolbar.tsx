import type { NodeKind } from "@api-hub/core/graph";
import { SERVICE_KIND_LABEL, SERVICE_KINDS, type ServiceKind } from "@api-hub/core/types";
import { KIND, type GraphMode } from "./constants";

/** Barra de controles do mapa: modo, filtros de tipo, distância do foco e o toast de sucesso. */
export function GraphToolbar({ mode, onModeChange, kinds, onKindsChange, serviceKinds, onServiceKindsChange, focus, onShowAll, depth, onDepthChange, pickLimit, onPickLimit, pickCount, pickMax, toast }: {
  mode: GraphMode; onModeChange: (m: GraphMode) => void;
  kinds: NodeKind[]; onKindsChange: (kinds: NodeKind[]) => void;
  serviceKinds: ServiceKind[]; onServiceKindsChange: (kinds: ServiceKind[]) => void;
  focus: boolean; onShowAll: () => void;
  depth: number; onDepthChange: (d: number) => void;
  pickLimit: number; onPickLimit: (n: number) => void; pickCount: number; pickMax: number;
  toast: string | undefined;
}) {
  return (
    <div data-tour="graph-toolbar" className="flex flex-wrap items-center gap-2">
      <div data-tour="graph-mode" className="flex rounded-control border border-line bg-sheet p-0.5" role="group" aria-label="Modo de exibição">
        {(["map", "list"] as const).map((m) => (
          <button
            key={m} type="button" aria-pressed={mode === m} onClick={() => onModeChange(m)}
            className={`rounded-[8px] px-3 py-1.5 text-sm ${mode === m ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:text-ink"}`}
          >
            {m === "map" ? "Mapa" : "Lista"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(KIND) as NodeKind[]).map((k) => {
          const on = kinds.includes(k);
          return (
            <button
              key={k} type="button" aria-pressed={on}
              onClick={() => onKindsChange(on ? kinds.filter((x) => x !== k) : [...kinds, k])}
              className={`rounded-full border px-3 py-1 text-sm ${on ? "border-accent/40 bg-accent/12 font-medium text-accent" : "border-line text-muted hover:text-ink"}`}
            >
              {KIND[k].label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {SERVICE_KINDS.map((k) => {
          const on = serviceKinds.includes(k);
          return (
            <button
              key={k} type="button" aria-pressed={on}
              onClick={() => onServiceKindsChange(on ? serviceKinds.filter((x) => x !== k) : [...serviceKinds, k])}
              className={`rounded-full border px-3 py-1 text-sm ${on ? "border-line bg-sheet font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {SERVICE_KIND_LABEL[k]}
            </button>
          );
        })}
      </div>
      {focus && (
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-2 text-muted">
            Vizinhança
            <select value={depth} onChange={(e) => onDepthChange(Number(e.target.value))} className="rounded-control border border-line bg-field px-2 py-1 text-ink">
              {[1, 2, 3, 4].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <button type="button" className="font-medium text-accent" onClick={onShowAll}>Mostrar tudo</button>
        </div>
      )}
      {toast && <span role="status" className="text-sm text-accent">{toast}</span>}
      <label className="ml-auto flex items-center gap-2 text-sm text-muted">
        Selecionar até
        <input
          type="number"
          min={1}
          max={pickMax}
          value={pickLimit}
          aria-label="Quantos itens podem ser selecionados"
          onChange={(e) => onPickLimit(Number(e.target.value))}
          className="h-8 w-14 rounded-control border border-line bg-field px-2 text-ink"
        />
        <span className="text-xs">{pickCount > 0 ? `${pickCount}/${Math.min(pickLimit, pickMax)}` : `máx. ${pickMax}`}</span>
      </label>
    </div>
  );
}
