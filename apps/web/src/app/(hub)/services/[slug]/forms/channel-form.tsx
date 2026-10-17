"use client";

import { useActionState } from "react";
import { CHANNEL_PROTOCOLS, CHANNEL_PROTOCOL_LABEL } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { addChannel, type Result } from "../actions";
import { feedbackMessage, initialResult } from "./feedback";
import { OptionalDetails } from "./optional-details";

/** Canal extra que o serviço oferece (HTTP, gRPC ou WebSocket), com endereço opcional por ambiente. */
export function ChannelForm({ serviceId, envs }: { serviceId: string; envs: { id: string; slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<Result, FormData>(addChannel, initialResult);
  useCloseOnSuccess(state, pending);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <Field label="Protocolo *">
          <Select name="protocol" placeholder="Escolha o protocolo" required>
            {CHANNEL_PROTOCOLS.map((p) => <option key={p} value={p}>{CHANNEL_PROTOCOL_LABEL[p]}</option>)}
          </Select>
        </Field>
        <Field label="Nome *">
          <Input name="name" required placeholder="API pública" />
        </Field>
      </div>
      <OptionalDetails summary="endereço em um ambiente">
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <Field label="Ambiente do endereço">
            <Select name="environmentId" defaultValue="">
              <option value="">Sem endereço</option>
              {envs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
          <Field label="Endereço" hint="Sem usuário nem senha.">
            <Input name="address" placeholder="https://pedidos.exemplo" />
          </Field>
        </div>
      </OptionalDetails>
      <ModalActions message={feedbackMessage(state)}>
        <Button disabled={pending}>{pending ? "Adicionando…" : "Adicionar canal"}</Button>
      </ModalActions>
    </form>
  );
}
