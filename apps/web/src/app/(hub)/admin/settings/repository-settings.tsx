"use client";

import { useState, useTransition } from "react";
import { SOURCE_META, SOURCE_PROVIDERS, type SourceProvider } from "@api-hub/core/sources";
import { SourceFields, sourcesPayload, type SourceDraft } from "@/components/config-editors";
import { FormModal, ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { Badge, Button } from "@/components/ui";
import { CellTitle, DataTable, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { generateSyncToken, generateWebhookSecret, saveRepositories } from "./actions";
import { ConfirmOff, Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

type SourceRow = SourceDraft & { hasWebhookSecret?: boolean };

/**
 * A lista vem da página (servidor) e é a única fonte: toda ação salva e revalida, então `sources` já chega atualizada.
 * Webhook e sincronização agendada começam pelo para quê e deixam o jargão (URL, Bearer, cron) em "Avançado" (achado V5).
 */
export function RepositorySettings({ sources: value, webhookUrl, hasSyncToken }: {
  sources: SourceRow[];
  webhookUrl: string;
  hasSyncToken: boolean;
}) {
  const [notice, setNotice] = useState<SettingsResult | null>(null);
  const linked = value.filter((s) => s.type !== "GENERIC");

  const turnOff = async (type: SourceProvider): Promise<SettingsResult> => {
    const result = await saveRepositories(sourcesPayload(value.filter((s) => s.type !== type)));
    if (result.ok) setNotice(result);
    return result;
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
              onOff={() => turnOff(type)}
              onSaved={(message) => setNotice(message ? { ok: true, message } : null)}
            />
          ))}
        </TBody>
      </DataTable>

      <section className="space-y-3 rounded-panel border border-line bg-sheet p-5">
        <h3 className="font-semibold tracking-tight">Atualizar a spec quando alguém faz push</h3>
        <p className="text-sm text-muted">Quando o código muda no repositório, o provedor avisa o hub e a spec é lida de novo, sem esperar ninguém sincronizar.</p>
        {linked.length > 0 ? (
          <details className="rounded-control border border-line bg-paper/60 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">Avançado: endereço e segredo do webhook</summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm text-muted">Cadastre este endereço como webhook de push no provedor e cole o segredo gerado abaixo.</p>
              <CopyLine value={webhookUrl} empty="Preencha o Endereço público do hub em E-mail, nesta página, para montar o endereço." />
              <div className="flex flex-wrap gap-2">
                {linked.map((s) => (
                  <FormModal
                    key={s.type}
                    label={s.hasWebhookSecret ? `Gerar outro segredo · ${SOURCE_META[s.type].label}` : `Gerar segredo · ${SOURCE_META[s.type].label}`}
                    title={`Segredo do webhook · ${SOURCE_META[s.type].label}`}
                    tone="quiet"
                  >
                    <RevealOnce label={s.hasWebhookSecret ? "Gerar outro segredo" : "Gerar segredo"} replaces={!!s.hasWebhookSecret} action={() => generateWebhookSecret(s.type)} />
                  </FormModal>
                ))}
              </div>
            </div>
          </details>
        ) : (
          <p className="text-sm text-muted">Ligue GitHub, GitLab ou Bitbucket acima para ativar.</p>
        )}
      </section>

      <section className="space-y-3 rounded-panel border border-line bg-sheet p-5">
        <h3 className="font-semibold tracking-tight">Sincronização agendada</h3>
        <p className="text-sm text-muted">Para ler as specs dos repositórios em horários fixos, um agendador da sua infraestrutura (cron) pede ao hub que sincronize.</p>
        <details className="rounded-control border border-line bg-paper/60 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">Avançado: chamada e token</summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted">
              O agendador chama <code className="font-mono text-ink">POST /api/v1/sync</code> com o cabeçalho <code className="font-mono text-ink">Authorization: Bearer</code> e o token abaixo.
              {hasSyncToken ? " Já existe um token. Gerar outro invalida o anterior." : " Ainda não há token."}
            </p>
            <FormModal label={hasSyncToken ? "Gerar outro token" : "Gerar token"} title="Token de sincronização" tone="quiet">
              <RevealOnce label={hasSyncToken ? "Gerar outro token" : "Gerar token"} replaces={hasSyncToken} action={() => generateSyncToken()} />
            </FormModal>
          </div>
        </details>
      </section>
    </div>
  );
}

function SourceTableRow({ type, current, list, onOff, onSaved }: {
  type: SourceProvider;
  current?: SourceRow;
  list: SourceRow[];
  onOff: () => Promise<SettingsResult>;
  onSaved: (message?: string) => void;
}) {
  const [session, setSession] = useState(0);
  const meta = SOURCE_META[type];
  return (
    <Tr>
      <Td>
        <CellTitle title={meta.label} meta={type === "GENERIC" ? "Specs por URL, CI ou importação manual." : undefined} />
      </Td>
      <Td><Badge tone={current ? "accent" : "neutral"}>{current ? "Ligado" : "Desligado"}</Badge></Td>
      <Td align="right">
        <RowActions>
          <FormModal label={current ? "Configurar" : "Ligar"} title={meta.label} tone="quiet" onOpen={() => setSession((n) => n + 1)}>
            <SourceDialog key={session} type={type} current={current} list={list} onSaved={onSaved} />
          </FormModal>
          {current && (
            <ConfirmOff
              label="Desligar"
              title={`Desligar ${meta.label}`}
              description="O hub deixa de ler specs direto desse provedor e o token guardado é apagado. As specs que já estão no catálogo continuam."
              actionLabel="Desligar origem"
              run={onOff}
            />
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
  onSaved: (message?: string) => void;
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
    if (result.ok) onSaved(result.message);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-5">
      <SourceFields draft={draft} onChange={(patch) => { setDraft({ ...draft, ...patch }); setState({ ok: false }); }} />
      <ModalActions message={!state.ok && state.message ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending}>{pending ? "Salvando…" : current ? "Salvar alterações" : "Ligar origem"}</Button>
      </ModalActions>
    </form>
  );
}

function CopyLine({ value, empty }: { value: string; empty: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-control border border-line bg-field px-3 py-2 font-mono text-[13px]">{value || empty}</code>
      {value && <CopyButton value={value} />}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      tone="quiet"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Sem permissão para a área de transferência (ex.: página em http): a pessoa seleciona e copia à mão.
        }
      }}
    >
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

/**
 * O valor gerado aparece uma vez e o modal fica aberto, com botão Copiar, para a pessoa levar para o provedor.
 * Gerar de novo invalida o anterior, então o aviso vem antes do botão.
 */
function RevealOnce({ label: labelNow, replaces: replacesNow, action }: { label: string; replaces: boolean; action: () => Promise<SettingsResult> }) {
  // Depois de gerar, a página recarrega e o rótulo mudaria para "Gerar outro" com o valor ainda na tela: guarda o de antes.
  const [{ label, replaces }] = useState({ label: labelNow, replaces: replacesNow });
  const [state, setState] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  const revealed = state?.ok && state.secret;
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setState(await action())); }} className="space-y-4">
      <p className="text-sm text-muted">
        Cole o valor no provedor agora: ele não aparece de novo.
        {replaces && " O valor de antes deixa de funcionar."}
      </p>
      {revealed && (
        <div className="space-y-2">
          <code className="block break-all rounded-control border border-line bg-field px-3 py-2 font-mono text-[13px]">{state.secret}</code>
          <CopyButton value={state.secret!} />
        </div>
      )}
      <ModalActions
        cancelLabel={revealed ? "Fechar" : "Cancelar"}
        message={state?.message ? <span className={state.ok ? "text-accent" : "text-danger"}>{state.message}</span> : undefined}
      >
        <Button disabled={pending || !!state?.ok}>{pending ? "Gerando…" : label}</Button>
      </ModalActions>
    </form>
  );
}
