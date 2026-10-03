"use client";

import { useState } from "react";
import { AUTH_PROVIDER_TYPES, PROVIDER_META, type AuthProviderType } from "@api-hub/core/auth-providers";
import { ProviderFields, emptyProvider, providersPayload, type ProviderDraft } from "@/components/config-editors";
import { FormModal, useCloseOnSuccess } from "@/components/form-modal";
import { Badge, Button } from "@/components/ui";
import { CellTitle, DataTable, RowActionButton, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { saveLogin } from "./actions";
import { Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

export function LoginSettings({ providers, callbacks }: { providers: ProviderDraft[]; callbacks: Record<string, string> }) {
  const [value, setValue] = useState(providers);
  const [notice, setNotice] = useState<SettingsResult | null>(null);
  const [rowError, setRowError] = useState<{ type: string; message: string } | null>(null);
  const [pendingOff, setPendingOff] = useState<string | null>(null);

  const stored = (list: ProviderDraft[]) => list.map((p) => ({ ...p, clientSecret: "", hasSecret: p.hasSecret || !!p.clientSecret.trim() }));

  const turnOff = async (type: AuthProviderType) => {
    setPendingOff(type);
    setRowError(null);
    const next = value.filter((p) => p.type !== type);
    const result = await saveLogin(providersPayload(next));
    setPendingOff(null);
    if (result.ok) {
      setValue(stored(next));
      setNotice(result);
    } else {
      setNotice(null);
      setRowError({ type, message: result.message ?? "Não foi possível desligar." });
    }
  };

  return (
    <div className="space-y-3">
      <Msg state={notice} />
      <DataTable caption="Formas de login" minWidth={640}>
        <THead>
          <Th>Forma de login</Th>
          <Th>Estado</Th>
          <Th align="right"><SrOnly>Ações</SrOnly></Th>
        </THead>
        <TBody>
          {AUTH_PROVIDER_TYPES.map((type) => (
            <LoginRow
              key={type}
              type={type}
              current={value.find((p) => p.type === type)}
              list={value}
              callback={type === "CREDENTIALS" ? undefined : callbacks[type]}
              error={rowError?.type === type ? rowError.message : undefined}
              pendingOff={pendingOff !== null}
              turningOff={pendingOff === type}
              onOff={() => turnOff(type)}
              onSaved={(next, message) => { setValue(stored(next)); setRowError(null); setNotice(message ? { ok: true, message } : null); }}
            />
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}

function LoginRow({ type, current, list, callback, error, pendingOff, turningOff, onOff, onSaved }: {
  type: AuthProviderType;
  current?: ProviderDraft;
  list: ProviderDraft[];
  callback?: string;
  error?: string;
  pendingOff: boolean;
  turningOff: boolean;
  onOff: () => void;
  onSaved: (next: ProviderDraft[], message?: string) => void;
}) {
  const [session, setSession] = useState(0);
  const meta = PROVIDER_META[type];
  return (
    <Tr>
      <Td>
        <CellTitle title={meta.label} meta={`Vínculo: ${meta.affiliation}.`} />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </Td>
      <Td><Badge tone={current ? "accent" : "neutral"}>{current ? "Ligado" : "Desligado"}</Badge></Td>
      <Td align="right">
        <RowActions>
          <FormModal label={current ? "Configurar" : "Ligar"} title={meta.label} tone="quiet" onOpen={() => setSession((n) => n + 1)}>
            <ProviderDialog key={session} type={type} current={current} list={list} callback={callback} onSaved={onSaved} />
          </FormModal>
          {current && (
            <RowActionButton type="button" tone="danger" disabled={pendingOff} onClick={onOff}>
              {turningOff ? "Desligando…" : "Desligar"}
            </RowActionButton>
          )}
        </RowActions>
      </Td>
    </Tr>
  );
}

function ProviderDialog({ type, current, list, callback, onSaved }: {
  type: AuthProviderType;
  current?: ProviderDraft;
  list: ProviderDraft[];
  callback?: string;
  onSaved: (next: ProviderDraft[], message?: string) => void;
}) {
  const [draft, setDraft] = useState<ProviderDraft>(current ?? emptyProvider(type));
  const [state, setState] = useState<SettingsResult>({ ok: false });
  const [pending, setPending] = useState(false);
  useCloseOnSuccess(state, pending);

  const save = async () => {
    setPending(true);
    const next = current ? list.map((p) => (p.type === type ? draft : p)) : [...list, draft];
    const result = await saveLogin(providersPayload(next));
    setState(result);
    setPending(false);
    if (result.ok) onSaved(next, result.message);
  };

  return (
    <div className="space-y-5">
      <ProviderFields draft={draft} onChange={(patch) => { setDraft({ ...draft, ...patch }); setState({ ok: false }); }} callback={callback} />
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={pending} onClick={save}>{pending ? "Salvando…" : "Salvar"}</Button>
        <Msg state={state} />
      </div>
    </div>
  );
}
