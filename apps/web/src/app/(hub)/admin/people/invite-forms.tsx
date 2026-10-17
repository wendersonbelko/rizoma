"use client";

import { startTransition, useActionState, useState } from "react";
import { ROLE_LABEL } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { ModalActions } from "@/components/form-modal";
import { inviteUser } from "./actions";
import { LinkBox } from "./link-box";

/**
 * Convite por e-mail. O formulário vive aqui, dentro do FormModal da página (id `invite`). Depois de
 * gerar, o modal continua aberto mostrando o link para copiar; "Convidar outra pessoa" recomeça do zero.
 */
export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [round, setRound] = useState(0);
  return <InviteBody key={round} canInviteAdmin={canInviteAdmin} onAnother={() => setRound((n) => n + 1)} />;
}

function InviteBody({ canInviteAdmin, onAnother }: { canInviteAdmin: boolean; onAnother: () => void }) {
  const [state, dispatch, pending] = useActionState(inviteUser, { ok: false });

  if (state.ok) {
    return (
      <div className="space-y-4">
        <LinkBox ok message={state.message} url={state.url} />
        <ModalActions cancelLabel="Fechar">
          <Button type="button" onClick={onAnother}>Convidar outra pessoa</Button>
        </ModalActions>
      </div>
    );
  }

  return (
    // onSubmit em vez de action={…}: o React limparia os campos depois do envio, e um e-mail digitado
    // errado precisa continuar na tela para a pessoa corrigir.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="space-y-4"
    >
      <Field label="E-mail *" error={state.errors?.email}>
        <Input name="email" type="email" required autoComplete="off" placeholder="nome@empresa.com" aria-invalid={!!state.errors?.email} />
      </Field>
      <Field label="Papel *" error={state.errors?.role} hint="O papel define o que a pessoa pode fazer. Você muda depois em Pessoas e acesso.">
        <Select name="role" defaultValue="VIEWER" aria-invalid={!!state.errors?.role}>
          <option value="VIEWER">{ROLE_LABEL.VIEWER}</option>
          <option value="MAINTAINER">{ROLE_LABEL.MAINTAINER}</option>
          {canInviteAdmin && <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>}
        </Select>
      </Field>
      <details className="rounded-control border border-line px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium">Detalhes opcionais</summary>
        <div className="mt-3">
          <Field label="Nome" hint="Aparece na lista de pessoas até a pessoa entrar."><Input name="name" autoComplete="off" /></Field>
        </div>
      </details>
      <ModalActions message={state.message ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending}>{pending ? "Gerando…" : "Gerar convite"}</Button>
      </ModalActions>
    </form>
  );
}
