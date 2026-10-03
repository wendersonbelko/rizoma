/** Indicador dos passos de um formulário dentro do modal. O passo atual fica em destaque. */
export function FormSteps({ labels, current }: { labels: readonly string[]; current: number }) {
  return (
    <ol className="mb-4 flex flex-wrap gap-x-4 gap-y-1 border-b border-line pb-3 text-sm" aria-label="Etapas">
      {labels.map((label, i) => (
        <li key={label} className={i === current ? "font-semibold text-ink" : "text-muted"} aria-current={i === current ? "step" : undefined}>
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}
