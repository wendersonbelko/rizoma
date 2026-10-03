"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@/components/ui";
import { signInWithPassword } from "./actions";

export function PasswordForm({ allowSignup, smtpReady }: { allowSignup: boolean; smtpReady: boolean }) {
  const [state, action, pending] = useActionState(signInWithPassword, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="E-mail"><Input name="email" type="email" autoComplete="username" required /></Field>
      <Field label="Senha"><Input name="password" type="password" autoComplete="current-password" required /></Field>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button className="w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
      <p className="text-sm text-muted">
        {smtpReady
          ? <Link href="/login/forgot" className="text-accent">Esqueci minha senha</Link>
          : "Esqueceu a senha? Peça um link de redefinição ao administrador."}
        {allowSignup && <> Não tem conta? <Link href="/signup" className="text-accent">Pedir acesso</Link>.</>}
      </p>
    </form>
  );
}
