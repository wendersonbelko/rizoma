"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useCloseOnSuccess } from "@/components/form-modal";
import { addCall, type Result } from "../actions";
import { Feedback, initialResult } from "./feedback";

export function CallForm({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState<Result, FormData>(addCall, initialResult);
  useCloseOnSuccess(state, pending);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      <Field label="Serviço (slug)"><Input name="toSlug" required placeholder="pedidos" /></Field>
      <Field label="Método"><Input name="method" required placeholder="GET" /></Field>
      <Field label="Path"><Input name="path" required placeholder="/pedidos" /></Field>
      <div className="flex items-center gap-4 sm:col-span-3">
        <Button disabled={pending}>Registrar chamada</Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
