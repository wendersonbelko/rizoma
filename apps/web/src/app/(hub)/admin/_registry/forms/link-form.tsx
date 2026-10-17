"use client";

import { useState, type FormEvent } from "react";
import { CHANNEL_PROTOCOLS, CHANNEL_PROTOCOL_LABEL, LINK_KINDS, LINK_KIND_LABEL, SERVICE_REPO_ROLES, SERVICE_REPO_ROLE_LABEL } from "@api-hub/core/types";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { Button, Field, Input, Select } from "@/components/ui";
import { createLink } from "../actions";
import { OptionalDetails } from "./optional-details";
import { SegmentedField } from "./segmented-field";
import type { Opt } from "./types";
import { useRegistryForm } from "./use-registry-form";

type LinkType = "service" | "repository" | "service-repository";

const TYPES: readonly { value: LinkType; label: string }[] = [
  { value: "service", label: "Serviço → serviço" },
  { value: "repository", label: "Repositório → repositório" },
  { value: "service-repository", label: "Serviço → repositório" },
];

/**
 * Novo vínculo. Achado M3 da auditoria de UX de 02/10/2026: "De" e "Para" começam vazios (menos o "De" que
 * vem do mapa ou de outra tela), "Para" nunca oferece o mesmo item do "De", e o botão só habilita quando
 * os dois estão escolhidos. "De" só lista serviços que a pessoa mantém; "Para" pode ser qualquer serviço ativo (RN-22).
 */
export function LinkForm({ services, targets, repositories, start }: {
  services: Opt[];
  targets: Opt[];
  repositories: Opt[];
  /** Ponto de partida vindo do mapa ou da página do serviço (?from=&fromKind=): vira o "De" quando a pessoa pode usá-lo. */
  start?: { kind: "service" | "repository"; id: string };
}) {
  const fromOptions = (t: LinkType) => (t === "repository" ? repositories : services);
  const toOptions = (t: LinkType) => (t === "service" ? targets : repositories);
  const startFor = (t: LinkType) => (start && fromOptions(t).some((o) => o.id === start.id) && (t === "repository") === (start.kind === "repository") ? start.id : "");

  const initialType: LinkType = startFor("repository") ? "repository" : "service";
  const [type, setType] = useState<LinkType>(initialType);
  const [fromId, setFromId] = useState(() => startFor(initialType));
  const [toId, setToId] = useState("");
  const { state, pending, submit, clearError } = useRegistryForm(createLink);
  useCloseOnSuccess(state, pending);
  const errors = state.ok ? {} : state.fieldErrors ?? {};

  const sameSpace = type !== "service-repository"; // De e Para são do mesmo tipo de item: não pode ser o mesmo
  const valid = fromId !== "" && toId !== "" && !(sameSpace && fromId === toId);
  const isServiceRepo = type === "service-repository";
  const fromName = isServiceRepo ? "serviceId" : "fromId";
  const toName = isServiceRepo ? "repositoryId" : "toId";

  function changeType(next: LinkType) {
    setType(next);
    setFromId(startFor(next));
    setToId("");
  }

  function changeFrom(id: string) {
    setFromId(id);
    // "Para" não pode ser o mesmo item: se a pessoa trocou o "De" para o que estava em "Para", o "Para" volta a vazio.
    if (sameSpace && id === toId) setToId("");
    clearError(fromName);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    submit(new FormData(e.currentTarget));
  }

  const hint = !valid ? "Escolha o item de origem (De) e o de destino (Para)." : undefined;
  const serverMessage = state.message && !state.ok && Object.values(errors).every((v) => !v) ? state.message : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <SegmentedField legend="O que ligar" name="type" value={type} onChange={changeType} options={TYPES} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="De *" error={errors[fromName]} hint={type !== "repository" ? "Só aparecem os serviços que você mantém." : undefined}>
          <Select name={fromName} placeholder={type === "repository" ? "Escolha um repositório" : "Escolha um serviço"} value={fromId} onChange={(e) => changeFrom(e.target.value)} aria-invalid={!!errors[fromName]}>
            {fromOptions(type).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Para *" error={errors[toName]}>
          <Select
            name={toName}
            placeholder={type === "service" ? "Escolha um serviço" : "Escolha um repositório"}
            value={toId}
            onChange={(e) => { setToId(e.target.value); clearError(toName); }}
            aria-invalid={!!errors[toName]}
          >
            {toOptions(type).filter((o) => !(sameSpace && o.id === fromId)).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </Field>
      </div>

      {isServiceRepo ? (
        <Field key="role" label="Papel do repositório *" hint="O que esse repositório é para o serviço.">
          <Select name="role" defaultValue="SOURCE">{SERVICE_REPO_ROLES.map((r) => <option key={r} value={r}>{SERVICE_REPO_ROLE_LABEL[r]}</option>)}</Select>
        </Field>
      ) : (
        <Field key="kind" label="Tipo de vínculo *" hint="Como o dado flui: consome, publica em, depende de…">
          <Select name="kind" defaultValue="CONSUMES">{LINK_KINDS.map((k) => <option key={k} value={k}>{LINK_KIND_LABEL[k]}</option>)}</Select>
        </Field>
      )}

      {!isServiceRepo && (
        <OptionalDetails summary={type === "service" ? "protocolo, observação" : "observação"}>
          {type === "service" && (
            <Field label="Protocolo" hint="A linha do mapa mostra HTTP, gRPC ou WebSocket.">
              <Select name="protocol" defaultValue="">
                <option value="">Não informado</option>
                {CHANNEL_PROTOCOLS.map((p) => <option key={p} value={p}>{CHANNEL_PROTOCOL_LABEL[p]}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Observação"><Input name="note" maxLength={300} placeholder="Ex.: consulta estoque no checkout" /></Field>
        </OptionalDetails>
      )}

      <ModalActions message={serverMessage ? <span className="text-danger">{serverMessage}</span> : hint ? <span className="text-muted">{hint}</span> : undefined}>
        <Button disabled={!valid || pending}>{pending ? "Criando…" : "Criar vínculo"}</Button>
      </ModalActions>
    </form>
  );
}
