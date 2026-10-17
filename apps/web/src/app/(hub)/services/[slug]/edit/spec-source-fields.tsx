"use client";

import { useState } from "react";
import Link from "next/link";
import { SOURCE_META, SPEC_SOURCE_LABEL, type SourceProvider } from "@api-hub/core/sources";
import { Field, Input, Select } from "@/components/ui";
import { SPEC_SOURCE_HELP, SPEC_SOURCE_ORDER } from "../spec-source-help";
import { OptionalDetails } from "../forms/optional-details";
import type { EditField } from "./actions";

export type SpecSourceFieldsProps = {
  service: { id: string; specSource: string; specRepositoryId: string | null; specPath: string | null; pullUrl: string | null; hasHeaders: boolean };
  repos: { id: string; fullName: string; provider: SourceProvider }[];
  /** Origens de código que o admin conectou em Configurações. */
  integrations: SourceProvider[];
  /** A pessoa abre "Tokens de CI": sem isso o atalho some em vez de levar a um 404. */
  canToken: boolean;
  errors?: Partial<Record<EditField, string>>;
};

/**
 * De onde vem a spec (RN-120 a RN-125). Não tem botão próprio: os campos entram no mesmo <DirtyForm> dos dados
 * do serviço (achado F1 da auditoria de UX de 02/10/2026). A origem escolhida fica em estado local aqui dentro,
 * de propósito: "Descartar" remonta os filhos do DirtyForm e a escolha volta ao que estava salvo.
 */
export function SpecSourceFields({ service, repos, integrations, canToken, errors }: SpecSourceFieldsProps) {
  const [source, setSource] = useState(service.specSource);
  const readable = repos.filter((r) => r.provider !== "GENERIC");
  return (
    <div className="space-y-4">
      <fieldset className="grid gap-2 text-sm sm:grid-cols-2">
        <legend className="sr-only">Como a spec chega ao hub</legend>
        {SPEC_SOURCE_ORDER.map((value) => (
          <label key={value} className={`flex cursor-pointer gap-3 rounded-control border bg-field p-3 ${source === value ? "border-accent" : "border-line-strong"}`}>
            <input type="radio" name="specSource" value={value} checked={source === value} onChange={() => setSource(value)} className="mt-1 accent-accent" />
            <span><strong>{SPEC_SOURCE_LABEL[value]}</strong><span className="block text-muted">{SPEC_SOURCE_HELP[value]}</span></span>
          </label>
        ))}
      </fieldset>

      {source === "CI_PUSH" && canToken && (
        <p className="text-sm text-muted">
          O pipeline precisa de um token. <Link href={`/admin/tokens?service=${service.id}#new-token`} className="text-accent">Gerar token de CI</Link>
        </p>
      )}

      {source === "REPO_FILE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Repositório *"
            error={errors?.specRepositoryId}
            hint={integrations.length ? undefined : "Nenhuma origem de repositório conectada: peça a quem administra em Configurações."}
          >
            <Select name="specRepositoryId" defaultValue={service.specRepositoryId ?? undefined} placeholder="Escolha um repositório" required aria-invalid={!!errors?.specRepositoryId}>
              {readable.map((r) => <option key={r.id} value={r.id} disabled={!integrations.includes(r.provider)}>{r.fullName} ({SOURCE_META[r.provider].label})</option>)}
            </Select>
          </Field>
          <Field label="Caminho do arquivo *" error={errors?.specPath}>
            <Input name="specPath" defaultValue={service.specPath ?? "openapi.yaml"} placeholder="docs/openapi.yaml" required aria-invalid={!!errors?.specPath} spellCheck={false} />
          </Field>
        </div>
      )}

      {source === "URL_PULL" && (
        <div className="space-y-4">
          <Field label="URL da spec *" error={errors?.pullUrl} hint="{env} vira o identificador do ambiente (dev, hml, prod…). Endereços de loopback e metadados de nuvem são bloqueados.">
            <Input name="pullUrl" defaultValue={service.pullUrl ?? ""} placeholder="https://pedidos.{env}.acme.internal/openapi.json" required aria-invalid={!!errors?.pullUrl} spellCheck={false} />
          </Field>
          <OptionalDetails summary="cabeçalhos da requisição" open={Boolean(errors?.pullHeaders)}>
            <Field
              label="Cabeçalhos (JSON)"
              error={errors?.pullHeaders}
              hint={service.hasHeaders ? "Há cabeçalhos salvos e cifrados. Deixe em branco para manter." : 'Ex.: {"Authorization": "Bearer ..."}. Ficam cifrados.'}
            >
              <Input name="pullHeaders" placeholder='{"Authorization": "Bearer ..."}' autoComplete="off" aria-invalid={!!errors?.pullHeaders} />
            </Field>
          </OptionalDetails>
        </div>
      )}
    </div>
  );
}
