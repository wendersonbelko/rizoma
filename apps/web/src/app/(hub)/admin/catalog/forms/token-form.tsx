"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { createToken } from "../actions";
import { Feedback, initialResult, type Opt } from "./feedback";

export function TokenForm({ services }: { services: Opt[] }) {
  const [state, action, pending] = useActionState(createToken, initialResult);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Serviço"><Select name="serviceId">{services.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select></Field>
        <Field label="Nome" hint="Só para identificar onde o token é usado."><Input name="name" placeholder="github-actions" required /></Field>
        <Field label="Validade (dias)" hint="Depois disso o CI recebe 401; gere outro."><Input name="days" type="number" min={1} max={365} defaultValue={90} /></Field>
      </div>
      <Button disabled={pending}>Gerar token</Button>
      {state.token && <pre className="overflow-x-auto rounded-control border border-wait bg-field p-3 font-mono text-sm">{state.token}</pre>}
      <Feedback state={state} />
    </form>
  );
}
