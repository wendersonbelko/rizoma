"use client";

import { useState } from "react";
import { SOURCE_META, SOURCE_PROVIDERS, type SourceProvider } from "@api-hub/core/sources";
import { SourceFields, sourcesPayload, type SourceDraft } from "@/components/config-editors";
import { FormModal, useCloseOnSuccess } from "@/components/form-modal";
import { Badge, Button } from "@/components/ui";
import { CellTitle, DataTable, RowActionButton, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { generateSyncToken, generateWebhookSecret, saveRepositories } from "./actions";
import { Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

type SourceRow = SourceDraft & { hasWebhookSecret?: boolean };

export function RepositorySettings({ sources, webhookUrl, hasSyncToken }: {
  sources: SourceRow[];
  webhookUrl: string;
  hasSyncToken: boolean;
}) {
  const [value, setValue] = useState(sources);
  const [notice, setNotice] = useState<SettingsResult | null>(null);
  const [rowError, setRowError] = useState<{ type: string; message: string } | null>(null);
  const [pendingOff, setPendingOff] = useState<string | null>(null);
  const linked = value.filter((s) => s.type !== "GENERIC");

  const stored = (list: SourceRow[]) => list.map((s) => ({ ...s, token: "", hasToken: s.hasToken || !!s.token.trim() }));

  const turnOff = async (type: SourceProvider) => {
    setPendingOff(type);
    setRowError(null);
    const next = value.filter((s) => s.type !== type);
    const result = await saveRepositories(sourcesPayload(next));
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
    <div className="space-y-4">
      <Msg state={notice} />
      <DataTable caption="Onde está o código" minWidth={560}>
        <THead>
          <Th>Origem</Th>
          <Th>Estado</Th>
          <Th align="right"><SrOnly>Ações</SrOnly></Th>
        </THead>
        <TBody>
          {SOURCE_PROVIDERS.map((type) => (
            <SourceTableRow
              key={type}
              type={type}
              current={value.find((s) => s.type === type)}
              list={value}
              error={rowError?.type === type ? rowError.message : undefined}
              pendingOff={pendingOff !== null}
              turningOff={pendingOff === type}
              onOff={() => turnOff(type)}
              onSaved={(next, message) => { setValue(stored(next)); setRowError(null); setNotice(message ? { ok: true, message } : null); }}
            />
          ))}
        </TBody>
      </DataTable>

      <section className="space-y-3 rounded-panel border border-line bg-sheet p-5">
        <h2 className="font-semibold tracking-tight">Webhook de push</h2>
        <CopyLine value={webhookUrl} empty="Defina o endereço público em E-mail para montar a URL." />
        {linked.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {linked.map((s) => (
              <FormModal key={s.type} label={s.hasWebhookSecret ? `Gerar outro segredo · ${SOURCE_META[s.type].label}` : `Gerar segredo · ${SOURCE_META[s.type].label}`} title={`Segredo do webhook · ${SOURCE_META[s.type].label}`} tone="quiet">
                <RevealOnce label={s.hasWebhookSecret ? "Gerar outro segredo" : "Gerar segredo"} action={() => generateWebhookSecret(s.type)} />
              </FormModal>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Ligue GitHub, GitLab ou Bitbucket para gerar o segredo.</p>
        )}
      </section>

      <section className="space-y-3 rounded-panel border border-line bg-sheet p-5">
        <h2 className="font-semibold tracking-tight">Sincronização agendada</h2>
        <p className="text-sm text-muted">
          O cron chama <code className="font-mono text-ink">POST /api/v1/sync</code> com <code className="font-mono text-ink">Authorization: Bearer</code>.
          {hasSyncToken ? " Já existe um token. Gerar outro invalida o anterior." : " Ainda não há token."}
        </p>
        <FormModal label={hasSyncToken ? "Gerar outro token" : "Gerar token"} title="Token de sincronização" tone="quiet">
          <RevealOnce label={hasSyncToken ? "Gerar outro token" : "Gerar token"} action={() => generateSyncToken()} />
        </FormModal>
      </section>
    </div>
  );
}

function SourceTableRow({ type, current, list, error, pendingOff, turningOff, onOff, onSaved }: {
  type: SourceProvider;
  current?: SourceRow;
  list: SourceRow[];
  error?: string;
  pendingOff: boolean;
  turningOff: boolean;
  onOff: () => void;
  onSaved: (next: SourceRow[], message?: string) => void;
}) {
  const [session, setSession] = useState(0);
  const meta = SOURCE_META[type];
  return (
    <Tr>
      <Td>
        <CellTitle title={meta.label} meta={type === "GENERIC" ? "Specs por URL, CI ou importação manual." : undefined} />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </Td>
      <Td><Badge tone={current ? "accent" : "neutral"}>{current ? "Ligado" : "Desligado"}</Badge></Td>
      <Td align="right">
        <RowActions>
          <FormModal label={current ? "Configurar" : "Ligar"} title={meta.label} tone="quiet" onOpen={() => setSession((n) => n + 1)}>
            <SourceDialog key={session} type={type} current={current} list={list} onSaved={onSaved} />
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

function SourceDialog({ type, current, list, onSaved }: {
  type: SourceProvider;
  current?: SourceRow;
  list: SourceRow[];
  onSaved: (next: SourceRow[], message?: string) => void;
}) {
  const [draft, setDraft] = useState<SourceRow>(current ?? { type, baseUrl: "", token: "" });
  const [state, setState] = useState<SettingsResult>({ ok: false });
  const [pending, setPending] = useState(false);
  useCloseOnSuccess(state, pending);

  const save = async () => {
    setPending(true);
    const next = current ? list.map((s) => (s.type === type ? draft : s)) : [...list, draft];
    const result = await saveRepositories(sourcesPayload(next));
    setState(result);
    setPending(false);
    if (result.ok) onSaved(next, result.message);
  };

  return (
    <div className="space-y-5">
      <SourceFields draft={draft} onChange={(patch) => { setDraft({ ...draft, ...patch }); setState({ ok: false }); }} />
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={pending} onClick={save}>{pending ? "Salvando…" : "Salvar"}</Button>
        <Msg state={state} />
      </div>
    </div>
  );
}

function CopyLine({ value, empty }: { value: string; empty: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-control border border-line bg-field px-3 py-2 font-mono text-[13px]">{value || empty}</code>
      {value && (
        <Button type="button" tone="quiet" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); }}>
          {copied ? "Copiado" : "Copiar"}
        </Button>
      )}
    </div>
  );
}

/** O segredo aparece uma vez e o modal fica aberto para copiar. */
function RevealOnce({ label, action }: { label: string; action: () => Promise<SettingsResult> }) {
  const [state, setState] = useState<SettingsResult | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Cole o valor no provedor agora. Ele não aparece de novo.</p>
      <Button disabled={pending || !!state?.ok} onClick={async () => { setPending(true); setState(await action()); setPending(false); }}>
        {pending ? "Gerando…" : label}
      </Button>
      {state?.message && <p role="status" className={`break-all text-sm ${state.ok ? "font-mono text-ink" : "text-danger"}`}>{state.message}</p>}
    </div>
  );
}
