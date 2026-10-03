"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; badge?: number; group?: "catalog" | "admin" };

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" || path.startsWith("/services") : path.startsWith(href));
  const itemClass = (href: string) => {
    const active = isActive(href);
    return `flex shrink-0 items-center justify-between gap-2 rounded-control px-3 py-2 text-sm transition ${active ? "bg-accent/10 font-semibold text-accent shadow-[inset_3px_0_0_var(--color-accent)]" : "text-ink/80 hover:bg-paper hover:text-ink"}`;
  };
  const catalog = items.filter((n) => n.group === "catalog");
  const admin = items.filter((n) => n.group === "admin");

  return (
    <nav data-tour="hub-nav" className="-mx-1 flex gap-4 overflow-x-auto pb-1 md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:pb-0">
      {catalog.length > 0 && (
        <div data-tour="hub-nav-catalog" className="flex min-w-0 flex-col gap-1 md:w-full">
          <p className="mt-2 hidden px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted/80 md:block">Catálogo</p>
          {catalog.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={itemClass(n.href)}>
              {n.label}
              {n.badge ? <span className="rounded-full bg-wait/15 px-2 py-0.5 text-xs font-semibold text-wait">{n.badge}</span> : null}
            </Link>
          ))}
        </div>
      )}
      {admin.length > 0 && (
        <div data-tour="hub-nav-admin" className="flex min-w-0 flex-col gap-1 md:w-full">
          <p className={`${catalog.length ? "mt-6" : "mt-2"} hidden px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted/80 md:block`}>Administração</p>
          {admin.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={itemClass(n.href)}>
              {n.label}
              {n.badge ? <span className="rounded-full bg-wait/15 px-2 py-0.5 text-xs font-semibold text-wait">{n.badge}</span> : null}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
