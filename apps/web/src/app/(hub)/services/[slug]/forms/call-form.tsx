"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { addCall, type Result } from "../actions";
import { feedbackMessage, initialResult } from "./feedback";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

/** Registra que este serviço chama um endpoint de outro (aparece nas abas da API dos dois). */
export function CallForm({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState<Result, FormData>(addCall, initialResult);
  useCloseOnSuccess(state, pending);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <Field label="Serviço chamado *" hint="O endereço do serviço no hub, como em /services/pedidos.">
        <Input name="toSlug" required placeholder="pedidos" autoComplete="off" spellCheck={false} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <Field label="Método *">
          <Select name="method" placeholder="Escolha" required>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</Select>
        </Field>
        <Field label="Caminho *">
          <Input name="path" required placeholder="/pedidos" autoComplete="off" spellCheck={false} />
        </Field>
      </div>
      <ModalActions message={feedbackMessage(state)}>
        <Button disabled={pending}>{pending ? "Registrando…" : "Registrar chamada"}</Button>
      </ModalActions>
    </form>
  );
}
