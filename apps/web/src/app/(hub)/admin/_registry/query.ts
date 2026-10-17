import { prisma } from "@api-hub/db";
import { LINK_KIND_LABEL, canManageService, pageInfo, paginate, type LinkKind, type PageRequest } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";

/**
 * Serviços que a pessoa mantém (ativos e arquivados). A regra "meu time" mora em canManageService
 * (core): o filtro roda em memória e a página recorta com paginate(), como o catálogo faz com
 * permissões que dependem do time (RN-22). Os formulários de vínculo e token precisam da lista inteira.
 */
export async function managedServices(actor: CurrentUser) {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" }, include: { ownerTeam: { select: { name: true } } } });
  return services.filter((s) => canManageService(actor, s));
}

/** Times que a pessoa pode escolher como responsáveis: todos com service:edit_any, senão só os dela (RN-22). */
export async function teamsToOwn(actor: CurrentUser) {
  const teams = await prisma.team.findMany({
    where: actor.permissions.has("service:edit_any") ? {} : { id: { in: actor.teamIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return teams.map((t) => ({ id: t.id, label: t.name }));
}

/** Uma página de repositórios, paginada no banco. */
export async function repositoriesPage(request: PageRequest) {
  const info = pageInfo(await prisma.repository.count(), request);
  const rows = await prisma.repository.findMany({ orderBy: { fullName: "asc" }, skip: info.skip, take: info.take });
  return { rows, info };
}

export async function repositoryOptions() {
  const repositories = await prisma.repository.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } });
  return repositories.map((r) => ({ id: r.id, label: r.fullName }));
}

/** Serviços ativos de qualquer time: o "Para" de um vínculo pode ser de outra equipe (RN-22). */
export async function activeServiceOptions() {
  const services = await prisma.service.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return services.map((s) => ({ id: s.id, label: s.name }));
}

type Origin = "spec" | "manual" | "repository";
export type LinkItem = { id: string; type: "service" | "repository"; from: string; relation: string; to: string; origin: Origin };

/**
 * Vínculos serviço→serviço e repositório→repositório numa lista só, em ordem alfabética de
 * origem e destino — ordem estável, para a paginação não repetir nem pular vínculos.
 */
export async function linksPage(request: PageRequest) {
  const [deps, repoLinks] = await Promise.all([
    prisma.serviceDependency.findMany({ include: { from: { select: { name: true } }, to: { select: { name: true } } } }),
    prisma.repositoryLink.findMany({ include: { from: { select: { fullName: true } }, to: { select: { fullName: true } } } }),
  ]);
  const items: LinkItem[] = [
    ...deps.map((d) => ({ id: d.id, type: "service" as const, from: d.from.name, relation: LINK_KIND_LABEL[d.kind as LinkKind], to: d.to.name, origin: (d.detected ? "spec" : "manual") as Origin })),
    ...repoLinks.map((l) => ({ id: l.id, type: "repository" as const, from: l.from.fullName, relation: LINK_KIND_LABEL[l.kind as LinkKind], to: l.to.fullName, origin: "repository" as Origin })),
  ].sort((a, b) => a.from.localeCompare(b.from, "pt-BR") || a.to.localeCompare(b.to, "pt-BR"));
  return paginate(items, request);
}

/** Tokens ativos dos serviços que a pessoa mantém: quem não pode revogar um token também não o vê. */
export async function tokensPage(actor: CurrentUser, request: PageRequest) {
  const tokens = await prisma.serviceToken.findMany({
    where: { revokedAt: null },
    include: { service: { select: { name: true, ownerTeamId: true } } },
    orderBy: { createdAt: "desc" },
  });
  return paginate(tokens.filter((t) => canManageService(actor, t.service)), request);
}

/** Provedores de código que a instalação configurou (Configurações → Conexões): são as opções de "Onde está" ao cadastrar repositório. */
export async function configuredSourceProviders() {
  const integrations = await prisma.sourceIntegration.findMany({ select: { type: true } });
  return integrations.map((i) => i.type);
}
