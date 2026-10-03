"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui";
import type { SettingsResult } from "./actions";

const initial: SettingsResult = { ok: false };

/** Mensagem de sucesso/erro — usada por todo formulário desta pasta. */
export function Msg({ state }: { state: SettingsResult | null }) {
  if (!state?.message) return null;
  return <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>;
}

/** Formulário padrão (server action + botão + mensagem) — a maioria das seções de Configurações usa isto. */
export function Form({ action, submit, tone, children }: { action: (s: SettingsResult, f: FormData) => Promise<SettingsResult>; submit: string; tone?: "primary" | "quiet" | "danger"; children?: ReactNode }) {
  const [state, run, pending] = useActionState(action, initial);
  return (
    <form action={run} className="space-y-5">
      {children}
      <div className="flex flex-wrap items-center gap-4"><Button tone={tone} disabled={pending}>{pending ? "Salvando…" : submit}</Button><Msg state={state} /></div>
    </form>
  );
}

/** Para seções cujo estado é editado num componente à parte (listas dinâmicas) e só salvo aqui. */
export function JsonSave({ onSave, label }: { onSave: () => Promise<SettingsResult>; label: string }) {
  const [state, setState] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled={pending} onClick={() => start(async () => setState(await onSave()))}>{pending ? "Salvando…" : label}</Button>
      <Msg state={state} />
    </div>
  );
}
