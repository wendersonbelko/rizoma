"use client";

import { useActionState, useState } from "react";
import { RELATIONS_BY_KIND, RESOURCE_KIND_LABEL, RESOURCE_RELATION_LABEL, type ResourceKind } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { useCloseOnSuccess } from "@/components/form-modal";
import { linkResource } from "../actions";
import { Feedback, initialResult } from "./feedback";

/** Liga uma integração externa já cadastrada a este serviço. */
export function ResourceLinkForm({ serviceId, resources }: { serviceId: string; resources: { id: string; name: string; kind: ResourceKind }[] }) {
  const [state, action, pending] = useActionState(linkResource, initialResult);
  useCloseOnSuccess(state, pending);
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "");
  const kind = resources.find((r) => r.id === resourceId)?.kind ?? "OTHER";
  const grouped = Object.entries(RESOURCE_KIND_LABEL).map(([k, label]) => ({ k, label, items: resources.filter((r) => r.kind === k) })).filter((g) => g.items.length);
  if (!resources.length) return <p className="text-sm text-muted">Nenhuma integração cadastrada ainda. Cadastre em <a className="text-accent" href="/integrations">Integrações externas</a>.</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Integração">
          <Select name="resourceId" value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
            {grouped.map((g) => <optgroup key={g.k} label={g.label}>{g.items.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>)}
          </Select>
        </Field>
        <Field label="Este serviço…">
          <Select name="relation">{RELATIONS_BY_KIND[kind].map((r) => <option key={r} value={r}>{RESOURCE_RELATION_LABEL[r]}</option>)}</Select>
        </Field>
      </div>
      <Field label="Observação (Markdown)"><Input name="note" placeholder="Ex.: publica `pedido.criado` depois do pagamento aprovado" /></Field>
      <div className="flex items-center gap-4"><Button disabled={pending}>Ligar integração</Button><Feedback state={state} /></div>
    </form>
  );
}
