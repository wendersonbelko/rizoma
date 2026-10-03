import Link from "next/link";

export type TabItem = { id: string; label: string; href: string; tour?: string };

/**
 * Abas de página, navegando por URL (?tab=, ?t=, ?s=…). Padrão único para a página do serviço,
 * Serviços e vínculos, Configurações e qualquer outra tela com seções em abas.
 * A linha de base é uma sombra (não borda) para não sumir nem gerar barra de rolagem vertical.
 */
export function TabNav({ items, active, label, tour }: { items: TabItem[]; active: string; label: string; tour?: string }) {
  return (
    <nav
      aria-label={label}
      data-tour={tour}
      className="flex gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-line)] [scrollbar-width:thin]"
    >
      {items.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          data-tour={t.tour}
          aria-current={active === t.id ? "page" : undefined}
          className={`shrink-0 border-b-2 px-3 py-2 text-sm ${active === t.id ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
