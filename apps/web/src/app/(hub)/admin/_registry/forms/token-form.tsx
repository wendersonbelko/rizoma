"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ModalActions, useModal } from "@/components/form-modal";
import { Button, Field, Input, Notice, Select } from "@/components/ui";
import { createToken } from "../actions";
import { OptionalDetails } from "./optional-details";
import type { Opt } from "./types";
import { useRegistryForm } from "./use-registry-form";

type Errors = Partial<Record<"serviceId" | "name" | "days", string>>;

const DEFAULT_DAYS = 90;

function validate(form: FormData): Errors {
  const errors: Errors = {};
  if (!form.get("serviceId")) errors.serviceId = "Escolha um serviço.";
  if (String(form.get("name") ?? "").trim().length < 2) errors.name = "Dê um nome ao token, com pelo menos 2 caracteres.";
  const days = Number(form.get("days"));
  if (!Number.isInteger(days) || days < 1 || days > 365) errors.days = "Informe a validade em dias, de 1 a 365.";
  return errors;
}

/**
 * Novo token de CI. Achado M3 da auditoria de UX de 02/10/2026: o serviço começa vazio (gerar o token do
 * serviço errado é um erro silencioso, e o token só aparece uma vez). Só vem escolhido quando é o único
 * serviço da pessoa ou quando a tela veio com `?service=`. Gerado o token, o modal continua aberto com ele
 * à vista e o botão Copiar (padrão de modal que revela segredo).
 */
export function TokenForm({ services, startServiceId, docsHref }: {
  services: Opt[];
  /** Serviço que veio da página dele (?service=); só vale se a pessoa o mantém. */
  startServiceId?: string;
  docsHref: string;
}) {
  const { state, pending, submit, reject, clearError } = useRegistryForm(createToken);
  // Sem useCloseOnSuccess de propósito: depois de gerar, o modal fica aberto mostrando o token.
  const errors: Errors = state.ok ? {} : state.fieldErrors ?? {};
  const preselected = services.some((s) => s.id === startServiceId) ? startServiceId : services.length === 1 ? services[0]!.id : undefined;

  if (state.ok && state.token) return <TokenReveal token={state.token} />;

  if (services.length === 0) {
    return (
      <div className="space-y-4">
        <Notice tone="wait" title="Você ainda não mantém nenhum serviço">
          O token é de um serviço, e só dá para gerá-lo para os serviços dos seus times. Crie um serviço ou peça a quem administra para incluir você no time dele.
        </Notice>
        <ModalActions cancelLabel="Fechar">{null}</ModalActions>
      </div>
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found = validate(data);
    if (Object.keys(found).length) return reject(found);
    submit(data);
  }

  const showMessage = state.message && !state.ok && Object.values(errors).every((v) => !v);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <p className="text-sm text-muted">
        O pipeline de CI (GitHub Actions, GitLab CI…) usa o token para enviar a spec a cada deploy. Ele aparece uma única vez.{" "}
        <a href={docsHref} target="_blank" rel="noreferrer" className="text-accent underline">Como configurar o CI ↗</a>
      </p>

      <Field label="Serviço *" error={errors.serviceId}>
        <Select name="serviceId" placeholder="Escolha um serviço" defaultValue={preselected} required aria-invalid={!!errors.serviceId} onChange={() => clearError("serviceId")}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </Field>

      <Field label="Nome do token *" hint="Só para identificar onde ele é usado." error={errors.name}>
        <Input name="name" placeholder="github-actions" maxLength={60} autoComplete="off" aria-invalid={!!errors.name} onChange={() => clearError("name")} />
      </Field>

      <OptionalDetails summary={`validade: ${DEFAULT_DAYS} dias`}>
        <Field label="Validade (dias)" hint="Depois disso o CI recebe 401; gere outro token." error={errors.days}>
          <Input name="days" type="number" min={1} max={365} defaultValue={DEFAULT_DAYS} aria-invalid={!!errors.days} onChange={() => clearError("days")} />
        </Field>
      </OptionalDetails>

      <ModalActions message={showMessage ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending}>{pending ? "Gerando…" : "Gerar token"}</Button>
      </ModalActions>
    </form>
  );
}

/** O token recém-gerado: fica na tela até a pessoa fechar, com o botão Copiar e o aviso de que não reaparece. */
function TokenReveal({ token }: { token: string }) {
  const modal = useModal();
  const [copy, setCopy] = useState<"idle" | "done" | "failed">("idle");

  // Não há mais nada "digitado": fechar o modal não precisa perguntar se descarta.
  useEffect(() => {
    modal?.markClean();
  }, [modal]);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopy("done");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="wait" title="Token criado. Copie agora: ele não aparece de novo.">
        Guarde-o como segredo do repositório do serviço (por exemplo, nos secrets do GitHub Actions). Se perder, revogue este token e gere outro.
      </Notice>
      <pre className="select-all overflow-x-auto rounded-control border border-wait bg-field p-3 font-mono text-sm">{token}</pre>
      <ModalActions
        cancelLabel="Fechar"
        message={copy === "done" ? <span className="text-accent">Token copiado.</span> : copy === "failed" ? <span className="text-danger">Não consegui copiar. Selecione o texto e copie à mão.</span> : undefined}
      >
        <Button type="button" onClick={copyToken}>Copiar token</Button>
      </ModalActions>
    </div>
  );
}
