"use client";

import { useActionState, useState } from "react";
import { RELATIONS_BY_KIND, RESOURCE_KIND_LABEL, RESOURCE_RELATION_LABEL, type ResourceKind } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { linkResource } from "../actions";
import { feedbackMessage, initialResult } from "./feedback";
import { OptionalDetails } from "./optional-details";

/** Liga uma integração externa já cadastrada a este serviço. */
export function ResourceLinkForm({ serviceId, resources }: { serviceId: string; resources: { id: string; name: string; kind: ResourceKind }[] }) {
  const [state, action, pending] = useActionState(linkResource, initialResult);
  useCloseOnSuccess(state, pending);
  // Achado M3 da auditoria de UX de 02/10/2026: nada vem escolhido, a não ser que só exista uma opção.
  const [resourceId, setResourceId] = useState(resources.length === 1 ? resources[0]!.id : "");
  const [relation, setRelation] = useState("");
  const kind = resources.find((r) => r.id === resourceId)?.kind;
  const relations = kind ? RELATIONS_BY_KIND[kind] : [];
  const grouped = Object.entries(RESOURCE_KIND_LABEL).map(([k, label]) => ({ k, label, items: resources.filter((r) => r.kind === k) })).filter((g) => g.items.length);
  if (!resources.length) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Nenhuma integração externa cadastrada ainda. Cadastre uma em <a className="text-accent" href="/integrations">Integrações externas</a> e volte aqui para ligar.</p>
        <ModalActions cancelLabel="Fechar"><span /></ModalActions>
      </div>
    );
  }
  // A relação só existe para o tipo da integração escolhida; trocar a integração recomeça a escolha.
  const effectiveRelation = relations.length === 1 ? relations[0]! : relations.some((r) => r === relation) ? relation : "";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <Field label="Integração *">
        <Select name="resourceId" placeholder="Escolha uma integração" required value={resourceId} onChange={(e) => { setResourceId(e.target.value); setRelation(""); }}>
          {grouped.map((g) => <optgroup key={g.k} label={g.label}>{g.items.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>)}
        </Select>
      </Field>
      <Field label="Este serviço… *">
        <Select name="relation" placeholder={kind ? "Escolha a relação" : "Escolha a integração primeiro"} required disabled={!kind} value={effectiveRelation} onChange={(e) => setRelation(e.target.value)}>
          {relations.map((r) => <option key={r} value={r}>{RESOURCE_RELATION_LABEL[r]}</option>)}
        </Select>
      </Field>
      <OptionalDetails summary="observação">
        <Field label="Observação (Markdown)"><Input name="note" placeholder="Ex.: publica `pedido.criado` depois do pagamento aprovado" /></Field>
      </OptionalDetails>
      <ModalActions message={feedbackMessage(state)}>
        <Button disabled={pending}>{pending ? "Ligando…" : "Ligar integração"}</Button>
      </ModalActions>
    </form>
  );
}
