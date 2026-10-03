import { describe, expect, it } from "vitest";
import { buildMatrix } from "../src/rbac";
import { getMandatoryTourRoutes, HUB_NAV, mandatoryTourTarget } from "../src/hub-nav";

const matrix = buildMatrix([]);
const subject = (role: keyof typeof matrix) => ({ permissions: matrix[role] });

// Réplica dos guards reais de cada página (o que `requirePermission(...)` exige), para garantir
// que o tour obrigatório nunca manda alguém para uma tela que a própria página recusaria.
const PAGE_GUARD: Record<string, (s: { permissions: ReadonlySet<string> }) => boolean> = {
  "/": () => true,
  "/graph": (s) => s.permissions.has("graph:read"),
  "/integrations": () => true,
  "/admin/catalog": (s) => s.permissions.has("link:edit"),
  "/admin/teams": (s) => s.permissions.has("team:manage"),
  "/admin/people": (s) => s.permissions.has("access:decide") || s.permissions.has("user:manage"),
  "/admin/audit": (s) => s.permissions.has("audit:read"),
  "/admin/permissions": (s) => s.permissions.has("roles:manage"),
  "/admin/appearance": (s) => s.permissions.has("appearance:manage"),
  "/admin/settings": (s) => s.permissions.has("settings:manage"),
};

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
