import type { ReactNode } from "react";

/**
 * Estado vazio padrão de qualquer lista/tabela: card tracejado com título, explicação e,
 * opcionalmente, a ação para sair do vazio. Substitui "linha de tabela com 'nenhum item'" e
 * parágrafos soltos — todo vazio do hub tem esta mesma cara.
 */
export function EmptyState({ title, description, action, tour }: { title: ReactNode; description?: ReactNode; action?: ReactNode; tour?: string }) {
  return (
    <div data-tour={tour} className="rounded-panel border border-dashed border-line bg-sheet px-6 py-12 text-center shadow-[0_1px_2px_color-mix(in_srgb,var(--color-ink)_4%,transparent)]">
      <p className="text-base font-semibold tracking-tight">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-prose text-sm text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
