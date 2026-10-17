"use client";

import { useState } from "react";
import { EnvironmentFields, emptyEnvironment, type EnvDraft } from "@/components/config-editors";
import { FormModal, ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { Badge, Button } from "@/components/ui";
import { DataTable, RowActionButton, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { saveEnvs } from "./actions";
import { Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

const MAX_ENVIRONMENTS = 10;
const payload = (list: EnvDraft[]) => list.map((e) => ({ ...e, syncBranch: e.syncBranch || undefined }));

/**
 * A lista vem da página (servidor) e é a única fonte: toda ação salva e revalida, então `envs` já chega atualizada
 * (inclusive depois de remover um ambiente na zona de perigo da aba, que é outro componente).
 * Criar e editar abrem modal; subir e descer salvam na hora. Remover fica na zona de perigo (achado F3).
 */
export function EnvironmentSettings({ envs: value }: { envs: EnvDraft[] }) {
  const [notice, setNotice] = useState<SettingsResult | null>(null);
  const [busy, setBusy] = useState(false);

  const commit = async (next: EnvDraft[]) => {
    setBusy(true);
    const result = await saveEnvs(payload(next));
    setBusy(false);
    setNotice(result);
    return result;
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const [row] = next.splice(i, 1);
    next.splice(i + d, 0, row!);
    return commit(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="mr-auto"><Msg state={notice} /></div>
        {value.length < MAX_ENVIRONMENTS ? <AddEnvironment onSave={(draft) => commit([...value, draft])} /> : <p className="text-sm text-muted">Limite de {MAX_ENVIRONMENTS} ambientes.</p>}
      </div>
      <DataTable caption="Ambientes e branches" minWidth={720}>
        <THead>
          <Th width={36}><SrOnly>Cor</SrOnly></Th>
          <Th>Nome</Th>
          <Th>Identificador</Th>
          <Th>Branches</Th>
          <Th align="right"><SrOnly>Ações</SrOnly></Th>
        </THead>
        <TBody>
          {value.map((env, i) => (
            <Tr key={env.slug}>
              <Td><span className="inline-block size-3 rounded-full border border-line" style={{ background: env.color }} /></Td>
              <Td>
                <span className="font-medium text-ink">{env.name}</span>
                {env.isProduction && <span className="ml-2"><Badge tone="accent">Produção</Badge></span>}
              </Td>
              <Td mono>{env.slug}</Td>
              <Td muted>{env.branchPatterns.join(", ") || "—"}</Td>
              <Td align="right">
                <RowActions>
                  <EditEnvironment env={env} onSave={(draft) => commit(value.map((row, j) => (j === i ? draft : row)))} />
                  {i > 0 && <RowActionButton type="button" disabled={busy} onClick={() => move(i, -1)}>Subir</RowActionButton>}
                  {i < value.length - 1 && <RowActionButton type="button" disabled={busy} onClick={() => move(i, 1)}>Descer</RowActionButton>}
                </RowActions>
              </Td>
            </Tr>
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}

function AddEnvironment({ onSave }: { onSave: (draft: EnvDraft) => Promise<SettingsResult> }) {
  const [session, setSession] = useState(0);
  return (
    <FormModal label="Adicionar ambiente" title="Novo ambiente" size="md" tone="primary" onOpen={() => setSession((n) => n + 1)}>
      <EnvDialog key={session} initial={emptyEnvironment()} isNew onSave={onSave} />
    </FormModal>
  );
}

function EditEnvironment({ env, onSave }: { env: EnvDraft; onSave: (draft: EnvDraft) => Promise<SettingsResult> }) {
  const [session, setSession] = useState(0);
  return (
    <FormModal label="Editar" title={env.name || "Ambiente"} size="md" tone="quiet" onOpen={() => setSession((n) => n + 1)}>
      <EnvDialog key={session} initial={env} onSave={onSave} />
    </FormModal>
  );
}

function EnvDialog({ initial, isNew, onSave }: { initial: EnvDraft; isNew?: boolean; onSave: (draft: EnvDraft) => Promise<SettingsResult> }) {
  const [draft, setDraft] = useState(initial);
  const [state, setState] = useState<SettingsResult>({ ok: false });
  const [pending, setPending] = useState(false);
  useCloseOnSuccess(state, pending);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setState(await onSave(draft));
        setPending(false);
      }}
    >
      <EnvironmentFields draft={draft} lockSlug={!isNew} onChange={(patch) => { setDraft({ ...draft, ...patch }); setState({ ok: false }); }} />
      <ModalActions message={!state.ok && state.message ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending}>{pending ? "Salvando…" : isNew ? "Criar ambiente" : "Salvar ambiente"}</Button>
      </ModalActions>
    </form>
  );
}
