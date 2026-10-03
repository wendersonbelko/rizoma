"use client";

import { STEPS, type Outcome, type StepId } from "./types";

/** Indicador de progresso do wizard — só sabe desenhar bolhas a partir do estado, nada de regra de navegação. */
export function WizardSteps({ current, outcomes, canGoto, onGoto }: {
  current: StepId;
  outcomes: Partial<Record<StepId, Outcome>>;
  canGoto: (id: StepId) => boolean;
  onGoto: (id: StepId) => void;
}) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4 text-sm" aria-label="Etapas">
      {STEPS.map(({ id, label }) => {
        const status = outcomes[id] === "done" ? "done" : outcomes[id] === "skipped" ? "skipped" : id === current ? "current" : "pending";
        const bubble = {
          done: "bg-accent text-accent-ink",
          skipped: "border border-dashed border-line text-muted",
          current: "border-2 border-accent text-accent",
          pending: "border border-line text-muted",
        }[status];
        return (
          <li key={id}>
            <button
              type="button"
              disabled={!canGoto(id) || id === current}
              aria-current={id === current ? "step" : undefined}
              onClick={() => onGoto(id)}
              className={`flex items-center gap-2 disabled:cursor-default ${id === current ? "font-semibold text-ink" : "text-muted enabled:hover:text-ink"}`}
            >
              <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${bubble}`} aria-hidden>
                {status === "done" ? "✓" : status === "skipped" ? "–" : id}
              </span>
              {label}
              <span className="sr-only">{status === "done" ? " (concluído)" : status === "skipped" ? " (pulado)" : status === "current" ? " (atual)" : ""}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
