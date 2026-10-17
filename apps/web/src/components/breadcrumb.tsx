import Link from "next/link";

/**
 * Trilha de navegação (achado N2 da auditoria de UX de 02/10/2026): onde a pessoa está dentro de
 * uma hierarquia ("Catálogo › Pagamentos API › Editar"). Os itens com `href` voltam um nível; o último
 * é a página atual, sem link e marcado com `aria-current="page"`.
 */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Trilha">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span aria-hidden="true">›</span>}
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={`truncate ${last ? "max-w-[32ch] font-medium text-ink" : ""}`}>{item.label}</span>
              ) : (
                <Link href={item.href} className="truncate underline-offset-2 hover:text-ink hover:underline">{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
