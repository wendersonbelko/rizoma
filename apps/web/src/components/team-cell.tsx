/** Nome do time responsável numa célula de tabela, ou "sem time" esmaecido. */
export function TeamCell({ name }: { name?: string | null }) {
  if (!name) return <span className="text-muted">sem time</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-1.5 shrink-0 rounded-full bg-muted" aria-hidden />
      {name}
    </span>
  );
}
