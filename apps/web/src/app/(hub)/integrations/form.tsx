"use client";

import { useActionState, useRef, useState } from "react";
import { RESOURCE_KIND_LABEL } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { NameSlugFields } from "@/components/name-slug-fields";
import { FormSteps } from "@/components/form-steps";
import { useCloseOnSuccess } from "@/components/form-modal";
import { createResource, updateResource, type Result } from "./actions";

type Env = { id: string; name: string; slug: string };
type Resource = { id: string; slug: string; name: string; kind: string; provider: string | null; description: string | null; docsUrl: string | null; endpoints: { environmentId: string; value: string }[] };

const STEPS = ["Identificação", "Detalhes", "Endereços"] as const;

/** Cadastro em três passos para o modal mostrar cada campo sem barra de rolagem. Os campos ficam no formulário o tempo todo. */
export function ResourceForm({ envs, resource }: { envs: Env[]; resource?: Resource }) {
  const [state, action, pending] = useActionState<Result, FormData>(resource ? updateResource : createResource, { ok: false });
  useCloseOnSuccess(state, pending);
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");

  function advance() {
    const data = new FormData(formRef.current ?? undefined);
    if (step === 0 && (!String(data.get("name") ?? "").trim() || !String(data.get("slug") ?? "").trim())) {
      setStepError("Preencha o nome e o identificador.");
      return;
    }
    setStepError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <FormSteps labels={STEPS} current={step} />

      <div className={step === 0 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
        <NameSlugFields
          nameLabel="Nome"
          slugLabel="Identificador"
          defaultName={resource?.name}
          defaultSlug={resource?.slug}
          slugHint="Aparece na URL: {/integrations/{slug}}."
        />
        <Field label="Tipo" hint="API HTTP, fila, tópico, webhook, banco…">
          <Select name="kind" defaultValue={resource?.kind ?? "HTTP_API"}>
            {Object.entries(RESOURCE_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Provedor / tecnologia"><Input name="provider" defaultValue={resource?.provider ?? ""} placeholder="AWS SQS, Kafka, Stripe, PostgreSQL…" /></Field>
      </div>

      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <Field label="Documentação oficial (URL)"><Input name="docsUrl" type="url" defaultValue={resource?.docsUrl ?? ""} placeholder="https://" /></Field>
        <Field label="Descrição (Markdown)" hint="Contrato, formato das mensagens, limites, quem é o contato…">
          <textarea name="description" rows={4} defaultValue={resource?.description ?? ""} className="w-full rounded-control border border-line bg-field p-3 font-mono text-[13px]" />
        </Field>
      </div>

      <fieldset className={step === 2 ? "space-y-3" : "hidden"}>
        <legend className="mb-1 text-sm font-semibold">Endereço em cada ambiente</legend>
        <p className="text-sm text-muted">URL, nome da fila ou do tópico, ARN, host. Não coloque senhas aqui: use as variáveis de ambiente do serviço.</p>
        {envs.map((e) => (
          <Field key={e.id} label={e.name}>
            <Input name={`endpoint:${e.id}`} defaultValue={resource?.endpoints.find((x) => x.environmentId === e.id)?.value ?? ""} />
          </Field>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        {step > 0 && <Button type="button" tone="quiet" onClick={() => { setStepError(""); setStep((current) => current - 1); }}>Voltar</Button>}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={advance}>Avançar</Button>
        ) : (
          <Button disabled={pending}>{resource ? "Salvar integração" : "Cadastrar integração"}</Button>
        )}
        {stepError && <p role="alert" className="text-sm text-danger">{stepError}</p>}
        {state.message && <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
