"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { Button, Field, Input } from "@/components/ui";
import { FormModal, ModalActions, useCloseOnSuccess } from "@/components/form-modal";

/**
 * Painel das ações destrutivas de uma página (achado F3 da auditoria de UX de 02/10/2026: peso
 * desigual, cada ação num estilo). Vai sempre no fim da página, com uma <DangerAction> para cada ação.
 */
export function DangerZone({ title = "Zona de perigo", children }: { title?: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="rounded-panel border border-danger/40 bg-danger/5 p-6">
      <h2 id={headingId} className="text-lg font-semibold tracking-tight text-danger">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

type DangerResult = { ok?: boolean; message?: string } | void | undefined;

/**
 * Padrão único de ação destrutiva: botão com contorno vermelho que abre uma confirmação (FormModal "sm").
 *
 * - `action`: Server Action chamada com o FormData (`confirm` + `fields`). Se devolver `{ ok: false, message }`
 *   ou lançar um erro, a mensagem aparece no modal e ele continua aberto; senão fecha.
 * - `fields`: enviados como campos ocultos (o id do que será afetado, por exemplo).
 * - `confirmText`: para ação irreversível. Pede "Digite {confirmText} para confirmar" num campo `name="confirm"`
 *   e só habilita o botão vermelho quando o texto bate exatamente. Use o nome do recurso (ou a palavra que a action valida).
 * - `actionLabel` diz verbo + objeto ("Arquivar serviço") e vale para o botão da página e para o do modal.
 */
export function DangerAction({ title, description, actionLabel, action, fields, confirmText }: {
  title: string;
  description: string;
  actionLabel: string;
  action: (formData: FormData) => DangerResult | Promise<DangerResult>;
  fields?: Record<string, string>;
  confirmText?: string;
}) {
  // A cada abertura o corpo recomeça do zero: a frase digitada (ou o erro) da vez anterior não pode deixar o botão vermelho já habilitado.
  const [opening, setOpening] = useState(0);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-danger/20 pt-4 first:border-t-0 first:pt-0">
      <div className="min-w-0 max-w-prose">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <FormModal size="sm" tone="danger" label={actionLabel} title={title} onOpen={() => setOpening((n) => n + 1)}>
        <DangerForm key={opening} description={description} actionLabel={actionLabel} action={action} fields={fields} confirmText={confirmText} />
      </FormModal>
    </div>
  );
}

type State = { ok: boolean; message: string };

/** redirect() dentro de uma Server Action chega aqui como erro; quem trata é o Next, então não pode virar mensagem. */
const isRedirect = (e: unknown) => typeof e === "object" && e !== null && "digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_REDIRECT");

/** Corpo do modal. Fica à parte porque precisa estar dentro do FormModal para fechá-lo (useCloseOnSuccess). */
function DangerForm({ description, actionLabel, action, fields, confirmText }: {
  description: string;
  actionLabel: string;
  action: (formData: FormData) => DangerResult | Promise<DangerResult>;
  fields?: Record<string, string>;
  confirmText?: string;
}) {
  const [typed, setTyped] = useState("");
  const [state, run, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    try {
      const result = await action(formData);
      if (result && result.ok === false) return { ok: false, message: result.message ?? "Não foi possível concluir. Tente de novo." };
      return { ok: true, message: "" };
    } catch (e) {
      if (isRedirect(e)) throw e;
      return { ok: false, message: e instanceof Error ? e.message : "Não foi possível concluir. Tente de novo." };
    }
  }, { ok: false, message: "" });
  useCloseOnSuccess(state, pending);
  const confirmed = confirmText === undefined || typed === confirmText;

  return (
    <form action={run} className="space-y-4">
      {fields && Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <p className="text-sm text-muted">{description}</p>
      {confirmText !== undefined && (
        <Field label={<>Digite <b className="font-semibold text-ink">{confirmText}</b> para confirmar</>} error={state.message || undefined}>
          {/* data-dirty-ignore: a frase de confirmação não conta como "digitou algo" ao fechar o modal. */}
          <Input name="confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} data-dirty-ignore="" />
        </Field>
      )}
      <ModalActions message={confirmText === undefined && state.message ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button tone="danger" disabled={!confirmed || pending}>{pending ? "Aguarde…" : actionLabel}</Button>
      </ModalActions>
    </form>
  );
}
