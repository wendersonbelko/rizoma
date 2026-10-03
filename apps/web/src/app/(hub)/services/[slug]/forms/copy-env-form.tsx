"use client";

import { useActionState } from "react";
import { Button, Field, Select } from "@/components/ui";
import { useCloseOnSuccess } from "@/components/form-modal";
import { copyEnvVars } from "../actions";
import { Feedback, initialResult } from "./feedback";

/** Copia as variáveis (sem segredos) de outro ambiente para o atual. */
export function CopyEnvForm({ serviceId, envs, toEnvId }: { serviceId: string; envs: { id: string; name: string }[]; toEnvId: string }) {
  const [state, action, pending] = useActionState(copyEnvVars, initialResult);
  useCloseOnSuccess(state, pending);
  return (
    <form action={action} className="space-y-3 text-sm">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="toEnvId" value={toEnvId} />
      <Field label="Copiar chaves de outro ambiente" hint="Chaves que já existem aqui não são alteradas. Segredos chegam vazios.">
        <Select name="fromEnvId">{envs.filter((e) => e.id !== toEnvId).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select>
      </Field>
      <Button tone="quiet" disabled={pending}>Copiar</Button>
      <Feedback state={state} />
    </form>
  );
}
