import Link from "next/link";

/** Aviso de filtro por tag ativo, com atalho para removê-lo — só existe quando há uma tag na URL. */
export function ActiveTagFilter({ tag, q }: { tag: string; q?: string }) {
  return (
    <p className="mb-6 flex items-center gap-2 text-sm text-muted">
      Filtrando pela tag <span className="rounded-full border border-line bg-sheet px-2 py-0.5 font-mono text-xs text-ink">#{tag}</span>
      <Link href={q ? `/?q=${q}` : "/"} className="text-accent">Remover filtro</Link>
    </p>
  );
}
