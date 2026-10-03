"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { RowActionButton, rowActionClass } from "@/components/table";
import { inviteUser, passwordResetLink, type InviteResult } from "./actions";

function LinkBox({ state }: { state: InviteResult }) {
  if (!state.message) return null;
  return (
    <div className={`space-y-2 text-sm ${state.ok ? "" : "text-danger"}`}>
      <p>{state.message}</p>
      {state.url && (
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-control border border-line bg-field px-2 py-1 font-mono text-[12px]">{state.url}</code>
          <button type="button" className={rowActionClass()} onClick={() => navigator.clipboard?.writeText(state.url!)}>copiar</button>
        </div>
      )}
    </div>
  );
}

export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [state, action, pending] = useActionState(inviteUser, { ok: false });
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_160px]">
        <Field label="E-mail"><Input name="email" type="email" required /></Field>
        <Field label="Nome (opcional)"><Input name="name" /></Field>
        <Field label="Papel">
          <Select name="role" defaultValue="VIEWER">
            <option value="VIEWER">VIEWER</option><option value="MAINTAINER">MAINTAINER</option>
            {canInviteAdmin && <option value="ADMIN">ADMIN</option>}
          </Select>
        </Field>
      </div>
      <Button disabled={pending}>Gerar convite</Button>
      <LinkBox state={state} />
    </form>
  );
}

export function ResetLinkButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(passwordResetLink, { ok: false });
  return (
    <form action={action} className="space-y-1 text-left">
      <input type="hidden" name="userId" value={userId} />
      <RowActionButton disabled={pending}>Link de nova senha</RowActionButton>
      <LinkBox state={state} />
    </form>
  );
}
