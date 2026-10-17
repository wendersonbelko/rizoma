"use client";

import { startTransition, useActionState, useState } from "react";
import { TEAM_ROLE_LABEL } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { FormModal, ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { addMember } from "./actions";

/** Adicionar membro abre um modal, em vez de um formulário fixo na lista. O <form> vive no componente filho (ver create-form.tsx). */
export function AddMemberForm({ teamId }: { teamId: string }) {
  const [opening, setOpening] = useState(0);
  return (
    <FormModal label="Adicionar membro" title="Adicionar membro" tone="quiet" size="sm" onOpen={() => setOpening((n) => n + 1)}>
      <MemberForm key={opening} teamId={teamId} />
    </FormModal>
  );
}

function MemberForm({ teamId }: { teamId: string }) {
  const [state, dispatch, pending] = useActionState(addMember, { ok: false });
  useCloseOnSuccess(state, pending);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="teamId" value={teamId} />
      <Field label="@usuário do GitHub ou e-mail *" error={state.errors?.login} hint="A pessoa precisa ter acesso ativo ao hub.">
        <Input name="login" placeholder="@fulano ou fulano@empresa.com" required autoComplete="off" aria-invalid={!!state.errors?.login} />
      </Field>
      <Field label="Papel no time *" error={state.errors?.role}>
        <Select name="role" defaultValue="MEMBER">
          <option value="MEMBER">{TEAM_ROLE_LABEL.MEMBER}</option>
          <option value="LEAD">{TEAM_ROLE_LABEL.LEAD}</option>
        </Select>
      </Field>
      <ModalActions message={state.message && !state.ok ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending}>{pending ? "Adicionando…" : "Adicionar membro"}</Button>
      </ModalActions>
    </form>
  );
}
