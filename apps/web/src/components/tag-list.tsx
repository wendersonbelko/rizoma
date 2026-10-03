import Link from "next/link";

/**
 * Lista de tags como pílulas clicáveis, cada uma levando ao filtro correspondente.
 * Responsabilidade única: layout das pílulas — quem chama decide para onde cada tag aponta.
 */
export function TagList({ tags, hrefFor }: { tags: string[]; hrefFor: (tag: string) => string }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {tags.map((t) => (
        <Link key={t} href={hrefFor(t)} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-ink hover:text-ink">
          #{t}
        </Link>
      ))}
    </div>
  );
}
