"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createServiceSchema } from "@api-hub/core/schemas";
import { SERVICE_KINDS, SERVICE_KIND_LABEL } from "@api-hub/core/types";
import { ChipInput } from "@/components/chip-input";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { NameSlugFields } from "@/components/name-slug-fields";
import { Button, Field, Notice, Select, Textarea } from "@/components/ui";
import { createService } from "../actions";
import { OptionalDetails } from "./optional-details";
import { SegmentedField } from "./segmented-field";
import type { Opt } from "./types";
import { useRegistryForm } from "./use-registry-form";

type Errors = Partial<Record<"name" | "slug" | "ownerTeamId", string>>;

const nameAndSlug = createServiceSchema.pick({ name: true, slug: true });

/** Espelha no navegador o que createService confere: a pessoa vê o erro no campo, sem esperar o servidor. */
function validate(form: FormData, hasTeams: boolean): Errors {
  const errors: Errors = {};
  const parsed = nameAndSlug.safeParse({ name: form.get("name"), slug: form.get("slug") });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "name" || field === "slug") && !errors[field]) errors[field] = issue.message;
    }
  }
  if (hasTeams && !form.get("ownerTeamId")) errors.ownerTeamId = "Escolha o time responsável pelo serviço.";
  return errors;
}

/**
 * Novo serviço em um passo só (achado M2 da auditoria de UX de 02/10/2026): nome, time e tipo. Descrição,
 * tags e visibilidade ficam em "Detalhes opcionais". Repositório, spec e token vêm depois, pela checklist
 * da página do serviço, para quem tem a informação. Criado o serviço, a pessoa vai para a página dele.
 */
export function ServiceForm({ teams, requireTeam }: {
  teams: Opt[];
  /** true quando a pessoa não tem service:edit_any (RN-22): só cria para um time dela. */
  requireTeam: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { state, pending, submit, reject, clearError } = useRegistryForm(createService);
  useCloseOnSuccess(state, pending);

  useEffect(() => {
    if (state.ok && state.slug) router.push(`/services/${state.slug}`);
  }, [state.ok, state.slug, router]);

  // Os erros (do navegador e do servidor) vêm do mesmo lugar e somem quando a pessoa mexe no campo.
  const errors: Errors = state.ok ? {} : state.fieldErrors ?? {};

  const noTeams = teams.length === 0;
  const blockedWithoutTeam = noTeams && requireTeam;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found = validate(data, !noTeams);
    const first = (["name", "slug", "ownerTeamId"] as const).find((f) => found[f]);
    if (first) {
      reject(found);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]:not([type="hidden"])`)?.focus());
      return;
    }
    submit(data);
  }

  const showMessage = state.message && !state.ok && Object.values(errors).every((v) => !v);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      <NameSlugFields
        nameLabel="Nome do serviço"
        namePlaceholder="Ex.: Pagamentos API"
        nameRequired
        slugPrefix="/services/"
        errors={{ name: errors.name, slug: errors.slug }}
        onEdit={clearError}
      />

      {noTeams ? (
        blockedWithoutTeam ? (
          <Notice tone="wait" title="Você ainda não participa de nenhum time">
            Um serviço precisa de um time responsável, e só dá para criá-lo para um time seu. Peça a quem administra para adicionar você a um time.
          </Notice>
        ) : (
          <p className="text-sm text-muted">Ainda não há times cadastrados, então o serviço será criado sem time responsável. Dá para definir um depois, na edição do serviço.</p>
        )
      ) : (
        <Field label="Time responsável *" error={errors.ownerTeamId} hint="Quem não é do time responsável não consegue gerenciar o serviço.">
          <Select
            name="ownerTeamId"
            placeholder="Escolha um time"
            // Achado M3: só vem escolhido quando não há o que escolher (um único time).
            defaultValue={teams.length === 1 ? teams[0]!.id : undefined}
            required
            aria-invalid={!!errors.ownerTeamId}
            onChange={() => clearError("ownerTeamId")}
          >
            {teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </Select>
        </Field>
      )}

      <SegmentedField
        legend="Tipo"
        name="kind"
        defaultValue="API"
        options={SERVICE_KINDS.map((k) => ({ value: k, label: SERVICE_KIND_LABEL[k] }))}
        hint="API publica contrato HTTP. Frontend e worker entram no mapa pelos vínculos."
      />

      <OptionalDetails summary="descrição, tags, visibilidade">
        <Field label="Descrição" hint="Uma ou duas frases sobre o que o serviço faz.">
          <Textarea name="description" rows={3} maxLength={500} />
        </Field>
        <Field label="Tags" hint="Digite uma tag e clique em +. Até 10.">
          <ChipInput name="tags" max={10} normalize={(v) => v.toLowerCase().slice(0, 30)} placeholder="checkout" addLabel="Adicionar tag" />
        </Field>
        <Field label="Quem pode ver" hint="“Só o time responsável” esconde o serviço do catálogo e do mapa para quem está fora dele.">
          <Select name="visibility" defaultValue="ORG">
            <option value="ORG">Toda a empresa</option>
            <option value="TEAM">Só o time responsável</option>
          </Select>
        </Field>
      </OptionalDetails>

      <ModalActions message={showMessage ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending || blockedWithoutTeam}>{pending ? "Criando…" : "Criar serviço"}</Button>
      </ModalActions>
    </form>
  );
}
