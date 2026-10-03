import { can, type Subject } from "./rbac";

export type HubNavGroup = "catalog" | "admin";
export type HubNavEntry = { href: string; label: string; visible: (s: Subject) => boolean; badge?: "pendingAccess"; group: HubNavGroup };

/**
 * Menu do hub, na ordem em que aparece na barra lateral. O tour obrigatório do primeiro
 * acesso não percorre estas telas: ele é um panorama único no Catálogo. Cada item daqui
 * tem o próprio tour, aberto pelo botão ? da tela.
 *
 * Nota: "/admin/catalog" usa só "link:edit" (a mesma permissão que a página exige via
 * requirePermission), não "service:create" || "link:edit" como o menu usava antes de o tour
 * existir — com a matriz padrão isso não muda nada (MAINTAINER/ADMIN/OWNER têm as duas), mas
 * evita que alguém com só "service:create" numa matriz customizada veja o item no menu e caia
 * num 404 ao abrir — e, com o tour, seja "obrigado" a completar uma tela que não existe para ele.
 */
// Achado da revisão de UX de 28/09/2026: os 10 itens do menu apareciam no mesmo nível,
// misturando uso diário com administração. O agrupamento é lido pela sidebar (NavLinks), que
// insere um divisor entre "catalog" e "admin".
export const HUB_NAV: readonly HubNavEntry[] = [
  { href: "/", label: "Catálogo", visible: () => true, group: "catalog" },
  { href: "/graph", label: "Mapa de ligações", visible: (s) => can(s, "graph:read"), group: "catalog" },
  { href: "/integrations", label: "Integrações externas", visible: () => true, group: "catalog" },
  { href: "/admin/catalog", label: "Serviços e repositórios", visible: (s) => can(s, "link:edit"), group: "admin" },
  { href: "/admin/teams", label: "Times", visible: (s) => can(s, "team:manage"), group: "admin" },
  { href: "/admin/people", label: "Pessoas e acesso", visible: (s) => can(s, "access:decide") || can(s, "user:manage"), badge: "pendingAccess", group: "admin" },
  { href: "/admin/audit", label: "Auditoria", visible: (s) => can(s, "audit:read"), group: "admin" },
  { href: "/admin/permissions", label: "Permissões", visible: (s) => can(s, "roles:manage"), group: "admin" },
  { href: "/admin/appearance", label: "Aparência", visible: (s) => can(s, "appearance:manage"), group: "admin" },
  { href: "/admin/settings", label: "Configurações", visible: (s) => can(s, "settings:manage"), group: "admin" },
];

export function visibleHubNav(s: Subject): HubNavEntry[] {
  return HUB_NAV.filter((e) => e.visible(s));
}

/** O primeiro acesso faz um panorama só, no Catálogo. Não percorre as outras telas do menu. */
export function getMandatoryTourRoutes(_s: Subject): string[] {
  return ["/"];
}

export type MandatoryTourTarget = { route: string; index: number; total: number; isLast: boolean };

/**
 * Tela obrigatória atual do tour, ou null quando o tour já terminou (ou, por segurança,
 * quando a pessoa não tem nenhuma tela visível — não deveria acontecer, mas não trava o app).
 * O índice é limitado ao tamanho da lista atual: se a permissão da pessoa mudou no meio do
 * tour e ela tinha avançado mais do que as telas que ainda vê, ela não fica presa.
 */
export function mandatoryTourTarget(s: Subject, progress: { tourStep: number; tourCompletedAt: Date | null }): MandatoryTourTarget | null {
  if (progress.tourCompletedAt) return null;
  const routes = getMandatoryTourRoutes(s);
  if (routes.length === 0) return null;
  const index = Math.min(Math.max(progress.tourStep, 0), routes.length - 1);
  return { route: routes[index]!, index, total: routes.length, isLast: index === routes.length - 1 };
}
