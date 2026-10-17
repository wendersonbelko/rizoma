import { notFound, redirect } from "next/navigation";
import { prisma } from "@api-hub/db";
import { can, canManageService, canSeeService, diffSpecs, readChangeSummary, summarizeDiff } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { getEnvironments, getTheme } from "@/lib/install";
import { EnvSwitch } from "@/components/env";
import { Notice } from "@/components/ui";
import { ServiceHeader } from "./service-header";
import { ServiceChecklist } from "./service-checklist";
import { loadChecklist } from "./query";
import { ServiceTabsNav } from "./service-tabs-nav";
import { CompareSelect } from "./compare-select";
import { ApiTab } from "./tabs/api-tab";
import { DocsTab } from "./tabs/docs-tab";
import { IntegrationsTab } from "./tabs/integrations-tab";
import { EnvVarsTab } from "./tabs/env-vars-tab";
import { SettingsTab } from "./tabs/settings-tab";
import { TABS, type Search, type Tab } from "./types";

/**
 * Página do serviço: só resolve permissão/ambiente/aba e delega a renderização — cada aba
 * (apps/web/src/app/(hub)/services/[slug]/tabs/*) busca seus próprios dados e não sabe nada
 * das outras. O cabeçalho e a navegação de abas também são peças à parte.
 */
export default async function ServicePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Search> }) {
  const user = await requirePermission("catalog:read");
  const { slug } = await params;
  const sp = await searchParams;
  const envs = await getEnvironments();
  const theme = await getTheme();

  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      ownerTeam: { include: { members: { include: { user: { select: { githubLogin: true, email: true, name: true } } } } } },
      repositories: { include: { repository: true } },
      outgoing: { include: { to: { select: { slug: true, name: true } } } },
      incoming: { include: { from: { select: { slug: true, name: true } } } },
    },
  });
  // RN-30: serviço restrito não existe para quem está fora; arquivado só para quem pode restaurar.
  if (!service || !canSeeService(user, service)) notFound();
  if (service.archivedAt && !canManageService(user, service)) notFound();

  const env = envs.find((e) => e.slug === sp.env) ?? envs.find((e) => e.isProduction) ?? envs[0]!;
  const tabAlias: Record<string, Tab> = { regras: "rules", integracoes: "integrations", variaveis: "variables" };
  const requestedTab = sp.tab ? (tabAlias[sp.tab] ?? sp.tab) : undefined;
  const tab: Tab = (TABS.some((t) => t.id === requestedTab) ? requestedTab : "api") as Tab;
  const hrefFor = (patch: Partial<Search>) => {
    // Sem o filtro, um valor undefined no patch (ex.: doc: sp.doc) virava "doc=undefined" na URL.
    const q = new URLSearchParams(Object.entries({ env: env.slug, tab, ...patch }).filter((e): e is [string, string] => !!e[1]));
    return `/services/${slug}?${q}`;
  };
  // D2: um ?tab= ou ?env= inválido (link salvo/compartilhado errado) mostrava a aba/ambiente
  // padrão sem avisar; agora a URL é corrigida para refletir o que está sendo exibido.
  if (sp.tab && sp.tab !== tab) redirect(hrefFor({ tab }));
  if (sp.env && !envs.some((e) => e.slug === sp.env)) redirect(hrefFor({ env: env.slug }));
  const editable = canManageService(user, service);
  // Achado M2 da auditoria de UX de 02/10/2026: o checklist de próximos passos é de quem gerencia o
  // serviço e some quando não falta nada (ou quando o serviço está arquivado).
  const checklist = editable && !service.archivedAt ? await loadChecklist(user, service) : null;
  const draft = checklist !== null && checklist.pending > 0;
  const latest = await prisma.apiSpec.findFirst({
    where: { serviceId: service.id, environmentId: env.id, isLatest: true },
    select: { version: true, changeSummary: true },
  });
  const summary = readChangeSummary(latest?.changeSummary);
  const kindLabel = { added: "novo", removed: "removido", changed: "alterado", deprecated: "descontinuado" } as const;
  const other = envs.find((e) => e.slug === sp.compare && e.id !== env.id);
  const compared = other ? await Promise.all([
    prisma.apiSpec.findFirst({ where: { serviceId: service.id, environmentId: env.id, isLatest: true }, select: { content: true, version: true } }),
    prisma.apiSpec.findFirst({ where: { serviceId: service.id, environmentId: other.id, isLatest: true }, select: { content: true, version: true } }),
  ]) : null;
  const envDiff = compared?.[0] && compared[1] ? summarizeDiff(diffSpecs(compared[1].content, compared[0].content)) : null;

  return (
    <div className="space-y-6">
      <ServiceHeader service={service} editable={editable} draft={draft} canLink={can(user, "link:edit")} />

      {draft && <ServiceChecklist checklist={checklist} />}

      <div data-tour="service-env" className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-sheet px-3 py-2">
        <EnvSwitch envs={envs} current={env.slug} hrefFor={(s) => hrefFor({ env: s, v: "", doc: sp.doc, compare: "" })} />
        <CompareSelect
          value={other ? other.slug : ""}
          options={[
            { slug: "", name: "Só este ambiente", href: hrefFor({ compare: "" }) },
            ...envs.filter((e) => e.slug !== env.slug).map((e) => ({ slug: e.slug, name: e.name, href: hrefFor({ compare: e.slug }) })),
          ]}
        />
      </div>

      {summary && (summary.added + summary.removed + summary.changed + summary.deprecated > 0) && (
        <Notice tone={summary.breaking ? "wait" : "info"} title={summary.breaking ? `A versão ${latest?.version} removeu endpoints` : `O que mudou na versão ${latest?.version}`}>
          <p>{summary.added} novos, {summary.removed} removidos, {summary.changed} alterados, {summary.deprecated} descontinuados.</p>
          <ul className="mt-1 list-disc pl-5">
            {summary.sample.map((c) => <li key={`${c.kind}-${c.method}-${c.path}`}><code className="font-mono">{c.method} {c.path}</code> {kindLabel[c.kind]}</li>)}
          </ul>
        </Notice>
      )}

      {other && (
        envDiff ? (
          <Notice tone={envDiff.breaking ? "wait" : "info"} title={`${env.name} em relação a ${other.name}`}>
            <p>{envDiff.added} novos, {envDiff.removed} removidos, {envDiff.changed} alterados, {envDiff.deprecated} descontinuados.</p>
            <ul className="mt-1 list-disc pl-5">
              {envDiff.sample.map((c) => <li key={`${c.kind}-${c.method}-${c.path}`}><code className="font-mono">{c.method} {c.path}</code> {kindLabel[c.kind]}</li>)}
            </ul>
          </Notice>
        ) : <Notice>Os dois ambientes precisam ter spec publicada para comparar.</Notice>
      )}

      <ServiceTabsNav active={tab} hrefFor={hrefFor} />

      {tab === "api" && <ApiTab user={user} service={service} env={env} selectedVersionId={sp.v} dark={theme.dark} hrefFor={hrefFor} />}
      {tab === "rules" && <DocsTab user={user} service={service} slug={slug} sp={sp} hrefFor={hrefFor} />}
      {tab === "integrations" && <IntegrationsTab user={user} service={service} env={env} envs={envs} params={sp} />}
      {tab === "variables" && <EnvVarsTab user={user} service={service} env={env} envs={envs} editingKey={sp.var} slug={slug} hrefFor={hrefFor} params={sp} />}
      {tab === "config" && <SettingsTab user={user} service={service} env={env} />}
    </div>
  );
}
