"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CREDITS, SETUP_STEPS, type SetupStepId } from "@api-hub/core/setup";
import { PROVIDER_META, type AuthProviderType } from "@api-hub/core/auth-providers";
import { SOURCE_META } from "@api-hub/core/sources";
import { ROLE_LABEL } from "@api-hub/core/types";
import { ChipInput } from "@/components/chip-input";
import { Badge, Button, Field, Input, Notice } from "@/components/ui";
import {
  EnvironmentsEditor, PolicyFields, ProvidersEditor, SourcesEditor, providersPayload, sourcesPayload,
  type EnvDraft, type ProviderDraft, type SourceDraft,
} from "@/components/config-editors";
import { MailEditor, emptyMail, mailPayload, type MailDraft } from "@/components/mail-editor";
import { HubLogo } from "@/components/hub-logo";
import { DatabaseStep } from "./database-step";
import { confirmOwner, signInAsOwner } from "./actions";

type Data = {
  orgName: string | null; orgSlug: string | null; appName: string; allowedGithubOrgs: string[]; allowedEmailDomains: string[];
  autoApproveOrgMembers: boolean; outsiderPolicy: "REQUEST_APPROVAL" | "BLOCK";
  sessionMaxAgeHours: number; membershipRecheckHours: number; accessRequestTtlDays: number;
  ownerIdentifier: string | null;
  providers: (Omit<ProviderDraft, "clientSecret"> & { hasSecret: boolean })[];
  callbacks: Record<string, string>;
  sources: { type: SourceDraft["type"]; baseUrl: string; hasToken: boolean }[];
  environments: EnvDraft[];
  warnings: string[];
  mail: MailDraft | null;
};
type InstallLog = { action: string; createdAt: string; metadata: unknown };
type State = {
  installed: boolean; databaseReady: boolean; currentStep?: SetupStepId;
  data: Data | null;
  owner?: { claimedBy: string | null; sessionIdentity: string | null };
  installLogs?: InstallLog[];
};

const WELCOME_SEEN_KEY = "ahub_setup_welcome_seen";

const splitList = (v: FormDataEntryValue | null) => String(v ?? "").split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

export function SetupWizard() {
  const [state, setState] = useState<State | null>(null);
  const [active, setActive] = useState<SetupStepId>("welcome");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [providers, setProviders] = useState<ProviderDraft[]>([]);
  const [sources, setSources] = useState<SourceDraft[]>([]);
  const [envs, setEnvs] = useState<EnvDraft[]>([]);
  const [mail, setMail] = useState<MailDraft>(emptyMail());
  const [probeTo, setProbeTo] = useState("");
  const [probeNote, setProbeNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = (await fetch("/api/setup", { cache: "no-store" }).then((r) => r.json())) as State;
    if (s.installed) return window.location.assign("/");
    setState(s);
    if (s.databaseReady && s.currentStep) {
      setActive(s.currentStep);
    } else {
      setActive(sessionStorage.getItem(WELCOME_SEEN_KEY) === "1" ? "database" : "welcome");
    }
    if (s.data) {
      setProviders(s.data.providers.map((p) => ({ ...p, clientSecret: "" })));
      setSources(s.data.sources.map((x) => ({ ...x, token: "" })));
      setEnvs(s.data.environments);
      if (s.data.mail) setMail({ ...s.data.mail, password: "" });
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = (step: SetupStepId, data: unknown) =>
    start(async () => {
      setError(null);
      const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step, data }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error ?? "Não foi possível salvar.");
      if (body.installed) return window.location.assign("/");
      await load();
    });

  if (!state) return <main className="grid min-h-dvh place-items-center text-muted">Carregando o assistente…</main>;

  const currentIdx = state.databaseReady && state.currentStep ? SETUP_STEPS.findIndex((s) => s.id === state.currentStep) : -1;
  const activeIdx = SETUP_STEPS.findIndex((s) => s.id === active);
  const d = state.data;
  const oauth = providers.filter((p) => p.type !== "CREDENTIALS");
  const hasCredentials = providers.some((p) => p.type === "CREDENTIALS");
  const savedTypes = new Set(d?.providers.map((p) => p.type));

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside>
        <HubLogo className="mb-3 size-12" />
        <p className="text-sm text-muted">Instalação do</p>
        <h1 className="mb-8 text-2xl font-bold tracking-tight">{d?.appName ?? "Rizoma"}</h1>
        <ol className="space-y-1">
          {SETUP_STEPS.map((s, i) => {
            const reachable = i <= 1 || (state.databaseReady && i <= currentIdx);
            const done = i <= 1 ? state.databaseReady : i < currentIdx;
            return (
              <li key={s.id}>
                <button type="button" disabled={!reachable} onClick={() => { setError(null); setActive(s.id); }}
                  className={`flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-sm disabled:cursor-not-allowed ${active === s.id ? "bg-accent/12 font-semibold text-accent" : reachable ? "text-ink/80 hover:bg-paper" : "text-muted/70"}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs ${done ? "border-accent bg-accent text-accent-ink" : active === s.id ? "border-accent text-accent" : "border-line"}`}>{i + 1}</span>
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className="min-w-0 rounded-panel border border-line bg-sheet p-6 md:p-8">
        <p className="text-sm text-muted">Etapa {activeIdx + 1} de {SETUP_STEPS.length}</p>
        <h2 className="mb-1 text-xl font-semibold">{SETUP_STEPS[activeIdx]!.title}</h2>
        <p className="mb-6 max-w-prose text-muted">{SETUP_STEPS[activeIdx]!.description}</p>
        {error && <p role="alert" className="mb-5 rounded-control border border-danger/40 bg-field px-3 py-2 text-sm text-danger">{error}</p>}

        {active === "welcome" && (
          <div className="space-y-6">
            <div className="max-w-prose space-y-2 text-sm">
              <p>O Rizoma é o catálogo interno das APIs da empresa: a documentação de cada serviço, quem chama quem, as variáveis de ambiente e quem pode entrar.</p>
              <p className="text-muted">Este assistente deixa a instalação pronta. O que você salvar aqui continua editável em Configurações. Só o identificador da empresa não muda depois.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-field p-4">
                <h3 className="text-sm font-semibold">O que você vai configurar</h3>
                <ol className="mt-3 space-y-2 text-sm text-muted">
                  <li><span className="font-medium text-ink">Banco.</span> Conferir a conexão e as migrações.</li>
                  <li><span className="font-medium text-ink">Entrada.</span> Como as pessoas entram, e o e-mail de convite (pode pular).</li>
                  <li><span className="font-medium text-ink">Empresa.</span> Nome, vínculo, repositórios, regras de acesso e ambientes.</li>
                  <li><span className="font-medium text-ink">Administrador.</span> Quem será o primeiro Proprietário.</li>
                </ol>
              </div>
              <div className="rounded-control border border-line bg-field p-4">
                <h3 className="text-sm font-semibold">Tenha em mãos</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  <li>Nome da empresa e um identificador curto, como <span className="font-mono text-ink">acme</span>.</li>
                  <li>Domínios de e-mail e, se for usar GitHub, as organizações aceitas.</li>
                  <li>Client ID e secret, se não for começar só com e-mail e senha.</li>
                  <li>Ambientes e branches, por exemplo dev, homologação e produção.</li>
                  <li>Quem será o primeiro administrador.</li>
                </ul>
              </div>
            </div>

            <Notice tone="wait" title="Mantenha esta URL privada até concluir">
              Não há token de instalação. Quem abrir o hub antes do fim pode se definir como administrador. Restrinja o acesso (firewall, VPN ou lista de IPs) até existir um Proprietário.
            </Notice>

            <p className="text-sm text-muted">O progresso fica salvo no banco assim que a conexão estiver pronta. Fechar o navegador não perde o que já foi gravado. Você pode voltar a uma etapa anterior; não dá para pular para a frente.</p>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button onClick={() => { sessionStorage.setItem(WELCOME_SEEN_KEY, "1"); setActive("database"); }}>Continuar</Button>
              <p className="text-sm text-muted">
                Projeto aberto, desenvolvido por <a href={CREDITS.url} target="_blank" rel="noreferrer" className="text-accent">{CREDITS.name}</a>.
              </p>
            </div>
          </div>
        )}

        {active === "database" && <DatabaseStep onRefresh={load} />}

        {active === "login" && d && (
          <div className="space-y-6">
            <p className="max-w-prose text-sm text-muted">Escolha pelo menos uma. Os segredos ficam cifrados. Dá para acrescentar ou trocar depois em Configurações.</p>
            <ProvidersEditor value={providers} onChange={setProviders} callbacks={d.callbacks} />
            <Button disabled={pending || providers.length === 0} onClick={() => submit("login", { providers: providersPayload(providers) })}>Salvar e continuar</Button>
          </div>
        )}

        {active === "email" && (
          <div className="space-y-6">
            <MailEditor value={mail} onChange={setMail} />
            <Field label="E-mail de prova" hint="Opcional: o teste também envia uma mensagem para este endereço.">
              <Input type="email" value={probeTo} onChange={(e) => setProbeTo(e.target.value)} />
            </Field>
            {probeNote && <p role="status" className="text-sm text-muted">{probeNote}</p>}
            <div className="flex flex-wrap gap-3">
              <Button disabled={pending} onClick={() => submit("email", { mode: "save", settings: mailPayload(mail) })}>Salvar e continuar</Button>
              <Button tone="quiet" disabled={pending} onClick={() => start(async () => {
                setError(null);
                setProbeNote(null);
                const res = await fetch("/api/setup/mail-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: mailPayload(mail), to: probeTo || undefined }) });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) return setError(body.error ?? "O teste falhou.");
                setProbeNote(probeTo ? "Conexão aceita e e-mail de prova enviado." : "Conexão aceita.");
              })}>Testar conexão</Button>
              <Button tone="quiet" disabled={pending} onClick={() => submit("email", { mode: "skip" })}>Pular por enquanto</Button>
            </div>
          </div>
        )}

        {active === "organization" && d && (
          <form className="space-y-5" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            submit("organization", {
              orgName: f.get("orgName"), orgSlug: f.get("orgSlug"), appName: f.get("appName"),
              allowedGithubOrgs: splitList(f.get("orgs")), allowedEmailDomains: splitList(f.get("domains")),
            });
          }}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome da empresa *"><Input name="orgName" defaultValue={d.orgName ?? ""} required /></Field>
              <Field label="Identificador *" hint="Curto e sem espaços, como acme. Não muda depois."><Input name="orgSlug" defaultValue={d.orgSlug ?? ""} required /></Field>
            </div>
            <Field label="Título do sistema *" hint="Aparece no topo, na aba do navegador e no login. Dá para mudar depois em Configurações, na aba Aparência.">
              <Input name="appName" defaultValue={d.appName} required />
            </Field>
            <Field label="Domínios de e-mail da empresa" hint="Digite um domínio e clique em +. Valem para Google, Microsoft, GitLab e OIDC.">
              <ChipInput name="domains" defaultValues={d.allowedEmailDomains} placeholder="acme.com.br" max={20} addLabel="Adicionar domínio" />
            </Field>
            {savedTypes.has("GITHUB") && (
              <Field label="Organizações do GitHub aceitas" hint="Digite uma organização e clique em +. Quem for membro ativo de alguma delas conta como da empresa.">
                <ChipInput name="orgs" defaultValues={d.allowedGithubOrgs} placeholder="acme" max={10} addLabel="Adicionar organização" />
              </Field>
            )}
            <Button disabled={pending}>Salvar e continuar</Button>
          </form>
        )}

        {active === "repositories" && d && (
          <div className="space-y-6">
            <SourcesEditor value={sources} onChange={setSources} />
            <Button disabled={pending} onClick={() => submit("repositories", { sources: sourcesPayload(sources) })}>
              {sources.length ? "Salvar e continuar" : "Continuar sem integração (CI, URL ou importação manual)"}
            </Button>
          </div>
        )}

        {active === "policies" && d && (
          <form className="space-y-5" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            submit("policies", {
              autoApproveOrgMembers: f.get("auto") === "on", outsiderPolicy: f.get("outsider"),
              sessionMaxAgeHours: Number(f.get("session")), membershipRecheckHours: Number(f.get("recheck")), accessRequestTtlDays: Number(f.get("ttl")),
            });
          }}>
            {d.warnings.map((w) => <Notice key={w} tone="wait">{w}</Notice>)}
            <PolicyFields defaults={{ auto: d.autoApproveOrgMembers, outsider: d.outsiderPolicy, session: d.sessionMaxAgeHours, recheck: d.membershipRecheckHours, ttl: d.accessRequestTtlDays }} />
            <Button disabled={pending}>Salvar e continuar</Button>
          </form>
        )}

        {active === "environments" && d && (
          <div className="space-y-6">
            <EnvironmentsEditor value={envs} onChange={setEnvs} />
            <Button disabled={pending} onClick={() => submit("environments", { environments: envs.map((e) => ({ ...e, syncBranch: e.syncBranch || undefined })) })}>Salvar e continuar</Button>
          </div>
        )}

        {active === "owner" && d && (
          <div className="space-y-8">
            {state.owner?.claimedBy ? (
              <div>
                <p className="mb-3 flex flex-wrap items-center gap-2 text-sm"><Badge tone="accent">Definido</Badge> <strong>{state.owner.claimedBy}</strong> é o Proprietário desta instalação.</p>
                <Button onClick={() => start(async () => { await confirmOwner(); await load(); })} disabled={pending}>Continuar</Button>
              </div>
            ) : (
              <>
                {oauth.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Entrar com um provedor</h3>
                    <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); submit("owner", { mode: "provider", ownerIdentifier: new FormData(e.currentTarget).get("id") }); }}>
                      <div className="min-w-64 flex-1">
                        <Field label="Usuário do GitHub ou e-mail do administrador" hint="Durante a instalação, só essa pessoa consegue entrar.">
                          <Input name="id" defaultValue={d.ownerIdentifier ?? ""} placeholder="seu-usuario ou voce@empresa.com" required />
                        </Field>
                      </div>
                      <Button tone="quiet" disabled={pending}>Salvar</Button>
                    </form>
                    {d.ownerIdentifier && (
                      <div className="flex flex-wrap gap-2">
                        {oauth.map((p) => (
                          <form key={p.type} action={signInAsOwner.bind(null, p.type as AuthProviderType)}>
                            <Button>Entrar com {p.type === "OIDC" ? p.label || "SSO" : PROVIDER_META[p.type].label}</Button>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {hasCredentials && (
                  <form className="space-y-4 border-t border-line pt-6" onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    if (f.get("password") !== f.get("confirm")) return setError("As senhas não conferem.");
                    submit("owner", { mode: "password", name: f.get("name"), email: f.get("email"), password: f.get("password") });
                  }}>
                    <h3 className="font-semibold">{oauth.length ? "Ou criar com e-mail e senha" : "Criar com e-mail e senha"}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Nome"><Input name="name" required /></Field>
                      <Field label="E-mail"><Input name="email" type="email" required /></Field>
                      <Field label="Senha" hint="12+ caracteres, misturando letras, números e símbolos."><Input name="password" type="password" required autoComplete="new-password" /></Field>
                      <Field label="Confirmar senha"><Input name="confirm" type="password" required autoComplete="new-password" /></Field>
                    </div>
                    <Button disabled={pending}>Criar administrador</Button>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {active === "review" && d && (
          <div className="space-y-6">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[200px_1fr]">
              <dt className="text-muted">Empresa</dt><dd>{d.orgName} ({d.orgSlug})</dd>
              <dt className="text-muted">Título</dt><dd>{d.appName}</dd>
              <dt className="text-muted">Formas de login</dt><dd>{d.providers.map((p) => (p.type === "OIDC" ? p.label : PROVIDER_META[p.type].label)).join(", ")}</dd>
              <dt className="text-muted">E-mail</dt><dd>{d.mail ? d.mail.fromAddress : "não configurado"}</dd>
              <dt className="text-muted">Vínculo com a empresa</dt>
              <dd>{[d.allowedEmailDomains.length && `domínios ${d.allowedEmailDomains.join(", ")}`, d.allowedGithubOrgs.length && `orgs GitHub ${d.allowedGithubOrgs.join(", ")}`].filter(Boolean).join(" · ") || "nenhum: todos pedem acesso"}</dd>
              <dt className="text-muted">Repositórios</dt><dd>{d.sources.map((s) => SOURCE_META[s.type].label).join(", ") || "sem integração"}</dd>
              <dt className="text-muted">Ambientes</dt><dd>{d.environments.map((e) => `${e.name} (${e.branchPatterns.join(", ")})`).join(" · ")}</dd>
              <dt className="text-muted">Quem é da empresa</dt><dd>{d.autoApproveOrgMembers ? `entra direto como ${ROLE_LABEL.VIEWER}` : "precisa de aprovação"}</dd>
              <dt className="text-muted">Quem não é</dt><dd>{d.outsiderPolicy === "BLOCK" ? "não entra" : "pede acesso"}</dd>
              <dt className="text-muted">Proprietário</dt><dd>{state.owner?.claimedBy}</dd>
            </dl>
            {d.warnings.map((w) => <Notice key={w} tone="wait">{w}</Notice>)}
            <p className="max-w-prose text-sm text-muted">Ao concluir, este assistente fica bloqueado. Tudo isso continua editável em Configurações.</p>
            <Button onClick={() => submit("review", { confirm: true })} disabled={pending}>Concluir instalação</Button>
          </div>
        )}

        {!!state.installLogs?.length && (
          <details className="mt-8 border-t border-line pt-4 text-sm">
            <summary className="cursor-pointer text-muted">Registro da instalação ({state.installLogs.length})</summary>
            <ul className="mt-3 space-y-1 font-mono text-[12px] text-muted">
              {state.installLogs.map((l, i) => (
                <li key={i}>{new Date(l.createdAt).toLocaleString("pt-BR")} — {l.action}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </main>
  );
}
