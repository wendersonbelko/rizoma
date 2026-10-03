"use client";

import { useState } from "react";
import { EnvironmentFields, emptyEnvironment, type EnvDraft } from "@/components/config-editors";
import { FormModal, useCloseOnSuccess } from "@/components/form-modal";
import { Badge, Button } from "@/components/ui";
import { DataTable, RowActionButton, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { saveEnvs } from "./actions";
import { Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

const payload = (list: EnvDraft[]) => list.map((e) => ({ ...e, syncBranch: e.syncBranch || undefined }));

export function EnvironmentSettings({ envs }: { envs: EnvDraft[] }) {
  const [value, setValue] = useState(envs);
  const [notice, setNotice] = useState<SettingsResult | null>(null);
  const [busy, setBusy] = useState(false);

  const commit = async (next: EnvDraft[]) => {
    setBusy(true);
    const result = await saveEnvs(payload(next));
    setBusy(false);
    setNotice(result);
    if (result.ok) setValue(next);
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
        {value.length < 10 && <AddEnvironment onSave={(draft) => commit([...value, draft])} />}
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
            <Tr key={`${env.slug}-${i}`}>
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
                  {value.length > 1 && (
                    <RowActionButton type="button" tone="danger" disabled={busy} onClick={() => commit(value.filter((_, j) => j !== i))}>Remover</RowActionButton>
                  )}
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
    <FormModal label="Adicionar ambiente" title="Novo ambiente" tone="primary" onOpen={() => setSession((n) => n + 1)}>
      <EnvDialog key={session} initial={emptyEnvironment()} onSave={onSave} />
    </FormModal>
  );
}

function EditEnvironment({ env, onSave }: { env: EnvDraft; onSave: (draft: EnvDraft) => Promise<SettingsResult> }) {
  const [session, setSession] = useState(0);
  return (
    <FormModal label="Editar" title={env.name || "Ambiente"} tone="quiet" onOpen={() => setSession((n) => n + 1)}>
      <EnvDialog key={session} initial={env} onSave={onSave} />
    </FormModal>
  );
}

function EnvDialog({ initial, onSave }: { initial: EnvDraft; onSave: (draft: EnvDraft) => Promise<SettingsResult> }) {
  const [draft, setDraft] = useState(initial);
  const [state, setState] = useState<SettingsResult>({ ok: false });
  const [pending, setPending] = useState(false);
  useCloseOnSuccess(state, pending);

  return (
    <div className="space-y-5">
      <EnvironmentFields draft={draft} onChange={(patch) => { setDraft({ ...draft, ...patch }); setState({ ok: false }); }} />
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={pending} onClick={async () => { setPending(true); setState(await onSave(draft)); setPending(false); }}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Msg state={state} />
      </div>
    </div>
  );
}
