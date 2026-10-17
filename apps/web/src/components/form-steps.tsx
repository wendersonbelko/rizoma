/**
 * Dois ou três passos, nunca mais (achado da p. 14 da auditoria de UX de 02/10/2026): wizard só
 * quando as etapas dependem uma da outra. O tipo recusa quatro rótulos ou mais de propósito.
 */
export type FormStepLabels = readonly [string, string] | readonly [string, string, string];

/**
 * Indicador dos passos de um formulário dentro do modal. O passo atual fica em destaque.
 * Os rótulos começam com verbo, como o botão de cada passo: "Identificar", "Detalhar", "Endereçar".
 */
export function FormSteps({ labels, current }: { labels: FormStepLabels; current: number }) {
  const items: readonly string[] = labels;
  return (
    <ol className="mb-4 flex flex-wrap gap-x-4 gap-y-1 border-b border-line pb-3 text-sm" aria-label="Etapas">
      {items.map((label, i) => (
        <li key={label} className={i === current ? "font-semibold text-ink" : "text-muted"} aria-current={i === current ? "step" : undefined}>
          {i + 1}. {label}
          <span className="sr-only">{i < current ? " (concluído)" : i === current ? ` (passo ${i + 1} de ${items.length})` : ""}</span>
        </li>
      ))}
    </ol>
  );
}
