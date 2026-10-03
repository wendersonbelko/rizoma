"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@/components/ui";
import { HubLogo } from "@/components/hub-logo";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, { message: "" });
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-4">
        <HubLogo className="size-12" />
        <h1 className="text-2xl font-bold tracking-tight">Nova senha</h1>
        <p className="text-sm text-muted">Informe o e-mail da conta. Se ela existir e entrar com senha, o link chega por e-mail.</p>
        <form action={action} className="space-y-4">
          <Field label="E-mail"><Input name="email" type="email" autoComplete="username" required /></Field>
          <Button className="w-full" disabled={pending}>{pending ? "Enviando…" : "Enviar link"}</Button>
        </form>
        {state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
        <p className="text-sm"><Link href="/login" className="text-accent">Voltar ao login</Link></p>
      </div>
    </main>
  );
}
