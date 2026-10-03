"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PAGE_SIZES } from "@api-hub/core/pagination";

/**
 * Ao trocar de página, a listagem volta para o topo: zera a rolagem interna (tabelas com
 * cabeçalho fixo) e, se o topo do card ficou acima da tela, rola até ele. Sem card em volta
 * (ex.: lista de seções), volta ao topo da página.
 */
export function revealListTop(from: Element) {
  const list = from.closest("[data-list]");
  if (!list) return window.scrollTo({ top: 0 });
  list.querySelectorAll("[data-scroll-area]").forEach((el) => el.scrollTo({ top: 0 }));
  if (list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: "start" });
}

/** Link para uma página da listagem — sem pular para o topo da tela inteira. */
export function PageLink({ href, label, className, children }: { href: string; label: string; className: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className={className}
      onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey) revealListTop(e.currentTarget); }}
    >
      {children}
    </Link>
  );
}

export function PageSizeSelect({ value, onChange }: { value: number; onChange: (size: number, el: HTMLSelectElement) => void }) {
  return (
    <label className="flex items-center gap-2 text-muted">
      Por página
      {/* defaultValue + key: não volta para o valor antigo enquanto a nova página carrega. */}
      <select
        key={value}
        defaultValue={value}
        onChange={(e) => onChange(Number(e.target.value), e.currentTarget)}
        className="rounded-control border border-line bg-field px-2 py-1 text-sm text-ink focus:border-accent"
      >
        {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>
  );
}

/** "Por página" das listagens paginadas por URL: cada opção já vem com a URL pronta. */
export function PageSizeLinks({ value, hrefs }: { value: number; hrefs: Record<number, string> }) {
  const router = useRouter();
  return (
    <PageSizeSelect
      value={value}
      onChange={(size, el) => {
        revealListTop(el);
        router.push(hrefs[size] ?? "?", { scroll: false });
      }}
    />
  );
}
