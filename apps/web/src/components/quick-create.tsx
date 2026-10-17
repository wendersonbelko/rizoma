"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CreateShortcut } from "@api-hub/core/create-shortcuts";
import { useTour } from "@/components/tour/TourProvider";
import { goTo } from "@/components/go-to";

/**
 * Botão "+ Novo" no topo da barra lateral (p. 13 da auditoria de UX de 02/10/2026: "Cadastros que
 * viram atalhos"). Abre um menu com os mesmos atalhos de criação da seção "Criar" do ⌘K, já filtrados
 * por permissão no layout; cada um leva à tela do cadastro e abre o modal-padrão (`#id`).
 *
 * Teclado (padrão de menu): Enter, Espaço ou ↓ abrem no primeiro item (↑ abre no último); ↑ ↓ Home
 * End percorrem; Esc fecha e devolve o foco ao botão; Tab fecha. Nenhuma checagem de acesso aqui:
 * a lista já vem filtrada e a Server Action de cada cadastro revalida no servidor.
 */
export function QuickCreate({ items }: { items: CreateShortcut[] }) {
  const router = useRouter();
  const { mandatory, activeTour } = useTour();
  const disabled = !!mandatory || !!activeTour;
  const [open, setOpen] = useState(false);
  // Em qual item o foco entra ao abrir: `null` abre sem mexer (clique do mouse).
  const [entry, setEntry] = useState<"first" | "last" | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const menuItems = useCallback(() => [...(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])], []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const els = menuItems();
    if (entry === "first") els[0]?.focus();
    else if (entry === "last") els[els.length - 1]?.focus();
  }, [open, entry, menuItems]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Um tour começou com o menu aberto: fecha, para não ficar por cima do destaque.
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  if (items.length === 0) return null;

  const openMenu = (at: "first" | "last" | null) => {
    if (disabled) return;
    setEntry(at);
    setOpen(true);
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const els = menuItems();
    const index = els.findIndex((el) => el === document.activeElement);
    const focusAt = (i: number) => els[(i + els.length) % els.length]?.focus();
    if (e.key === "ArrowDown") { e.preventDefault(); focusAt(index + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusAt(index - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusAt(0); }
    else if (e.key === "End") { e.preventDefault(); focusAt(-1); }
    else if (e.key === "Escape") { e.preventDefault(); close(true); }
    // Tab sai do menu: fecha sem prender o foco nem devolvê-lo ao botão.
    else if (e.key === "Tab") close(false);
  };

  return (
    <div
      ref={root}
      className="relative shrink-0"
      onBlur={(e) => {
        // Tab para fora do menu fecha; clicar numa área sem foco dentro dele não.
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        data-tour="quick-create"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu(null))}
        onKeyDown={(e) => {
          // Com o menu já aberto (abriu pelo mouse), a seta só leva o foco para dentro dele.
          if (e.key === "ArrowDown") { e.preventDefault(); if (open) menuItems()[0]?.focus(); else openMenu("first"); }
          else if (e.key === "ArrowUp") { e.preventDefault(); if (open) menuItems().at(-1)?.focus(); else openMenu("last"); }
          else if (e.key === "Escape" && open) { e.stopPropagation(); close(true); }
        }}
        className="inline-flex h-10 items-center gap-1 rounded-control bg-accent px-2.5 text-sm font-semibold tracking-tight text-accent-ink shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_16%,transparent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
        Novo
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Criar"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-30 mt-2 w-56 rounded-panel border border-line bg-raised p-1.5 shadow-[0_12px_32px_color-mix(in_srgb,var(--color-shadow)_28%,transparent)]"
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              role="menuitem"
              tabIndex={-1}
              onClick={(e) => {
                // Foco no botão antes de seguir: o modal que abrir devolve o foco para ele ao fechar.
                trigger.current?.focus();
                setOpen(false);
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                goTo(router, item.href);
              }}
              className="block rounded-control px-3 py-2 text-sm text-ink/90 transition hover:bg-accent/10 hover:text-ink focus-visible:bg-accent/10 focus-visible:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
