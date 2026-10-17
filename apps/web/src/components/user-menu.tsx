"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ThemePreference } from "@api-hub/core/types";
import { ThemeSwitch } from "@/components/theme-switch";

/**
 * Menu da conta no pé do menu lateral (achados F5 e p.13/p.15 da auditoria de UX de 02/10/2026):
 * avatar, nome e papel; ao clicar abre um pop-over com a Aparência da pessoa e o "Sair". O "Sair"
 * é discreto: só ganha a cor de perigo quando o mouse está em cima, para não competir com o nome.
 */
export function UserMenu({ name, roleLabel, image, preference, signOutAction }: {
  name: string; roleLabel: string; image: string | null; preference: ThemePreference; signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    // Foco no tema atual, para ajustar com as setas sem procurar o controle.
    root.current?.querySelector<HTMLInputElement>("input[type=radio]:checked")?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(e) => {
        // Tab para fora do menu fecha; clicar numa área sem foco dentro dele não.
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Menu da conta"
          className="absolute inset-x-0 bottom-full z-30 mb-2 rounded-panel border border-line bg-raised p-3 shadow-[0_12px_32px_color-mix(in_srgb,var(--color-shadow)_28%,transparent)]"
        >
          <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Aparência</p>
          <ThemeSwitch preference={preference} />
          <form action={signOutAction} className="mt-3 border-t border-line pt-2">
            <button className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm text-muted transition hover:bg-danger/10 hover:text-danger">
              <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 2.5h-3v11h3M10 5l3 3-3 3M13 8H6.5" />
              </svg>
              Sair
            </button>
          </form>
        </div>
      )}
      <button
        ref={trigger}
        type="button"
        data-tour="user-menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center gap-3 rounded-panel border border-line bg-paper p-2.5 text-left text-sm transition hover:border-line-strong"
      >
        {image
          ? <img src={image} alt="" className="size-9 shrink-0 rounded-full" />
          : <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{name.replace(/^@/, "").slice(0, 1).toUpperCase()}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{name}</span>
          <span className="block truncate text-xs text-muted">{roleLabel}</span>
        </span>
        <svg aria-hidden viewBox="0 0 16 16" className={`size-4 shrink-0 text-muted transition ${open ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
    </div>
  );
}
