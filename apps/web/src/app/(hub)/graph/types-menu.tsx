"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import type { NodeKind } from "@api-hub/core/graph";
import { SERVICE_KIND_LABEL, SERVICE_KINDS, type ServiceKind } from "@api-hub/core/types";
import { Badge } from "@/components/ui";
import { KIND } from "./constants";
import { useOutsideClose } from "./use-outside-close";

const KINDS = Object.keys(KIND) as NodeKind[];

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/**
 * "Tipos ▾": quais tipos de item entram no mapa (serviços, integrações, repositórios, times,
 * pessoas) e, dentro dos serviços, quais sistemas (API, Frontend, Worker). Ficam num menu para a
 * barra de cima mostrar só o essencial (foco e alcance); o botão avisa quando algo está oculto.
 */
export function TypesMenu({ kinds, onKindsChange, serviceKinds, onServiceKindsChange }: {
  kinds: NodeKind[]; onKindsChange: (kinds: NodeKind[]) => void;
  serviceKinds: ServiceKind[]; onServiceKindsChange: (kinds: ServiceKind[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(rootRef, open, close);

  const showsServices = kinds.includes("service");
  const hidden = KINDS.length - kinds.length + (showsServices ? SERVICE_KINDS.length - serviceKinds.length : 0);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  return (
    <div ref={rootRef} data-tour="graph-types" className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-control border border-line-strong bg-field px-3 text-sm hover:border-accent"
      >
        Tipos
        {hidden > 0 && <Badge tone="wait">{hidden} {hidden === 1 ? "oculto" : "ocultos"}</Badge>}
        <span aria-hidden className="text-muted">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-panel border border-line bg-raised p-3 shadow-[0_8px_24px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_20%,transparent)]">
          <fieldset>
            <legend className="mb-1 text-xs font-medium text-muted">O que aparece no mapa</legend>
            {KINDS.map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-2.5 rounded-control px-1.5 py-1.5 text-sm hover:bg-paper">
                <input type="checkbox" checked={kinds.includes(k)} onChange={() => onKindsChange(toggle(kinds, k))} className="size-4 accent-accent" />
                <span aria-hidden className={`inline-block h-3.5 w-6 shrink-0 ${KIND[k].swatch}`} />
                {KIND[k].label}
              </label>
            ))}
          </fieldset>
          {showsServices && (
            <fieldset className="mt-2 border-t border-line pt-2">
              <legend className="mb-1 text-xs font-medium text-muted">Tipos de serviço</legend>
              {SERVICE_KINDS.map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-2.5 rounded-control px-1.5 py-1.5 text-sm hover:bg-paper">
                  <input type="checkbox" checked={serviceKinds.includes(k)} onChange={() => onServiceKindsChange(toggle(serviceKinds, k))} className="size-4 accent-accent" />
                  {SERVICE_KIND_LABEL[k]}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}
