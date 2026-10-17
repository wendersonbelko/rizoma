"use client";

import { SERVICE_KIND_LABEL, SERVICE_KINDS } from "@api-hub/core/types";
import { ChipInput } from "@/components/chip-input";
import { NameSlugFields } from "@/components/name-slug-fields";
import { Field, Select, Textarea } from "@/components/ui";
import type { EditField } from "./actions";

export type ServiceFieldsProps = {
  service: { slug: string; name: string; description: string | null; ownerTeamId: string | null; visibility: string; lifecycle: string; kind: "API" | "FRONTEND" | "WORKER"; tags: string[] };
  teams: { id: string; name: string }[];
  /** O serviço já publicou spec: o endereço (slug) não muda mais (RN-31). */
  slugLocked: boolean;
  /** Quem edita qualquer serviço pode deixá-lo sem time (RN-33). */
  allowNoTeam: boolean;
  errors?: Partial<Record<EditField, string>>;
};

/**
 * Dados do serviço (achados M4 e F1 da auditoria de UX de 02/10/2026): o endereço vira texto pequeno abaixo
 * do nome e só abre como campo se a pessoa pedir. Tudo aqui vive dentro do <DirtyForm> da página: não há botão
 * "Salvar" próprio, e o formulário inteiro é salvo de uma vez.
 */
export function ServiceFields({ service, teams, slugLocked, allowNoTeam, errors }: ServiceFieldsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <NameSlugFields
        nameRequired
        nameLabel="Nome do serviço"
        slugPrefix="/services/"
        slugLocked={slugLocked}
        defaultName={service.name}
        defaultSlug={service.slug}
        errors={{ name: errors?.name, slug: errors?.slug }}
      />
      {slugLocked && (
        <p className="col-span-full -mt-3 text-sm text-muted">O endereço fica fixo porque o serviço já publicou spec e outros serviços podem depender dele.</p>
      )}
      <div className="sm:col-span-2">
        <Field label="Descrição">
          <Textarea name="description" defaultValue={service.description ?? ""} maxLength={500} placeholder="O que este serviço faz, em uma ou duas frases." />
        </Field>
      </div>
      <Field label={allowNoTeam ? "Time responsável" : "Time responsável *"} error={errors?.ownerTeamId}>
        <Select
          name="ownerTeamId"
          defaultValue={service.ownerTeamId ?? ""}
          placeholder={allowNoTeam ? undefined : "Escolha um time"}
          required={!allowNoTeam}
          aria-invalid={!!errors?.ownerTeamId}
        >
          {allowNoTeam && <option value="">Sem time</option>}
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <Field label="Quem pode ver">
        <Select name="visibility" defaultValue={service.visibility}>
          <option value="ORG">Toda a empresa</option>
          <option value="TEAM">Só o time responsável</option>
        </Select>
      </Field>
      <Field label="Tipo">
        <Select name="kind" defaultValue={service.kind}>
          {SERVICE_KINDS.map((k) => <option key={k} value={k}>{SERVICE_KIND_LABEL[k]}</option>)}
        </Select>
      </Field>
      <Field label="Situação">
        <Select name="lifecycle" defaultValue={service.lifecycle}>
          <option value="experimental">Experimental</option>
          <option value="production">Em produção</option>
          <option value="deprecated">Descontinuado</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Tags" hint="Digite uma tag e clique em +. Ficam em minúsculas, até 10.">
          <ChipInput name="tags" defaultValues={service.tags} max={10} normalize={(v) => v.toLowerCase().slice(0, 30)} placeholder="checkout" addLabel="Adicionar tag" />
        </Field>
      </div>
    </div>
  );
}
