"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@/components/ui";
import { signupAction } from "./actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {});
  if (state.ok)
    return (
      <p className="text-muted">
        Solicitação registrada. Quando um administrador aprovar, você entra com seu e-mail e senha. <Link href="/login" className="text-accent">Voltar ao login</Link>
      </p>
    );
  return (
    <form action={action} className="space-y-4">
      <Field label="Nome"><Input name="name" required /></Field>
      <Field label="E-mail"><Input name="email" type="email" required /></Field>
      <Field label="Senha" hint="12+ caracteres, misturando letras, números e símbolos."><Input name="password" type="password" autoComplete="new-password" required /></Field>
      <Field label="Confirmar senha"><Input name="confirm" type="password" autoComplete="new-password" required /></Field>
      <Field label="Por que precisa de acesso?">
        <textarea name="reason" rows={3} required className="w-full rounded-control border border-line bg-field px-3 py-2 text-[15px]" />
      </Field>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button className="w-full" disabled={pending}>Pedir acesso</Button>
    </form>
  );
}
