import { redirect } from "next/navigation";
import { prisma } from "@api-hub/db";
import { can, canManageService, paginate, readPageRequest, type QueryParams } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { docUrl } from "@/lib/links";
import { getEnvironments } from "@/lib/install";
import { githubTokenSource } from "@/lib/github-token";
import { Pagination } from "@/components/pagination";
import type { Noun } from "@/components/pagination-bar";
import { Section } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { TabNav } from "@/components/tab-nav";
import { LinkForm } from "./forms/link-form";
import { RepositoryForm } from "./forms/repository-form";
import { TokenForm } from "./forms/token-form";
import { ServiceWizard } from "./service-wizard";
import { ServicesTable } from "./services-table";
import { RepositoriesTable } from "./repositories-table";
import { LinksTable, linkItems } from "./links-table";
import { TokensTable } from "./tokens-table";

// Revisão de UX: cada assunto numa aba. A lista fica na tela; criar abre um modal.
const SECTIONS = [
  ["services", "Serviços"], ["repositories", "Repositórios"], ["links", "Vínculos"], ["tokens", "Tokens"],
] as const;
const LEGACY_TAB: Record<string, (typeof SECTIONS)[number][0]> = { servicos: "services", repositorios: "repositories", vinculos: "links" };

export default async function CatalogAdminPage({ searchParams }: { searchParams: Promise<QueryParams & { t?: string; from?: string; fromKind?: string }> }) {
  const actor = await requirePermission("link:edit");
  const sp = await searchParams;
  if (sp.t && LEGACY_TAB[sp.t]) {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      const v = Array.isArray(value) ? value[0] : value;
      if (!v) continue;
      p.set(key, key === "t" ? LEGACY_TAB[sp.t]! : v);
    }
    redirect(`/admin/catalog?${p}`);
  }
  const fromId = typeof sp.from === "string" ? sp.from : undefined;
  const fromKind = sp.fromKind === "service" || sp.fromKind === "repository" ? sp.fromKind : undefined;
  const requested = sp.t ?? "services";
  const t = SECTIONS.some(([id]) => id === requested) ? requested : "services";
  // Uma tabela por aba: todas usam ?page=/?size=, e trocar de aba volta para a página 1.
  const request = readPageRequest(sp);
  const [services, repositories, teams, deps, repoLinks, tokens, envs, githubToken] = await Promise.all([
    prisma.service.findMany({ orderBy: { name: "asc" }, include: { ownerTeam: { select: { name: true } } } }),
    prisma.repository.findMany({ orderBy: { fullName: "asc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceDependency.findMany({ include: { from: true, to: true } }),
    prisma.repositoryLink.findMany({ include: { from: true, to: true } }),
    prisma.serviceToken.findMany({ where: { revokedAt: null }, include: { service: true }, orderBy: { createdAt: "desc" } }),
    getEnvironments(),
    githubTokenSource(actor.id),
  ]);
  const mine = services.filter((s) => canManageService(actor, s));
  const manageable = mine.filter((s) => !s.archivedAt);
  const myTeams = actor.permissions.has("service:edit_any") ? teams : teams.filter((t) => actor.teamIds.includes(t.id));
  const sourceTypes = (await prisma.sourceIntegration.findMany({ select: { type: true } })).map((x) => x.type);
  // As listas inteiras já estão carregadas para os formulários; a tabela mostra uma página delas.
  const pageOf = <T,>(items: readonly T[], noun: Noun) => {
    const { items: rows, info } = paginate(items, request);
    return { rows, pagination: <Pagination info={info} noun={noun} params={sp} /> };
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Serviços e vínculos</h1>

      <TabNav label="Seções" tour="catalog-admin-tabs" active={t} items={SECTIONS.map(([id, label]) => ({ id, label, href: `?t=${id}` }))} />

      {t === "services" && (
        <div className="space-y-8">
          <Section
            title="Serviços que você mantém"
            description="Inclui os arquivados, que só você e quem administra o hub enxerga."
            tour="catalog-admin-mine"
            action={can(actor, "service:create") ? (
              <FormModal id="new-service" tour="catalog-admin-new-service" label="Novo serviço" title="Novo serviço" wide tone="primary">
                <ServiceWizard
                  teams={myTeams.map((t) => ({ id: t.id, label: t.name }))}
                  requireTeam={!actor.permissions.has("service:edit_any")}
                  repositories={repositories.map((r) => ({ id: r.id, label: r.fullName }))}
                  providers={sourceTypes}
                  githubToken={githubToken}
                  canConfigureSources={can(actor, "settings:manage")}
                  envs={envs.map((e) => ({ id: e.id, name: e.name, isProduction: e.isProduction }))}
                  canPublishSpec={can(actor, "spec:publish")}
                />
              </FormModal>
            ) : undefined}
          >
            <ServicesTable {...pageOf(mine, ["serviço", "serviços"])} />
          </Section>
        </div>
      )}

      {t === "repositories" && (
        <div className="space-y-8">
          <Section
            title="Repositórios cadastrados"
            action={
              <FormModal label="Novo repositório" title="Novo repositório" tone="primary">
                <p className="mb-4 text-sm text-muted">Cadastre os repositórios de código para ligá-los aos serviços.</p>
                <RepositoryForm providers={sourceTypes} />
              </FormModal>
            }
          >
            <RepositoriesTable {...pageOf(repositories, ["repositório", "repositórios"])} />
          </Section>
        </div>
      )}

      {t === "links" && (
        <div className="space-y-8">
          <Section
            title="Vínculos cadastrados"
            action={
              <FormModal id="new-link" label="Novo vínculo" title="Novo vínculo" wide tone="primary">
                <p className="mb-4 text-sm text-muted">Um vínculo registra que um serviço ou repositório depende de outro. Os vínculos alimentam o Mapa de ligações.</p>
                <LinkForm
                  services={manageable.map((s) => ({ id: s.id, label: s.name }))}
                  targets={services.filter((s) => !s.archivedAt).map((s) => ({ id: s.id, label: s.name }))}
                  repositories={repositories.map((r) => ({ id: r.id, label: r.fullName }))}
                  start={fromId && fromKind ? { id: fromId, kind: fromKind } : undefined}
                />
              </FormModal>
            }
          >
            <LinksTable {...pageOf(linkItems(deps, repoLinks), ["vínculo", "vínculos"])} />
          </Section>
        </div>
      )}

      {t === "tokens" && (
        <div className="space-y-8">
          <Section
            title="Tokens ativos"
            action={
              <FormModal id="tokens" label="Novo token" title="Novo token de publicação (CI)" wide tone="primary">
                <p className="mb-4 text-sm text-muted">
                  O pipeline de CI (GitHub Actions, GitLab CI…) usa o token para enviar a spec — o arquivo OpenAPI/Swagger que descreve a
                  API — a cada deploy. O token aparece uma única vez; guarde-o como segredo do repositório.{" "}
                  <a href={docUrl("receitas/publicar-pelo-github-actions")} target="_blank" rel="noreferrer" className="text-accent underline">
                    Como configurar o CI ↗
                  </a>
                </p>
                <TokenForm services={manageable.map((s) => ({ id: s.id, label: s.name }))} />
              </FormModal>
            }
          >
            <TokensTable {...pageOf(tokens, ["token", "tokens"])} />
          </Section>
        </div>
      )}
    </div>
  );
}
