"use client";

import { useActionState, useState } from "react";
import { CHANNEL_PROTOCOLS, CHANNEL_PROTOCOL_LABEL, LINK_KINDS, LINK_KIND_LABEL, SERVICE_REPO_ROLES, SERVICE_REPO_ROLE_LABEL } from "@api-hub/core/types";
import { Field, Input, Select, Button } from "@/components/ui";
import { useCloseOnSuccess } from "@/components/form-modal";
import { createLink } from "../actions";
import { Feedback, initialResult, type Opt } from "./feedback";

type LinkType = "service" | "repository" | "service-repository";

/** "De" só lista serviços que a pessoa mantém; "Para" pode ser qualquer serviço ativo (RN-22). */
export function LinkForm({ services, targets, repositories, start }: {
  services: Opt[]; targets: Opt[]; repositories: Opt[];
  /** Ponto de partida vindo do mapa: o último item selecionado, quando é serviço ou repositório. */
  start?: { kind: "service" | "repository"; id: string };
}) {
  const startFits = !!start && (start.kind === "repository" ? repositories : services).some((o) => o.id === start.id);
  const [type, setType] = useState<LinkType>(startFits && start?.kind === "repository" ? "repository" : "service");
  const [state, action, pending] = useActionState(createLink, initialResult);
  useCloseOnSuccess(state, pending);
  const from = type === "repository" ? repositories : services;
  const to = type === "service" ? targets : repositories;
  const fromDefault = startFits && start && ((type === "service" && start.kind === "service") || (type === "repository" && start.kind === "repository")) ? start.id : undefined;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <div className="flex flex-wrap gap-4 text-sm">
        {([["service", "Serviço → serviço"], ["repository", "Repositório → repositório"], ["service-repository", "Serviço → repositório"]] as const).map(([v, l]) => (
          <label key={v} className="flex items-center gap-2"><input type="radio" checked={type === v} onChange={() => setType(v)} />{l}</label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="De">
          <Select key={type} name={type === "service-repository" ? "serviceId" : "fromId"} required defaultValue={fromDefault}>
            {from.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </Field>
        {type === "service-repository" ? (
          <Field label="Papel do repositório" hint="O que esse repositório é para o serviço.">
            <Select name="role">{SERVICE_REPO_ROLES.map((r) => <option key={r} value={r}>{SERVICE_REPO_ROLE_LABEL[r]}</option>)}</Select>
          </Field>
        ) : (
          <Field label="Tipo de ligação" hint="Como o dado flui: consome, publica em, depende de…">
            <Select name="kind">{LINK_KINDS.map((k) => <option key={k} value={k}>{LINK_KIND_LABEL[k]}</option>)}</Select>
          </Field>
        )}
        <Field label="Para">
          <Select name={type === "service-repository" ? "repositoryId" : "toId"} required>{to.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</Select>
        </Field>
      </div>
      {type === "service" && (
        <Field label="Protocolo" hint="Opcional. A aresta do mapa mostra HTTP, gRPC ou WebSocket.">
          <Select name="protocol" defaultValue="">
            <option value="">Não informado</option>
            {CHANNEL_PROTOCOLS.map((p) => <option key={p} value={p}>{CHANNEL_PROTOCOL_LABEL[p]}</option>)}
          </Select>
        </Field>
      )}
      {type !== "service-repository" && <Field label="Observação"><Input name="note" placeholder="Ex.: consulta estoque no checkout" /></Field>}
      <div className="flex items-center gap-4"><Button disabled={pending}>Criar vínculo</Button><Feedback state={state} /></div>
    </form>
  );
}
