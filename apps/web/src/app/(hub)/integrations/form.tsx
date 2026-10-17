"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { RESOURCE_KIND_LABEL } from "@api-hub/core/types";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { NameSlugFields } from "@/components/name-slug-fields";
import { FormSteps } from "@/components/form-steps";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { createResource, updateResource, type FieldErrors, type Result } from "./actions";

type Env = { id: string; name: string; slug: string };
type Resource = { id: string; slug: string; name: string; kind: string; provider: string | null; description: string | null; docsUrl: string | null; endpoints: { environmentId: string; value: string }[] };

// Achado M1 / p. 14 da auditoria de UX de 02/10/2026: wizard de no máximo 3 passos, com verbo. Aqui são
// dois: só o nome e o tipo são obrigatórios; endereços e detalhes são opcionais. Os campos ficam no
// formulário o tempo todo (só o painel muda), então nada digitado se perde ao voltar.
const STEPS = ["Identificar", "Endereçar"] as const;
const LAST_STEP = STEPS.length - 1;

/**
 * Cadastro (em passos) e edição (tudo numa tela só: ali as etapas não dependem uma da outra) de uma
 * integração externa. O <form> vive neste componente filho para `useCloseOnSuccess` enxergar o modal.
 */
export function ResourceForm({ envs, resource }: { envs: Env[]; resource?: Resource }) {
  const wizard = !resource;
  const [state, action, pending] = useActionState<Result, FormData>(resource ? updateResource : createResource, { ok: false });
  useCloseOnSuccess(state, pending);
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<FieldErrors>({});

  // Erro do servidor em nome, endereço ou tipo: esses campos estão no 1º passo, então a pessoa volta para ele.
  useEffect(() => {
    if (state.fieldErrors) setStep(0);
  }, [state]);

  const errors: FieldErrors = { ...state.fieldErrors, ...stepErrors };

  function advance() {
    const data = new FormData(formRef.current ?? undefined);
    const found: FieldErrors = {};
    if (!String(data.get("name") ?? "").trim()) found.name = "Informe o nome da integração.";
    if (!data.get("kind")) found.kind = "Escolha o tipo da integração.";
    setStepErrors(found);
    if (Object.keys(found).length === 0) setStep(LAST_STEP);
  }

  const showStep = (n: number) => !wizard || step === n;

  return (
    <form
      ref={formRef}
      action={action}
      // A validação é do servidor (mensagem junto do campo): a nativa tentaria focar um campo do passo escondido.
      noValidate
      className="space-y-4"
      // Enter num campo do 1º passo avança em vez de não fazer nada (não há botão de envio ali).
      onKeyDown={(e) => {
        if (wizard && step === 0 && e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          advance();
        }
      }}
    >
      {resource && <input type="hidden" name="id" value={resource.id} />}
      {wizard && <FormSteps labels={STEPS} current={step} />}

      <div className={showStep(0) ? "space-y-4" : "hidden"}>
        <NameSlugFields
          nameLabel="Nome da integração"
          nameRequired
          namePlaceholder="Ex.: Stripe, fila pedido.criado"
          slugPrefix="/integrations/"
          defaultName={resource?.name}
          defaultSlug={resource?.slug}
          errors={{ name: errors.name, slug: errors.slug }}
        />
        <Field label="Tipo *" hint="API externa, fila, tópico, webhook, banco…" error={errors.kind}>
          <Select name="kind" placeholder="Escolha o tipo" defaultValue={resource?.kind} aria-invalid={!!errors.kind}>
            {Object.entries(RESOURCE_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Provedor ou tecnologia" error={errors.provider}>
          <Input name="provider" defaultValue={resource?.provider ?? ""} placeholder="AWS SQS, Kafka, Stripe, PostgreSQL…" />
        </Field>
        <details open={Boolean(resource?.docsUrl || resource?.description || errors.docsUrl || errors.description)} className="rounded-control border border-line px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold">
            Detalhes opcionais <span className="font-normal text-muted">documentação e descrição</span>
          </summary>
          <div className="mt-3 space-y-4">
            <Field label="Documentação oficial (URL)" error={errors.docsUrl}>
              <Input name="docsUrl" type="url" defaultValue={resource?.docsUrl ?? ""} placeholder="https://" />
            </Field>
            <Field label="Descrição (Markdown)" error={errors.description} hint="Contrato, formato das mensagens, limites, quem é o contato…">
              <Textarea name="description" rows={4} defaultValue={resource?.description ?? ""} className="font-mono text-[13px]" />
            </Field>
          </div>
        </details>
      </div>

      <fieldset className={showStep(1) ? "space-y-3" : "hidden"}>
        <legend className="mb-1 text-sm font-semibold">Endereço em cada ambiente</legend>
        <p className="text-sm text-muted">URL, nome da fila ou do tópico, ARN, host. Pode deixar em branco e preencher depois. Não coloque senhas aqui: use as variáveis de ambiente do serviço.</p>
        {envs.map((e) => (
          <Field key={e.id} label={e.name}>
            <Input name={`endpoint:${e.id}`} defaultValue={resource?.endpoints.find((x) => x.environmentId === e.id)?.value ?? ""} />
          </Field>
        ))}
      </fieldset>

      <ModalActions message={state.message && !state.ok ? <span className="text-danger">{state.message}</span> : undefined}>
        {wizard && step > 0 && <Button key="back" type="button" tone="quiet" onClick={() => setStep(0)}>Voltar</Button>}
        {wizard && step < LAST_STEP ? (
          // key diferente: o mesmo botão não pode virar "submit" no meio do clique que avançou o passo.
          <Button key="next" type="button" onClick={advance}>Continuar</Button>
        ) : (
          <Button key="submit" disabled={pending}>{resource ? "Salvar integração" : "Criar integração"}</Button>
        )}
      </ModalActions>
    </form>
  );
}
