import type { ReactNode } from "react";

/**
 * "Detalhes opcionais" recolhidos (achado M2 e regra de campos da p. 14 da auditoria de UX de 02/10/2026):
 * o caminho feliz tem poucos campos e o resto fica a um clique. Os campos de dentro são enviados mesmo
 * com o bloco fechado. `open` abre o bloco (um erro lá dentro não pode ficar escondido).
 */
export function OptionalDetails({ summary, open, children }: { summary?: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-control border border-line bg-paper/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-muted transition group-open:rotate-90">›</span>
        Detalhes opcionais
        {summary && <span className="font-normal text-muted">{summary}</span>}
      </summary>
      <div className="space-y-4 border-t border-line px-3 py-4">{children}</div>
    </details>
  );
}
