import { prisma } from "@api-hub/db";
import { can, canSeeService, parseFocusScope, personLabel } from "@api-hub/core";
import type { GraphInput } from "@api-hub/core/graph";
import { requirePermission } from "@/lib/guards";
import { GraphView } from "./graph-view";

export default async function GraphPage({ searchParams }: { searchParams: Promise<{ focus?: string; depth?: string }> }) {
  const user = await requirePermission("graph:read");
  const { focus, depth } = await searchParams;

  const [services, repositories, teams, people, serviceDeps, repoLinks, serviceRepos, resources, serviceResources] = await Promise.all([
    prisma.service.findMany({ where: { archivedAt: null }, select: { id: true, slug: true, name: true, ownerTeamId: true, lifecycle: true, visibility: true, kind: true } }),
    prisma.repository.findMany({ select: { id: true, fullName: true, url: true } }),
    prisma.team.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { status: "ACTIVE", teams: { some: {} } }, select: { id: true, name: true, email: true, githubLogin: true, teams: { select: { teamId: true } } } }),
    prisma.serviceDependency.findMany({ select: { id: true, fromServiceId: true, toServiceId: true, kind: true, protocol: true } }),
    prisma.repositoryLink.findMany({ select: { id: true, fromRepoId: true, toRepoId: true, kind: true } }),
    prisma.serviceRepository.findMany({ select: { serviceId: true, repositoryId: true, role: true } }),
    prisma.externalResource.findMany({ select: { id: true, slug: true, name: true, kind: true } }),
    prisma.serviceResource.findMany({ select: { id: true, serviceId: true, resourceId: true, relation: true } }),
  ]);

  // RN-30 também vale para o mapa: serviços fechados somem com as arestas.
  const visible = services.filter((s) => canSeeService(user, s));
  const ids = new Set(visible.map((s) => s.id));
  const canEdit = can(user, "link:edit");

  const input: GraphInput = {
    services: visible.map((s) => ({ ...s, systemKind: s.kind })),
    repositories,
    teams,
    people: people.map((p) => ({ id: p.id, name: personLabel(p, "Pessoa sem nome"), teamIds: p.teams.map((t) => t.teamId) })),
    serviceDeps: serviceDeps.filter((d) => ids.has(d.fromServiceId) && ids.has(d.toServiceId)),
    repoLinks,
    serviceRepos: serviceRepos.filter((r) => ids.has(r.serviceId)),
    resources,
    serviceResources: serviceResources.filter((r) => ids.has(r.serviceId)),
  };

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[560px] flex-col gap-3">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Mapa de ligações</h1>
        <p className="text-sm text-muted">Um clique troca o foco; duplo clique abre o item. O que está fora do foco fica esmaecido, não some.</p>
      </header>
      <GraphView input={input} initialFocus={focus} initialScope={parseFocusScope(depth)} canEdit={canEdit} />
    </div>
  );
}
