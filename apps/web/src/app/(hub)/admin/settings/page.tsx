import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@api-hub/db";
import { requirePermission } from "@/lib/guards";
import { getInstallation } from "@/lib/install";
import { Notice, Panel } from "@/components/ui";
import { affiliationWarnings, environmentsForScreen, providersForScreen, sourcesForScreen } from "@/lib/config-service";
import { mailForScreen } from "@/lib/mail";
import { MailSettingsForm } from "./mail-settings";
import { OrganizationForm } from "./organization-form";
import { LoginSettings } from "./login-settings";
import { RepositorySettings } from "./repository-settings";
import { EnvironmentSettings } from "./environment-settings";
import { PoliciesForm } from "./policies-form";
import { SessionsForm } from "./sessions-form";
import { CancelRecoveryForm } from "./cancel-recovery-form";

const SECTIONS = [
  ["organization", "Organização"], ["login", "Formas de login"], ["email", "E-mail"], ["repositories", "Repositórios"],
  ["environments", "Ambientes"], ["access", "Regras de acesso"], ["sessions", "Sessões e recuperação"],
] as const;
const LEGACY_SECTION: Record<string, (typeof SECTIONS)[number][0]> = {
  organizacao: "organization", repositorios: "repositories", ambientes: "environments", acesso: "access", sessoes: "sessions",
};

type SectionId = (typeof SECTIONS)[number][0];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requirePermission("settings:manage");
  const { s = "organization" } = await searchParams;
  if (LEGACY_SECTION[s]) redirect(`/admin/settings?s=${LEGACY_SECTION[s]}`);
  const section = s;
  const active: SectionId = SECTIONS.some(([id]) => id === section) ? section as SectionId : "organization";
  const inst = await getInstallation();
  const [owners, { providers, callbacks }, sources, envs, warnings, mail] = await Promise.all([
    prisma.user.findMany({ where: { role: "OWNER" }, select: { githubLogin: true, email: true, status: true } }),
    providersForScreen(), sourcesForScreen(), environmentsForScreen(), affiliationWarnings(), mailForScreen(),
  ]);
  const recoveryOpen = !!inst.recoveryIdentifier && !!inst.recoveryExpiresAt && inst.recoveryExpiresAt > new Date();
  const publicBase = (mail?.publicBaseUrl ?? process.env.AUTH_URL ?? "").replace(/\/+$/, "");

  return (
    <div className="max-w-6xl space-y-6">
      <header data-tour="settings-header">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted">
          Instalado em {inst.installedAt?.toLocaleDateString("pt-BR") ?? "—"}. OWNERs: {owners.map((o) => o.githubLogin ? `@${o.githubLogin}` : o.email).join(", ")}.
          {owners.length < 2 && " Recomendado ter pelo menos dois OWNERs ativos."}
        </p>
      </header>

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <nav
          aria-label="Seções"
          data-tour="settings-tabs"
          className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:pb-0"
        >
          {SECTIONS.map(([id, label]) => (
            <Link
              key={id}
              href={`?s=${id}`}
              aria-current={active === id ? "page" : undefined}
              className={`shrink-0 rounded-control px-3 py-2 text-sm transition md:w-full ${active === id ? "bg-accent/12 font-semibold text-accent" : "text-ink/80 hover:bg-paper hover:text-ink"}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div data-tour="settings-section" className="min-w-0 flex-1 space-y-4">
          {warnings.length > 0 && (active === "login" || active === "organization") && (
            <div className="space-y-2">{warnings.map((w) => <Notice key={w} tone="wait">{w}</Notice>)}</div>
          )}

          {active === "organization" && (
            <Panel>
              <OrganizationForm orgName={inst.orgName ?? ""} orgSlug={inst.orgSlug ?? ""} orgs={inst.allowedGithubOrgs} domains={inst.allowedEmailDomains} hasGithub={providers.some((p) => p.type === "GITHUB")} />
              <p className="mt-4 text-sm text-muted">Título e cores do sistema ficam em <Link href="/admin/appearance" className="text-accent">Aparência</Link>.</p>
            </Panel>
          )}
          {active === "login" && (
            <LoginSettings providers={providers.map((p) => ({ ...p, clientSecret: "" }))} callbacks={callbacks} />
          )}
          {active === "email" && (
            <Panel>
              <MailSettingsForm key={mail ? "on" : "off"} initial={mail ? { ...mail, password: "" } : null} />
            </Panel>
          )}
          {active === "repositories" && (
            <RepositorySettings
              sources={sources.map((x) => ({ ...x, token: "" }))}
              webhookUrl={publicBase ? `${publicBase}/api/v1/hooks` : ""}
              hasSyncToken={!!inst.syncTokenHash}
            />
          )}
          {active === "environments" && <EnvironmentSettings envs={envs} />}
          {active === "access" && (
            <Panel>
              <PoliciesForm auto={inst.autoApproveOrgMembers} outsider={inst.outsiderPolicy} session={inst.sessionMaxAgeHours} recheck={inst.membershipRecheckHours} ttl={inst.accessRequestTtlDays} />
            </Panel>
          )}
          {active === "sessions" && (
            <div className="space-y-4">
              {recoveryOpen && (
                <Notice tone="wait" title="Recuperação de OWNER em aberto">
                  <p>O primeiro login de <strong>{inst.recoveryIdentifier}</strong> até {inst.recoveryExpiresAt!.toLocaleString("pt-BR")} vira OWNER. Se você não abriu essa janela pelo servidor, cancele e revise quem tem acesso de linha de comando ao servidor.</p>
                  <div className="mt-3"><CancelRecoveryForm /></div>
                </Notice>
              )}
              <SessionsForm />
              <p className="text-sm text-muted">
                Se todos os OWNERs perderem acesso, no servidor rode <code className="font-mono text-ink">pnpm admin:recover --login usuario-ou-email</code>.
                Com login por e-mail e senha, acrescente <code className="font-mono text-ink">--reset-password</code> para gerar um link de nova senha.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
