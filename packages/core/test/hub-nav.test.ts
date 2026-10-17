import { describe, expect, it } from "vitest";
import { buildMatrix } from "../src/rbac";
import { getMandatoryTourRoutes, HUB_NAV, HUB_NAV_GROUPS, HUB_NAV_GROUP_LABEL, legacyCatalogAdminHref, mandatoryTourTarget, visibleHubNav } from "../src/hub-nav";

const matrix = buildMatrix([]);
const subject = (role: keyof typeof matrix) => ({ permissions: matrix[role] });
const only = (...permissions: string[]) => ({ permissions: new Set(permissions) });
const hrefs = (s: { permissions: ReadonlySet<string> }) => visibleHubNav(s).map((e) => e.href);

// Réplica dos guards reais de cada página (o que a página exige antes de renderizar), para garantir
// que o tour obrigatório nunca manda alguém para uma tela que a própria página recusaria.
const PAGE_GUARD: Record<string, (s: { permissions: ReadonlySet<string> }) => boolean> = {
  "/": () => true,
  "/graph": (s) => s.permissions.has("graph:read"),
  "/integrations": () => true,
  "/admin/services": (s) => s.permissions.has("service:create") || s.permissions.has("service:edit"),
  "/admin/repositories": (s) => s.permissions.has("link:edit"),
  "/admin/links": (s) => s.permissions.has("link:edit"),
  "/admin/tokens": (s) => s.permissions.has("token:manage"),
  "/admin/teams": (s) => s.permissions.has("team:manage"),
  "/admin/people": (s) => s.permissions.has("access:decide") || s.permissions.has("user:manage"),
  "/admin/permissions": (s) => s.permissions.has("roles:manage"),
  "/admin/audit": (s) => s.permissions.has("audit:read"),
  "/admin/settings": (s) => s.permissions.has("settings:manage") || s.permissions.has("appearance:manage"),
};

describe("HUB_NAV", () => {
  it("tem 4 grupos, com os rótulos da auditoria, na ordem da barra lateral", () => {
    expect(HUB_NAV_GROUPS.map((g) => HUB_NAV_GROUP_LABEL[g])).toEqual(["Explorar", "Cadastros", "Pessoas", "Sistema"]);
    // A barra lateral desenha um grupo depois do outro: a lista precisa estar agrupada na mesma ordem.
    const groupOrder = HUB_NAV.map((e) => HUB_NAV_GROUPS.indexOf(e.group));
    expect(groupOrder).toEqual([...groupOrder].sort((a, b) => a - b));
    expect(new Set(HUB_NAV.map((e) => e.group))).toEqual(new Set(HUB_NAV_GROUPS));
  });

  it("os itens e os grupos seguem a proposta da auditoria", () => {
    const byGroup = Object.fromEntries(HUB_NAV_GROUPS.map((g) => [g, HUB_NAV.filter((e) => e.group === g).map((e) => `${e.label} ${e.href}`)]));
    expect(byGroup).toEqual({
      explore: ["Catálogo /", "Mapa de ligações /graph", "Integrações externas /integrations"],
      registry: ["Serviços /admin/services", "Repositórios /admin/repositories", "Vínculos /admin/links", "Tokens de CI /admin/tokens", "Times /admin/teams"],
      people: ["Pessoas e acesso /admin/people", "Permissões /admin/permissions"],
      system: ["Auditoria /admin/audit", "Configurações /admin/settings"],
    });
  });

  it("não deixa destino repetido nem a rota antiga de cadastro", () => {
    const all = HUB_NAV.map((e) => e.href);
    expect(new Set(all).size).toBe(all.length);
    expect(all).not.toContain("/admin/catalog");
    expect(all).not.toContain("/admin/appearance");
  });

  it("a visibilidade de cada item é a guarda da página", () => {
    for (const role of ["OWNER", "ADMIN", "MAINTAINER", "VIEWER"] as const) {
      const s = subject(role);
      for (const entry of HUB_NAV) expect(entry.visible(s), `${role} em ${entry.href}`).toBe(PAGE_GUARD[entry.href]!(s));
    }
  });

  it("leitor vê só o grupo Explorar (o mapa depende de graph:read)", () => {
    expect(hrefs(subject("VIEWER"))).toEqual(["/", "/graph", "/integrations"]);
  });

  it("mantenedor vê os cadastros do próprio dia a dia, mas não Times nem Sistema", () => {
    expect(hrefs(subject("MAINTAINER"))).toEqual(["/", "/graph", "/integrations", "/admin/services", "/admin/repositories", "/admin/links", "/admin/tokens"]);
  });

  it("administrador vê tudo, menos Permissões; a aba Aparência mantém Configurações visível", () => {
    const admin = hrefs(subject("ADMIN"));
    expect(admin).not.toContain("/admin/permissions");
    expect(admin).toContain("/admin/settings");
    expect(admin).toContain("/admin/people");
  });

  it("proprietário vê os 12 itens", () => {
    expect(hrefs(subject("OWNER"))).toHaveLength(12);
  });

  it("Serviços aparece para quem cria ou edita serviço, e só para eles", () => {
    expect(hrefs(only("catalog:read", "service:create"))).toContain("/admin/services");
    expect(hrefs(only("catalog:read", "service:edit"))).toContain("/admin/services");
    expect(hrefs(only("catalog:read", "link:edit", "token:manage"))).not.toContain("/admin/services");
  });

  it("Repositórios e Vínculos pedem link:edit; Tokens de CI pedem token:manage", () => {
    const linker = hrefs(only("catalog:read", "link:edit"));
    expect(linker).toContain("/admin/repositories");
    expect(linker).toContain("/admin/links");
    expect(linker).not.toContain("/admin/tokens");
    expect(hrefs(only("catalog:read", "token:manage"))).toEqual(["/", "/integrations", "/admin/tokens"]);
  });

  it("Configurações abre para quem administra a instalação OU só a marca", () => {
    expect(hrefs(only("catalog:read", "settings:manage"))).toContain("/admin/settings");
    expect(hrefs(only("catalog:read", "appearance:manage"))).toContain("/admin/settings");
    expect(hrefs(only("catalog:read", "audit:read"))).not.toContain("/admin/settings");
  });

  it("só Pessoas e acesso carrega o selo de solicitações pendentes", () => {
    expect(HUB_NAV.filter((e) => e.badge).map((e) => e.href)).toEqual(["/admin/people"]);
  });
});

describe("getMandatoryTourRoutes", () => {
  it("é só o Catálogo, para qualquer papel", () => {
    for (const role of ["OWNER", "ADMIN", "MAINTAINER", "VIEWER"] as const) {
      expect(getMandatoryTourRoutes(subject(role))).toEqual(["/"]);
    }
  });

  it("a rota do panorama é uma tela que a página sempre aceita", () => {
    for (const role of ["OWNER", "ADMIN", "MAINTAINER", "VIEWER"] as const) {
      const s = subject(role);
      for (const route of getMandatoryTourRoutes(s)) expect(PAGE_GUARD[route]?.(s)).toBe(true);
    }
  });

  it("começa em / e cabe na ordem do menu", () => {
    const order = HUB_NAV.map((e) => e.href);
    for (const role of ["OWNER", "ADMIN", "MAINTAINER", "VIEWER"] as const) {
      const routes = getMandatoryTourRoutes(subject(role));
      expect(routes[0]).toBe("/");
      let last = -1;
      for (const r of routes) { const i = order.indexOf(r); expect(i).toBeGreaterThan(last); last = i; }
    }
  });
});

describe("mandatoryTourTarget", () => {
  const viewer = subject("VIEWER");

  it("null quando o tour já foi concluído", () => {
    expect(mandatoryTourTarget(viewer, { tourStep: 0, tourCompletedAt: new Date() })).toBeNull();
  });
  it("o panorama no Catálogo quando tourStep é 0", () => {
    expect(mandatoryTourTarget(viewer, { tourStep: 0, tourCompletedAt: null })).toMatchObject({ route: "/", index: 0, total: 1, isLast: true });
  });
  it("continua no Catálogo, como última etapa, quando tourStep passa do fim", () => {
    expect(mandatoryTourTarget(viewer, { tourStep: 99, tourCompletedAt: null })).toMatchObject({ route: "/", index: 0, total: 1, isLast: true });
  });
});

describe("legacyCatalogAdminHref", () => {
  it("cada aba antiga vai para a página nova, inclusive os valores em português", () => {
    expect(legacyCatalogAdminHref({ t: "services" })).toBe("/admin/services");
    expect(legacyCatalogAdminHref({ t: "servicos" })).toBe("/admin/services");
    expect(legacyCatalogAdminHref({ t: "repositories" })).toBe("/admin/repositories");
    expect(legacyCatalogAdminHref({ t: "repositorios" })).toBe("/admin/repositories");
    expect(legacyCatalogAdminHref({ t: "links" })).toBe("/admin/links");
    expect(legacyCatalogAdminHref({ t: "vinculos" })).toBe("/admin/links");
    expect(legacyCatalogAdminHref({ t: "tokens" })).toBe("/admin/tokens");
  });

  it("sem ?t= abre Serviços, que era a aba padrão", () => {
    expect(legacyCatalogAdminHref({})).toBe("/admin/services");
    expect(legacyCatalogAdminHref({ t: "aba-que-nao-existe" })).toBe("/admin/services");
  });

  it("mantém os outros parâmetros e descarta o ?t=", () => {
    expect(legacyCatalogAdminHref({ t: "tokens", page: "2", size: "20" })).toBe("/admin/tokens?page=2&size=20");
    expect(legacyCatalogAdminHref({ t: "links", from: "svc_1", fromKind: "service" })).toBe("/admin/links?from=svc_1&fromKind=service");
  });

  it("um link do mapa sem ?t= mas com from= cai em Vínculos", () => {
    expect(legacyCatalogAdminHref({ from: "repo_9", fromKind: "repository" })).toBe("/admin/links?from=repo_9&fromKind=repository");
  });

  it("aceita parâmetro repetido (usa o primeiro) e ignora vazio", () => {
    expect(legacyCatalogAdminHref({ t: ["vinculos", "tokens"], page: "" })).toBe("/admin/links");
  });
});
