"use client";

import { useActionState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { FormModal, useCloseOnSuccess } from "@/components/form-modal";
import { addMember } from "./actions";

async function submit(_prev: { ok: boolean; message: string }, form: FormData) {
  try {
    await addMember(form);
    return { ok: true, message: "" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Não foi possível adicionar." };
  }
}

/** Adicionar membro abre um modal, em vez de um formulário fixo na lista. */
export function AddMemberForm({ teamId }: { teamId: string }) {
  const [state, action, pending] = useActionState(submit, { ok: false, message: "" });
  useCloseOnSuccess(state, pending);
  return (
    <FormModal label="Adicionar membro" title="Adicionar membro" tone="quiet">
      <form action={action} className="space-y-4">
        <input type="hidden" name="teamId" value={teamId} />
        <Input name="login" aria-label="Usuário do GitHub ou e-mail" placeholder="@fulano ou fulano@empresa.com" required />
        <Select name="role" aria-label="Papel no time"><option value="MEMBER">Membro</option><option value="LEAD">Líder</option></Select>
        <div className="flex items-center gap-4">
          <Button disabled={pending}>{pending ? "Adicionando…" : "Adicionar membro"}</Button>
          {state.message && <p className="text-sm text-danger">{state.message}</p>}
        </div>
      </form>
    </FormModal>
  );
}
