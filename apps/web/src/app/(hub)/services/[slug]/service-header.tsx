import Link from "next/link";
import { LIFECYCLE_LABEL, SPEC_SOURCE_LABEL, personLabel, relativeTime } from "@api-hub/core";
import { Badge, LinkButton } from "@/components/ui";
import { Breadcrumb } from "@/components/breadcrumb";
import { TagList } from "@/components/tag-list";
import type { ServiceDetail } from "./types";

/**
 * Cabeçalho da página do serviço: nome/situação, time, repositórios e origem da spec.
 * Só apresenta o que já veio carregado em `service` — nenhuma consulta própria aqui.
 *
 * - `draft`: o checklist de próximos passos ainda tem pendência (selo "Rascunho", achado M2).
 * - `canLink`: a pessoa abre "Vínculos"; sem isso o "Vincular" some em vez de levar a um 404.
 */
export function ServiceHeader({ service, editable, draft, canLink }: { service: ServiceDetail; editable: boolean; draft: boolean; canLink: boolean }) {
  const lifecycle = LIFECYCLE_LABEL[service.lifecycle] ?? service.lifecycle;
  return (
    <header data-tour="service-header" className="rounded-panel border border-line bg-sheet px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Achado N2 da auditoria de UX de 02/10/2026: trilha no lugar do rótulo solto "Catálogo". */}
          <Breadcrumb items={[{ label: "Catálogo", href: "/" }, { label: service.name }]} />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{service.name}</h1>
            <Badge tone={service.lifecycle === "deprecated" ? "danger" : service.lifecycle === "production" ? "accent" : "neutral"}>{lifecycle}</Badge>
            {draft && <Badge tone="wait">Rascunho</Badge>}
            {service.archivedAt && <Badge tone="wait">Arquivado</Badge>}
          </div>
          {service.description && <p className="mt-2 max-w-prose text-sm text-muted">{service.description}</p>}
          {/* Recado da frente do Catálogo: as tags saíram da lista (linha compacta) e vivem aqui; cada uma leva ao filtro ?tag= do Catálogo. */}
          <TagList tags={service.tags} hrefFor={(t) => `/?tag=${encodeURIComponent(t)}`} />
        </div>
        {editable && <LinkButton href={`/services/${service.slug}/edit`} tone="quiet">Editar serviço</LinkButton>}
      </div>
      <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted">Time</dt>
          <dd className="mt-0.5">{service.ownerTeam?.name ?? "Sem responsável"}</dd>
          {service.ownerTeam && service.ownerTeam.members.length > 0 && (
            <dd className="truncate text-xs text-muted">{service.ownerTeam.members.map((m) => personLabel(m.user)).join(", ")}</dd>
          )}
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">Repositórios</dt>
          <dd className="mt-0.5">
            {service.repositories.length === 0 ? (
              // Contrato com a tela de Vínculos: abre o modal "Novo vínculo" com este serviço no "De".
              editable && canLink ? <Link href={`/admin/links?from=${service.id}&fromKind=service#new-link`} className="text-accent">Vincular</Link> : <span className="text-muted">Nenhum</span>
            ) : service.repositories.map((r) => (
              <a key={r.repositoryId} className="mr-3 hover:text-accent" href={r.repository.url} target="_blank" rel="noreferrer">{r.repository.fullName}</a>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Origem da spec</dt>
          <dd className="mt-0.5">{SPEC_SOURCE_LABEL[service.specSource]}</dd>
          {service.lastSyncAt && <dd className="text-xs text-muted" title={service.lastSyncAt.toLocaleString("pt-BR")}>Sincronizada {relativeTime(service.lastSyncAt)}</dd>}
          {service.lastSyncError && <dd className="text-xs text-danger">{service.lastSyncError}</dd>}
        </div>
      </dl>
    </header>
  );
}
