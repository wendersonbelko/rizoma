"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { FormModal, useCloseOnSuccess } from "@/components/form-modal";
import { NameSlugFields } from "@/components/name-slug-fields";
import { createTeam } from "./actions";

async function submit(_prev: { ok: boolean; message: string }, form: FormData) {
  try {
    await createTeam(form);
    return { ok: true, message: "Time criado." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Não foi possível criar o time." };
  }
}

/** Cadastro de time, aberto só quando a pessoa vai preencher. */
export function TeamCreateForm() {
  const [state, action, pending] = useActionState(submit, { ok: false, message: "" });
  useCloseOnSuccess(state, pending);
  return (
    <FormModal tour="teams-new" label="Novo time" title="Novo time" tone="primary">
      <form action={action} className="space-y-4">
        <NameSlugFields slugHint="Identificador curto usado em URLs e na API: {slug}." />
        <Field label="Descrição"><Input name="description" /></Field>
        <div className="flex items-center gap-4">
          <Button disabled={pending}>{pending ? "Criando…" : "Criar time"}</Button>
          {state.message && !state.ok && <p className="text-sm text-danger">{state.message}</p>}
        </div>
      </form>
    </FormModal>
  );
}
