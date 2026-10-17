import { can, type Subject } from "./rbac";

// Achado N1 da auditoria de UX de 02/10/2026: o item "Serviços e repositórios" abria uma página
// chamada "Serviços e vínculos", e "Vínculos" e "Tokens" eram abas que o menu não mostrava. Agora
// vale uma regra só: item do menu = título da página. Os 12 destinos moram em 4 grupos (achado N3),
// na ordem em que a barra lateral os desenha: Explorar (ler), Cadastros (o que a pessoa mantém),
// Pessoas e Sistema.
export type HubNavGroup = "explore" | "registry" | "people" | "system";
export type HubNavEntry = { href: string; label: string; visible: (s: Subject) => boolean; badge?: "pendingAccess"; group: HubNavGroup };

/** Ordem dos grupos na barra lateral. */
export const HUB_NAV_GROUPS: readonly HubNavGroup[] = ["explore", "registry", "people", "system"];

export const HUB_NAV_GROUP_LABEL: Record<HubNavGroup, string> = {
  explore: "Explorar",
  registry: "Cadastros",
  people: "Pessoas",
  system: "Sistema",
};

/**
 * Menu do hub, na ordem em que aparece na barra lateral. O tour obrigatório do primeiro
 * acesso não percorre estas telas: ele é um panorama único no Catálogo. Cada item daqui
 * tem o próprio tour, aberto pelo botão ? da tela.
 *
 * A visibilidade de cada item é a MESMA que a página exige: a página usa `visible` como guarda
 * (ver app/(hub)/admin/_registry/guard.ts). Quem vê o item abre a tela; quem não tem a permissão
 * recebe 404. Assim um cadastro só aparece para quem consegue usá-lo de fato, e o tour nunca
 * "obriga" alguém a completar uma tela que não existe para essa pessoa.
 */
export const HUB_NAV: readonly HubNavEntry[] = [
  { href: "/", label: "Catálogo", visible: () => true, group: "explore" },
  { href: "/graph", label: "Mapa de ligações", visible: (s) => can(s, "graph:read"), group: "explore" },
  { href: "/integrations", label: "Integrações externas", visible: () => true, group: "explore" },
  { href: "/admin/services", label: "Serviços", visible: (s) => can(s, "service:create") || can(s, "service:edit"), group: "registry" },
  { href: "/admin/repositories", label: "Repositórios", visible: (s) => can(s, "link:edit"), group: "registry" },
  { href: "/admin/links", label: "Vínculos", visible: (s) => can(s, "link:edit"), group: "registry" },
  { href: "/admin/tokens", label: "Tokens de CI", visible: (s) => can(s, "token:manage"), group: "registry" },
  { href: "/admin/teams", label: "Times", visible: (s) => can(s, "team:manage"), group: "registry" },
  { href: "/admin/people", label: "Pessoas e acesso", visible: (s) => can(s, "access:decide") || can(s, "user:manage"), badge: "pendingAccess", group: "people" },
  { href: "/admin/permissions", label: "Permissões", visible: (s) => can(s, "roles:manage"), group: "people" },
  { href: "/admin/audit", label: "Auditoria", visible: (s) => can(s, "audit:read"), group: "system" },
  // A aparência (marca) virou uma aba de Configurações (achado N3): a página abre para quem
  // administra a instalação OU só a marca, e cada aba pede a própria permissão.
  { href: "/admin/settings", label: "Configurações", visible: (s) => can(s, "settings:manage") || can(s, "appearance:manage"), group: "system" },
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

/** Valor de ?t= de /admin/catalog (inclusive os de antes da tradução para inglês) → página que o substituiu. */
const LEGACY_CATALOG_TAB_HREF: Record<string, string> = {
  services: "/admin/services",
  servicos: "/admin/services",
  repositories: "/admin/repositories",
  repositorios: "/admin/repositories",
  links: "/admin/links",
  vinculos: "/admin/links",
  tokens: "/admin/tokens",
};

/**
 * Achado N1 da auditoria de UX de 02/10/2026: /admin/catalog (4 abas) virou 4 páginas. O endereço
 * antigo continua valendo: devolve a página nova para os parâmetros da URL velha, mantendo os
 * outros parâmetros (página, tamanho, from, fromKind). Sem ?t=, um link do mapa (?from=…) cai em
 * Vínculos e o resto em Serviços, que era a aba padrão. O #fragmento não chega ao servidor: o
 * navegador o mantém no redirecionamento.
 */
export function legacyCatalogAdminHref(params: Record<string, string | string[] | undefined>): string {
  const value = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const tab = value(params.t);
  const target = (tab !== undefined ? LEGACY_CATALOG_TAB_HREF[tab] : undefined) ?? (value(params.from) ? "/admin/links" : "/admin/services");
  const rest = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    const v = value(raw);
    if (key !== "t" && v) rest.set(key, v);
  }
  const query = rest.toString();
  return query ? `${target}?${query}` : target;
}
