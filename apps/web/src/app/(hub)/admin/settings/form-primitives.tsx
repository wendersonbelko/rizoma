"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { DirtyForm } from "@/components/save-bar";
import { FormModal, ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import type { SettingsResult } from "./actions";

/** Mensagem de sucesso/erro — usada por todo formulário desta pasta. */
export function Msg({ state }: { state: SettingsResult | null }) {
  if (!state?.message) return null;
  return <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>;
}

/**
 * Formulário de configuração de uma página (achado F1 da auditoria de UX de 02/10/2026): o botão de
 * salvar só aparece quando há mudança, numa barra no fim do formulário, e há aviso ao sair com edição
 * pendente (tudo isso é do <DirtyForm>). Aqui entra só o que é de Configurações: a Server Action
 * devolve `{ ok, message }`; o erro fica na barra (o formulário continua "sujo") e o sucesso vira
 * uma linha de confirmação no lugar onde a barra estava.
 */
export function SettingsForm({ action, saveLabel = "Salvar", className = "space-y-5", children }: {
  action: (formData: FormData) => Promise<SettingsResult>;
  saveLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<SettingsResult | null>(null);
  const save = async (formData: FormData) => setState(await action(formData));
  // O "Salvo." de antes não vale mais quando a pessoa volta a editar; o erro fica até o próximo envio.
  const forgetSuccess = () => setState((s) => (s?.ok ? null : s));
  const error = state && !state.ok ? (state.message ?? "Não foi possível salvar. Tente de novo.") : undefined;
  return (
    <div onInput={forgetSuccess} onChange={forgetSuccess}>
      <DirtyForm action={save} saveLabel={saveLabel} error={error} className={className}>{children}</DirtyForm>
      {/* Região sempre presente (leitor de tela anuncia o texto quando aparece); só ocupa espaço quando há "Salvo." para mostrar. */}
      <p role="status" className={state?.ok && state.message ? "mt-3 text-sm text-accent" : "sr-only"}>{state?.ok ? state.message : null}</p>
    </div>
  );
}

/** Ação sem campos (um botão e a resposta), como "Conferir vínculos". */
export function ActionForm({ action, submit, tone, children }: { action: () => Promise<SettingsResult>; submit: string; tone?: "primary" | "quiet" | "danger"; children?: ReactNode }) {
  const [state, setState] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setState(await action())); }} className="space-y-4">
      {children}
      <div className="flex flex-wrap items-center gap-4"><Button tone={tone} disabled={pending}>{pending ? "Aguarde…" : submit}</Button><Msg state={state} /></div>
    </form>
  );
}

/**
 * "Desligar" de uma linha de tabela: mesmo padrão da ação destrutiva do hub (botão com contorno vermelho que
 * abre uma confirmação), em tamanho de linha. O <DangerAction> é um bloco de página e não cabe numa célula.
 * `run` devolve o resultado; se falhar, a mensagem fica no modal, que continua aberto.
 */
export function ConfirmOff({ label, title, description, actionLabel, run }: {
  label: string;
  title: string;
  description: string;
  actionLabel: string;
  run: () => Promise<SettingsResult>;
}) {
  const [opening, setOpening] = useState(0);
  return (
    <FormModal size="sm" tone="danger" label={label} title={title} onOpen={() => setOpening((n) => n + 1)}>
      <ConfirmOffBody key={opening} description={description} actionLabel={actionLabel} run={run} />
    </FormModal>
  );
}

function ConfirmOffBody({ description, actionLabel, run }: { description: string; actionLabel: string; run: () => Promise<SettingsResult> }) {
  const [state, setState] = useState<SettingsResult>({ ok: false });
  const [pending, start] = useTransition();
  useCloseOnSuccess(state, pending);
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setState(await run())); }} className="space-y-4">
      <p className="text-sm text-muted">{description}</p>
      <ModalActions message={!state.ok && state.message ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button tone="danger" disabled={pending}>{pending ? "Aguarde…" : actionLabel}</Button>
      </ModalActions>
    </form>
  );
}
