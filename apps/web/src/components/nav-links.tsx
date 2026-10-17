"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HUB_NAV_GROUP_LABEL, type HubNavGroup } from "@api-hub/core/hub-nav";

export type NavItem = { href: string; label: string; badge?: number; group?: HubNavGroup };

/**
 * Item ativo (achados N1/N2 da auditoria de UX de 02/10/2026): o Catálogo também vale para a página e
 * a edição de um serviço (/services/*); os demais pelo começo do caminho, por segmento inteiro
 * (/admin/people não acende /admin/permissions).
 */
const isActive = (path: string, href: string) => {
  if (href === "/") return path === "/" || path === "/services" || path.startsWith("/services/");
  return path === href || path.startsWith(`${href}/`);
};

/**
 * Barra lateral em 4 grupos (Explorar, Cadastros, Pessoas, Sistema; achado N3). Um grupo sem item
 * visível para a pessoa não aparece. Em tela estreita os grupos ficam lado a lado, sem o cabeçalho.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const of = (group: HubNavGroup) => items.filter((n) => n.group === group);
  return (
    <nav data-tour="hub-nav" className="-mx-1 flex gap-4 overflow-x-auto pb-1 md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:pb-0">
      <NavGroup group="explore" tour="hub-nav-explore" items={of("explore")} />
      <NavGroup group="registry" tour="hub-nav-registry" items={of("registry")} />
      <NavGroup group="people" tour="hub-nav-people" items={of("people")} />
      <NavGroup group="system" tour="hub-nav-system" items={of("system")} />
    </nav>
  );
}

function NavGroup({ group, tour, items }: { group: HubNavGroup; tour: string; items: NavItem[] }) {
  const path = usePathname();
  if (items.length === 0) return null;
  return (
    <div data-tour={tour} role="group" aria-label={HUB_NAV_GROUP_LABEL[group]} className="flex shrink-0 flex-col gap-1 md:mt-6 md:w-full md:min-w-0 md:first:mt-2">
      <p aria-hidden className="hidden px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted/80 md:block">{HUB_NAV_GROUP_LABEL[group]}</p>
      {items.map((n) => {
        const active = isActive(path, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-control px-3 py-2 text-sm transition ${active ? "bg-accent/10 font-semibold text-accent shadow-[inset_3px_0_0_var(--color-accent)]" : "text-ink/80 hover:bg-paper hover:text-ink"}`}
          >
            {n.label}
            {n.badge ? <span className="rounded-full bg-wait/15 px-2 py-0.5 text-xs font-semibold text-wait">{n.badge}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}
