import { Badge, LinkButton } from "@/components/ui";
import type { Checklist } from "./checklist";

/**
 * Próximos passos de um serviço recém-criado (achado M2 e p. 14 da auditoria de UX de 02/10/2026).
 * A página só monta isto para quem gerencia o serviço e enquanto faltar algum passo; cada passo é
 * opcional e reversível, por isso a explicação no fim em vez de um bloqueio.
 */
export function ServiceChecklist({ checklist }: { checklist: Checklist }) {
  return (
    <section aria-labelledby="service-checklist-title" className="rounded-panel border border-line bg-sheet p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="service-checklist-title" className="text-lg font-semibold tracking-tight">Próximos passos</h2>
        <Badge tone="wait">Rascunho</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{checklist.summary}</p>

      <ol className="mt-4">
        {checklist.steps.map((step) => (
          <li key={step.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-3 first:border-t-0 first:pt-0">
            <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full border ${step.done ? "border-accent bg-accent text-accent-ink" : "border-line-strong"}`}>
              {step.done && (
                <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3.5 8.5 3 3 6-7" />
                </svg>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${step.done ? "text-muted" : ""}`}>
                {step.label}
                <span className="sr-only">{step.done ? " (feito)" : " (falta fazer)"}</span>
              </p>
              <p className="text-sm text-muted">{step.detail}</p>
            </div>
            {!step.done && step.href && step.actionLabel && <LinkButton href={step.href} tone="quiet">{step.actionLabel}</LinkButton>}
          </li>
        ))}
      </ol>

      <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
        <span className="font-semibold text-ink">Por quê:</span> cada passo é opcional, reversível e pode ser feito por quem tem a informação (repositório e CI costumam ser de outra pessoa).
      </p>
    </section>
  );
}
