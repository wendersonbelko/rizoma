import type { NodeKind } from "@api-hub/core/graph";
import { KIND } from "./constants";

/**
 * Legenda fixa dos tipos de item do mapa (achado D1 da auditoria de UX de 02/10/2026). Mostra só
 * os tipos que estão no mapa e explica o esmaecimento, que é o que mais surpreende na primeira vez.
 * Fica numa faixa abaixo do desenho, nunca por cima dele: sobre o mapa ela escondia nós.
 */
export function GraphLegend({ kinds }: { kinds: NodeKind[] }) {
  const shown = (Object.keys(KIND) as NodeKind[]).filter((k) => kinds.includes(k));
  return (
    <div
      data-tour="graph-legend"
      role="group"
      aria-label="Legenda do mapa"
      className="mt-2 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted"
    >
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {shown.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span aria-hidden className={`inline-block h-3.5 w-6 shrink-0 ${KIND[k].swatch}`} />
            {KIND[k].label}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden className={`inline-block h-3.5 w-6 shrink-0 opacity-25 ${KIND.service.swatch}`} />
          Fora do foco
        </li>
      </ul>
      <p>A seta mostra o sentido da ligação.</p>
    </div>
  );
}
