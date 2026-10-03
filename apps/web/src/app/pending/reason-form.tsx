"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { saveReason, type ReasonResult } from "./actions";

export function ReasonForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState<ReasonResult, FormData>(saveReason, { ok: false });
  return (
    <form action={action} className="mb-8 space-y-3">
      <Field label="Quem é você e por que precisa de acesso?" hint="Ex.: consultoria X, integração com o serviço de pedidos, até dezembro.">
        <textarea
          name="reason"
          defaultValue={current ?? ""}
          rows={4}
          maxLength={500}
          className="w-full rounded-control border border-line bg-field px-3 py-2 text-[15px] focus:border-accent"
        />
      </Field>
      <div className="flex items-center gap-4">
        <Button tone="quiet" disabled={pending}>{current ? "Atualizar justificativa" : "Enviar justificativa"}</Button>
        {state.message && <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
