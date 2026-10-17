"use client";

import { useState } from "react";
import { AUTH_PROVIDER_TYPES, PROVIDER_META, type AuthProviderType } from "@api-hub/core/auth-providers";
import { ProviderFields, emptyProvider, providersPayload, type ProviderDraft } from "@/components/config-editors";
import { FormModal, ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { Badge, Button } from "@/components/ui";
import { CellTitle, DataTable, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { saveLogin } from "./actions";
import { ConfirmOff, Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

/**
 * A lista vem da página (servidor) e é a única fonte: toda ação salva e revalida, então `providers` já chega atualizada.
 * Desligar apaga o secret guardado: confirma num modal, que mostra o erro (ex.: "você ficaria sem forma de entrar") e continua aberto.
 */
export function LoginSettings({ providers: value, callbacks }: { providers: ProviderDraft[]; callbacks: Record<string, string> }) {
  const [notice, setNotice] = useState<SettingsResult | null>(null);

  const turnOff = async (type: AuthProviderType): Promise<SettingsResult> => {
    const result = await saveLogin(providersPayload(value.filter((p) => p.type !== type)));
    if (result.ok) setNotice(result);
    return result;
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
              onOff={() => turnOff(type)}
              onSaved={(message) => setNotice(message ? { ok: true, message } : null)}
            />
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}

function LoginRow({ type, current, list, callback, onOff, onSaved }: {
  type: AuthProviderType;
  current?: ProviderDraft;
  list: ProviderDraft[];
  callback?: string;
  onOff: () => Promise<SettingsResult>;
  onSaved: (message?: string) => void;
}) {
  const [session, setSession] = useState(0);
  const meta = PROVIDER_META[type];
  return (
    <Tr>
      <Td>
        <CellTitle title={meta.label} meta={`Vínculo com a empresa: ${meta.affiliation}.`} />
      </Td>
      <Td><Badge tone={current ? "accent" : "neutral"}>{current ? "Ligado" : "Desligado"}</Badge></Td>
      <Td align="right">
        <RowActions>
          <FormModal label={current ? "Configurar" : "Ligar"} title={meta.label} size="md" tone="quiet" onOpen={() => setSession((n) => n + 1)}>
            <ProviderDialog key={session} type={type} current={current} list={list} callback={callback} onSaved={onSaved} />
          </FormModal>
          {current && (
            <ConfirmOff
              label="Desligar"
              title={`Desligar ${meta.label}`}
              description="Ninguém mais entra por esta forma de login e o secret guardado é apagado. Para ligar de novo, será preciso informar os dados outra vez."
              actionLabel="Desligar forma de login"
              run={onOff}
            />
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
  onSaved: (message?: string) => void;
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
    if (result.ok) onSaved(result.message);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-5">
      <ProviderFields draft={draft} onChange={(patch) => { setDraft({ ...draft, ...patch }); setState({ ok: false }); }} callback={callback} />
      <ModalActions message={!state.ok && state.message ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending}>{pending ? "Salvando…" : current ? "Salvar alterações" : "Ligar forma de login"}</Button>
      </ModalActions>
    </form>
  );
}
