"use client";

import { AUTH_PROVIDER_TYPES, PROVIDER_META, type AuthProviderType } from "@api-hub/core/auth-providers";
import { SOURCE_META, SOURCE_PROVIDERS, type SourceProvider } from "@api-hub/core/sources";
import { ChipInput } from "@/components/chip-input";
import { Field, Input } from "@/components/ui";

// ─── Formas de login ────────────────────────────────────────────────────

export type ProviderDraft = {
  type: AuthProviderType; clientId: string; clientSecret: string; issuer: string; tenantId: string; label: string; allowSignup: boolean; hasSecret?: boolean;
};

export function emptyProvider(type: AuthProviderType): ProviderDraft {
  return { type, clientId: "", clientSecret: "", issuer: "", tenantId: "", label: "", allowSignup: false };
}

export function providersPayload(list: ProviderDraft[]) {
  return list.map((p) => ({
    type: p.type,
    ...(PROVIDER_META[p.type].fields.includes("clientId") ? { clientId: p.clientId } : {}),
    ...(p.clientSecret ? { clientSecret: p.clientSecret } : {}),
    ...(p.issuer ? { issuer: p.issuer } : {}),
    ...(p.tenantId ? { tenantId: p.tenantId } : {}),
    ...(p.label ? { label: p.label } : {}),
    ...(p.type === "CREDENTIALS" ? { allowSignup: p.allowSignup } : {}),
  }));
}

/** Campos de um provedor. O assistente mostra todos de uma vez; Configurações abre um de cada vez. */
export function ProviderFields({ draft, onChange, callback }: { draft: ProviderDraft; onChange: (patch: Partial<ProviderDraft>) => void; callback?: string }) {
  const meta = PROVIDER_META[draft.type];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{meta.help}</p>
      {callback && <p className="text-sm">URL de retorno (callback): <code className="break-all font-mono">{callback}</code></p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {meta.fields.includes("label") && (
          <Field label="Nome do botão"><Input value={draft.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="Keycloak" /></Field>
        )}
        {meta.fields.includes("issuer") && (
          <Field label={draft.type === "GITLAB" ? "URL do GitLab (opcional)" : "Emissor (issuer)"}>
            <Input value={draft.issuer} onChange={(e) => onChange({ issuer: e.target.value })} placeholder={draft.type === "GITLAB" ? "https://gitlab.suaempresa.com" : "https://sso.suaempresa.com/realms/main"} />
          </Field>
        )}
        {meta.fields.includes("clientId") && (
          <Field label={draft.type === "FACEBOOK" ? "App ID" : "Client ID"}><Input value={draft.clientId} onChange={(e) => onChange({ clientId: e.target.value })} autoComplete="off" /></Field>
        )}
        {meta.fields.includes("clientSecret") && (
          <Field label={draft.type === "FACEBOOK" ? "App secret" : "Client secret"} hint={draft.hasSecret ? "Já existe um secret salvo. Deixe em branco para manter." : "Fica cifrado no banco."}>
            <Input type="password" value={draft.clientSecret} onChange={(e) => onChange({ clientSecret: e.target.value })} autoComplete="off" />
          </Field>
        )}
        {meta.fields.includes("tenantId") && (
          <Field label="Tenant (ID do diretório)" hint="Com o tenant, só contas do seu diretório contam como da empresa.">
            <Input value={draft.tenantId} onChange={(e) => onChange({ tenantId: e.target.value })} placeholder="00000000-0000-0000-0000-000000000000" />
          </Field>
        )}
      </div>
      {meta.fields.includes("allowSignup") && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={draft.allowSignup} onChange={(e) => onChange({ allowSignup: e.target.checked })} className="mt-0.5 size-4 accent-accent" />
          <span>Permitir que pessoas criem conta e peçam acesso (sempre com aprovação). Desmarcado, só entra quem recebe convite.</span>
        </label>
      )}
    </div>
  );
}

export function ProvidersEditor({ value, onChange, callbacks }: { value: ProviderDraft[]; onChange: (v: ProviderDraft[]) => void; callbacks: Record<string, string> }) {
  const toggle = (t: AuthProviderType, on: boolean) => onChange(on ? [...value, emptyProvider(t)] : value.filter((p) => p.type !== t));
  const set = (t: AuthProviderType, patch: Partial<ProviderDraft>) => onChange(value.map((p) => (p.type === t ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-3">
      {AUTH_PROVIDER_TYPES.map((t) => {
        const meta = PROVIDER_META[t];
        const p = value.find((x) => x.type === t);
        return (
          <div key={t} className={`rounded-control border bg-field p-4 ${p ? "border-accent" : "border-line"}`}>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={!!p} onChange={(e) => toggle(t, e.target.checked)} className="mt-1 size-4 accent-accent" />
              <span>
                <strong>{meta.label}</strong>
                <span className="block text-sm text-muted">Vínculo com a empresa: {meta.affiliation}.</span>
              </span>
            </label>
            {p && (
              <div className="mt-4 border-t border-line pt-4">
                <ProviderFields draft={p} onChange={(patch) => set(t, patch)} callback={t === "CREDENTIALS" ? undefined : callbacks[t]} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Repositórios ───────────────────────────────────────────────────────

export type SourceDraft = { type: SourceProvider; baseUrl: string; token: string; hasToken?: boolean };

export function sourcesPayload(list: SourceDraft[]) {
  return list.map((s) => ({ type: s.type, ...(s.baseUrl ? { baseUrl: s.baseUrl } : {}), ...(s.token ? { token: s.token } : {}) }));
}

export function SourceFields({ draft, onChange }: { draft: SourceDraft; onChange: (patch: Partial<SourceDraft>) => void }) {
  if (draft.type === "GENERIC") return <p className="text-sm text-muted">Esta origem não pede URL nem token. As specs vêm por URL, CI ou importação manual.</p>;
  const meta = SOURCE_META[draft.type];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="URL (só para instalação própria)"><Input value={draft.baseUrl} onChange={(e) => onChange({ baseUrl: e.target.value })} placeholder={meta.defaultBaseUrl} /></Field>
      <Field label="Token de leitura" hint={draft.hasToken ? "Token salvo. Deixe em branco para manter." : meta.tokenHelp}>
        <Input type="password" value={draft.token} onChange={(e) => onChange({ token: e.target.value })} autoComplete="off" />
      </Field>
    </div>
  );
}

export function SourcesEditor({ value, onChange }: { value: SourceDraft[]; onChange: (v: SourceDraft[]) => void }) {
  const toggle = (t: SourceProvider, on: boolean) => onChange(on ? [...value, { type: t, baseUrl: "", token: "" }] : value.filter((s) => s.type !== t));
  const set = (t: SourceProvider, patch: Partial<SourceDraft>) => onChange(value.map((s) => (s.type === t ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Marque onde está o código. Mesmo sem nenhuma integração, os serviços podem receber a spec pelo CI, por URL ou por importação manual do JSON/YAML.
      </p>
      {SOURCE_PROVIDERS.map((t) => {
        const s = value.find((x) => x.type === t);
        const meta = SOURCE_META[t];
        return (
          <div key={t} className={`rounded-control border bg-field p-4 ${s ? "border-accent" : "border-line"}`}>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={!!s} onChange={(e) => toggle(t, e.target.checked)} className="size-4 accent-accent" />
              <strong>{meta.label}</strong>
            </label>
            {s && t !== "GENERIC" && (
              <div className="mt-4 border-t border-line pt-4">
                <SourceFields draft={s} onChange={(patch) => set(t, patch)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Ambientes ──────────────────────────────────────────────────────────

export type EnvDraft = { slug: string; name: string; branchPatterns: string[]; syncBranch: string; color: string; isProduction: boolean };

export const emptyEnvironment = (): EnvDraft => ({ slug: "", name: "", branchPatterns: [], syncBranch: "", color: "#5b6b70", isProduction: false });

export function EnvironmentFields({ draft, onChange }: { draft: EnvDraft; onChange: (patch: Partial<EnvDraft>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_110px]">
        <Field label="Nome"><Input value={draft.name} onChange={(x) => onChange({ name: x.target.value })} /></Field>
        <Field label="Identificador"><Input value={draft.slug} onChange={(x) => onChange({ slug: x.target.value.toLowerCase() })} /></Field>
        <Field label="Cor"><input type="color" value={draft.color} onChange={(x) => onChange({ color: x.target.value })} className="h-10 w-full rounded-control border border-line bg-field" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branches" hint="Digite um padrão e clique em +. * casa um trecho (release/*) e ** casa qualquer caminho (feature/**).">
          <ChipInput value={draft.branchPatterns} onChange={(branchPatterns) => onChange({ branchPatterns })} placeholder="main" addLabel="Adicionar branch" />
        </Field>
        <Field label="Branch de leitura" hint="Usada quando a spec é lida direto do repositório."><Input value={draft.syncBranch} onChange={(x) => onChange({ syncBranch: x.target.value })} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.isProduction} onChange={(x) => onChange({ isProduction: x.target.checked })} className="size-4 accent-accent" />
        É produção
      </label>
    </div>
  );
}

export function EnvironmentsEditor({ value, onChange }: { value: EnvDraft[]; onChange: (v: EnvDraft[]) => void }) {
  const set = (i: number, patch: Partial<EnvDraft>) => onChange(value.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const move = (i: number, d: -1 | 1) => {
    const n = [...value];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x!);
    onChange(n);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        A spec enviada pelo CI cai no ambiente cuja branch casar primeiro, de cima para baixo. Use <code className="font-mono">*</code> para um trecho
        (ex.: <code className="font-mono">release/*</code>) e <code className="font-mono">**</code> para qualquer coisa (ex.: <code className="font-mono">feature/**</code>).
      </p>
      {value.map((e, i) => (
        <div key={i} className="rounded-control border border-line bg-field p-4">
          <EnvironmentFields draft={e} onChange={(patch) => set(i, patch)} />
          <div className="mt-3 flex justify-end gap-3 text-sm">
            {i > 0 && <button type="button" onClick={() => move(i, -1)} className="text-muted hover:text-ink">Subir</button>}
            {i < value.length - 1 && <button type="button" onClick={() => move(i, 1)} className="text-muted hover:text-ink">Descer</button>}
            {value.length > 1 && <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-danger">Remover</button>}
          </div>
        </div>
      ))}
      <button type="button" className="text-sm text-accent" onClick={() => onChange([...value, emptyEnvironment()])}>
        + Adicionar ambiente
      </button>
    </div>
  );
}
