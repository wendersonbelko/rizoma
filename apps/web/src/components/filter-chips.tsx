import Link from "next/link";

export type FilterChip = { label: string; href: string; active: boolean; tour?: string };

/** Filtros rápidos em pílulas (por tipo, por categoria…) acima de uma listagem — sempre com esta cara. */
export function FilterChips({ items, label, tour }: { items: FilterChip[]; label: string; tour?: string }) {
  return (
    <nav aria-label={label} data-tour={tour} className="flex flex-wrap gap-2 text-sm">
      {items.map((c) => (
        <Link
          key={c.href + c.label}
          href={c.href}
          data-tour={c.tour}
          aria-current={c.active ? "true" : undefined}
          className={`rounded-full border px-3 py-1 ${c.active ? "border-ink bg-sheet font-medium text-ink" : "border-line text-muted hover:border-ink hover:text-ink"}`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
