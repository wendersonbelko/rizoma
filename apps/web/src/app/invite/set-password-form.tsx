"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { acceptInvite } from "./actions";

export function SetPasswordForm({ token, askName, defaultName }: { token: string; askName: boolean; defaultName: string }) {
  const [state, action, pending] = useActionState(acceptInvite, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {askName && <Field label="Seu nome"><Input name="name" defaultValue={defaultName} required /></Field>}
      <Field label="Senha" hint="12+ caracteres, misturando letras, números e símbolos."><Input name="password" type="password" autoComplete="new-password" required /></Field>
      <Field label="Confirmar senha"><Input name="confirm" type="password" autoComplete="new-password" required /></Field>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button className="w-full" disabled={pending}>Salvar senha</Button>
    </form>
  );
}
