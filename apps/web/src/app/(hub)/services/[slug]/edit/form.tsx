"use client";

import { useActionState } from "react";
import { ChipInput } from "@/components/chip-input";
import { Button, Field, Input, Select } from "@/components/ui";
import { saveSpecSource, updateService, type EditResult } from "./actions";
import { useState } from "react";
import { SOURCE_META, type SourceProvider } from "@api-hub/core/sources";
import { SERVICE_KIND_LABEL, SERVICE_KINDS } from "@api-hub/core/types";

type Props = {
  service: { id: string; slug: string; name: string; description: string | null; ownerTeamId: string | null; visibility: string; lifecycle: string; kind: "API" | "FRONTEND" | "WORKER"; tags: string[] };
  teams: { id: string; name: string }[];
  slugLocked: boolean;
  allowNoTeam: boolean;
};

export function EditServiceForm({ service, teams, slugLocked, allowNoTeam }: Props) {
  const [state, action, pending] = useActionState<EditResult, FormData>(updateService, { ok: false });
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={service.id} />
      <Field label="Nome"><Input name="name" defaultValue={service.name} required /></Field>
      <Field label="Slug" hint={slugLocked ? "Congelado: o serviço já publicou spec e outros serviços podem depender dele." : "Aparece na URL e nas dependências declaradas."}>
        <Input name="slug" defaultValue={service.slug} readOnly={slugLocked} required className={slugLocked ? "w-full cursor-not-allowed bg-paper text-muted" : undefined} />
      </Field>
      <div className="sm:col-span-2"><Field label="Descrição"><Input name="description" defaultValue={service.description ?? ""} /></Field></div>
      <Field label="Time responsável">
        <Select name="ownerTeamId" defaultValue={service.ownerTeamId ?? ""}>
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
      <Field label="Tags" hint="Digite uma tag e clique em +. Ficam em minúsculas, até 10.">
        <ChipInput name="tags" defaultValues={service.tags} max={10} normalize={(v) => v.toLowerCase().slice(0, 30)} placeholder="checkout" addLabel="Adicionar tag" />
      </Field>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button disabled={pending}>{pending ? "Salvando…" : "Salvar alterações"}</Button>
        {state.message && <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}

export function SpecSourceForm({ service, repos, integrations }: {
  service: { id: string; specSource: string; specRepositoryId: string | null; specPath: string | null; pullUrl: string | null; hasHeaders: boolean };
  repos: { id: string; fullName: string; provider: SourceProvider }[];
  integrations: SourceProvider[];
}) {
  const [state, action, pending] = useActionState<EditResult, FormData>(saveSpecSource, { ok: false });
  const [source, setSource] = useState(service.specSource);
  const readable = repos.filter((r) => r.provider !== "GENERIC");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={service.id} />
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {[
          ["CI_PUSH", "CI envia", "O pipeline de integração contínua faz POST /api/v1/specs a cada deploy, usando um token de publicação; o ambiente vem da branch."],
          ["REPO_FILE", "Arquivo no repositório", "O hub lê o arquivo (ex.: openapi.yaml) na branch de leitura de cada ambiente."],
          ["URL_PULL", "URL", "O hub busca a spec numa URL; use {env} para o ambiente."],
          ["MANUAL_UPLOAD", "Importação manual", "Alguém do time envia o JSON/YAML pela tela."],
        ].map(([v, label, help]) => (
          <label key={v} className={`flex cursor-pointer gap-3 rounded-control border bg-field p-3 ${source === v ? "border-accent" : "border-line"}`}>
            <input type="radio" name="specSource" value={v} checked={source === v} onChange={() => setSource(v!)} className="mt-1 accent-accent" />
            <span><strong>{label}</strong><span className="block text-muted">{help}</span></span>
          </label>
        ))}
      </div>
      {source === "REPO_FILE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Repositório" hint={integrations.length ? undefined : "Nenhuma integração de repositório configurada: peça ao admin em Configurações."}>
            <Select name="specRepositoryId" defaultValue={service.specRepositoryId ?? ""}>
              <option value="">Escolha…</option>
              {readable.map((r) => <option key={r.id} value={r.id} disabled={!integrations.includes(r.provider)}>{r.fullName} ({SOURCE_META[r.provider].label})</option>)}
            </Select>
          </Field>
          <Field label="Caminho do arquivo"><Input name="specPath" defaultValue={service.specPath ?? "openapi.yaml"} placeholder="docs/openapi.yaml" /></Field>
        </div>
      )}
      {source === "URL_PULL" && (
        <div className="space-y-4">
          <Field label="URL da spec" hint="{env} vira o identificador do ambiente (dev, hml, prod…). Endereços de loopback e metadados de nuvem são bloqueados.">
            <Input name="pullUrl" defaultValue={service.pullUrl ?? ""} placeholder="https://pedidos.{env}.acme.internal/openapi.json" />
          </Field>
          <Field label="Cabeçalhos (JSON, opcional)" hint={service.hasHeaders ? "Há cabeçalhos salvos e cifrados. Deixe em branco para manter." : "Ex.: {\"Authorization\": \"Bearer ...\"}. Ficam cifrados."}>
            <Input name="pullHeaders" placeholder='{"Authorization": "Bearer ..."}' autoComplete="off" />
          </Field>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button disabled={pending}>Salvar origem</Button>
        {state.message && <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
