"use client";

import { useActionState } from "react";
import { CHANNEL_PROTOCOLS, CHANNEL_PROTOCOL_LABEL } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { useCloseOnSuccess } from "@/components/form-modal";
import { addChannel, type Result } from "../actions";
import { Feedback, initialResult } from "../forms/feedback";

export function ChannelForm({ serviceId, envs }: { serviceId: string; envs: { id: string; slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<Result, FormData>(addChannel, initialResult);
  useCloseOnSuccess(state, pending);
  return (
    <form action={action} className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
      <input type="hidden" name="serviceId" value={serviceId} />
      <Field label="Protocolo">
        <Select name="protocol" defaultValue="HTTP">{CHANNEL_PROTOCOLS.map((p) => <option key={p} value={p}>{CHANNEL_PROTOCOL_LABEL[p]}</option>)}</Select>
      </Field>
      <Field label="Nome">
        <Input name="name" required placeholder="API pública" />
      </Field>
      <Field label="Ambiente do endereço">
        <Select name="environmentId" defaultValue={envs[0]?.id ?? ""}>
          <option value="">Sem endereço</option>
          {envs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </Field>
      <Field label="Endereço" hint="Sem usuário nem senha.">
        <Input name="address" placeholder="https://pedidos.exemplo" />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending ? "Adicionando…" : "Adicionar canal"}</Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
