"use client";

import { startTransition, useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { FormModal, ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { NameSlugFields } from "@/components/name-slug-fields";
import { createTeam } from "./actions";

/**
 * Cadastro de time (id `new-team`, aberto pelo "+ Novo" e pelo ⌘K). O <form> vive num componente FILHO
 * do modal: `useCloseOnSuccess` só enxerga o modal de dentro dele. A cada abertura o corpo recomeça
 * do zero (key), já que o formulário não é limpo pelo React depois do envio.
 */
export function TeamCreateForm() {
  const [opening, setOpening] = useState(0);
  return (
    <FormModal id="new-team" tour="teams-new" label="Novo time" title="Novo time" tone="primary" size="sm" onOpen={() => setOpening((n) => n + 1)}>
      <TeamForm key={opening} />
    </FormModal>
  );
}

function TeamForm() {
  const [state, dispatch, pending] = useActionState(createTeam, { ok: false });
  useCloseOnSuccess(state, pending);
  return (
    // onSubmit em vez de action={…}: o React limparia os campos depois do envio e um nome repetido se perderia.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="space-y-4"
    >
      <NameSlugFields nameRequired nameLabel="Nome do time" namePlaceholder="Ex.: Pagamentos" slugPrefix="/admin/teams?team=" errors={state.errors} />
      <details className="rounded-control border border-line px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium">Detalhes opcionais</summary>
        <div className="mt-3">
          <Field label="Descrição" error={state.errors?.description}><Input name="description" /></Field>
        </div>
      </details>
      <ModalActions message={state.message && !state.ok ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending}>{pending ? "Criando…" : "Criar time"}</Button>
      </ModalActions>
    </form>
  );
}
