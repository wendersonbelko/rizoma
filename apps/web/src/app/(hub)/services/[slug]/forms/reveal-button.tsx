"use client";

import { useState, useTransition } from "react";
import { revealEnvVar } from "../actions";

/** Revela um valor secreto sob pedido (fica registrado na auditoria). */
export function RevealButton({ id }: { id: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (value !== null)
    return (
      <span className="flex flex-col gap-1">
        <code className="break-all font-mono text-[13px]">{value || "(vazio)"}</code>
        <span className="flex gap-3 font-sans">
          <button type="button" className="text-xs text-accent" onClick={() => navigator.clipboard?.writeText(value)}>copiar</button>
          <button type="button" className="text-xs text-muted" onClick={() => setValue(null)}>ocultar</button>
        </span>
      </span>
    );
  return (
    <span>
      <button type="button" disabled={pending} className="text-sm text-accent" onClick={() => start(async () => {
        const r = await revealEnvVar(id);
        if (r.ok) setValue(r.value ?? ""); else setError(r.message ?? "Sem permissão.");
      })}>•••••• revelar</button>
      {error && <span className="ml-2 text-xs text-danger">{error}</span>}
    </span>
  );
}
