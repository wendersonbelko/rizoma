"use client";

import { useActionState } from "react";
import { Button, Field, Select } from "@/components/ui";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { copyEnvVars } from "../actions";
import { feedbackMessage, initialResult } from "./feedback";

/** Copia as variáveis (sem segredos) de outro ambiente para o atual. */
export function CopyEnvForm({ serviceId, envs, toEnvId, toName }: { serviceId: string; envs: { id: string; name: string }[]; toEnvId: string; toName: string }) {
  const [state, action, pending] = useActionState(copyEnvVars, initialResult);
  useCloseOnSuccess(state, pending);
  const others = envs.filter((e) => e.id !== toEnvId);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="toEnvId" value={toEnvId} />
      <Field label="Copiar de qual ambiente? *" hint={`As chaves chegam em ${toName}. As que já existem aqui não são alteradas e os segredos chegam vazios.`}>
        {/* Só pré-escolhe quando há um único ambiente de origem possível (achado M3). */}
        <Select name="fromEnvId" placeholder="Escolha o ambiente" required defaultValue={others.length === 1 ? others[0]?.id : undefined}>
          {others.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </Field>
      <ModalActions message={feedbackMessage(state)}>
        <Button disabled={pending}>{pending ? "Copiando…" : "Copiar variáveis"}</Button>
      </ModalActions>
    </form>
  );
}
