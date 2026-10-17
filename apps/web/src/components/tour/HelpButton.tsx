"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { getTour, resolveTourKey } from "@/lib/tours";
import { useTour } from "./TourProvider";

/**
 * Botão "?" flutuante presente em toda tela do hub. Explica a tela atual e oferece um tour
 * guiado dela sob demanda (achado da auditoria de UX: primeiro contato mais guiado).
 * Fica desabilitado enquanto o tour obrigatório está em andamento, para não sobrepor tours.
 */
export function HelpButton() {
  const pathname = usePathname();
  const { mandatory, activeTour, startTour } = useTour();
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const key = resolveTourKey(pathname);
  const def = getTour(key);
  const disabled = !!mandatory || !!activeTour;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignora o próprio botão: o clique nele já alterna `open` via onClick, e sem essa
      // exclusão o mousedown fechava o card e o click logo em seguida reabria — o botão
      // nunca conseguia fechar o card clicando nele de novo.
      if (buttonRef.current?.contains(target)) return;
      if (cardRef.current && !cardRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-tour="help-button"
        aria-label="Ajuda desta tela"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 grid size-11 place-items-center rounded-full bg-accent text-lg font-bold text-accent-ink shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ?
      </button>
      {open && (
        <div
          ref={cardRef}
          role="dialog"
          aria-label="Ajuda desta tela"
          className="fixed bottom-20 right-5 z-40 w-80 max-w-[calc(100vw-2.5rem)] rounded-panel border border-line bg-sheet p-4 shadow-xl"
        >
          {def ? (
            <>
              <h2 className="font-semibold">{def.title}</h2>
              <p className="mt-1 text-sm text-muted">{def.description}</p>
              <Button
                className="mt-3"
                onClick={() => {
                  setOpen(false);
                  startTour(key!);
                }}
              >
                Iniciar tour desta tela
              </Button>
            </>
          ) : (
            <>
              <h2 className="font-semibold">Ajuda</h2>
              <p className="mt-1 text-sm text-muted">Esta tela ainda não tem um tour guiado.</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
