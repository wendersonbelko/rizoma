import { describe, expect, it } from "vitest";
import { buildMatrix, can, canChangeRole, canManageService, canSeeService, catalogVisibility, defaultSubject, matchesCatalogVisibility, validateMatrixChange, type Permission } from "../src/rbac";

describe("permissões", () => {
  it("padrão: viewer só lê", () => {
    expect(can(defaultSubject("VIEWER"), "catalog:read")).toBe(true);
    expect(can(defaultSubject("VIEWER"), "service:create")).toBe(false);
  });
  it("matriz do banco substitui o padrão, mas OWNER e obrigatórias ficam", () => {
    const m = buildMatrix([{ role: "VIEWER", permission: "docs:edit" }]);
    expect([...m.VIEWER].sort()).toEqual(["catalog:read", "docs:edit"]);
    expect(m.OWNER.has("roles:manage")).toBe(true);
    expect(m.ADMIN.size).toBe(1);
  });
  it("não aceita permissão administrativa fora de ADMIN nem tirar o catálogo", () => {
    expect(validateMatrixChange("MAINTAINER", ["catalog:read", "user:manage"])[0]).toMatch(/ADMIN/);
    expect(validateMatrixChange("VIEWER", ["graph:read"])[0]).toMatch(/obrigatório/);
    expect(validateMatrixChange("OWNER", ["catalog:read"])[0]).toMatch(/OWNER/);
    expect(validateMatrixChange("ADMIN", ["catalog:read", "roles:manage"])).toEqual([]);
  });
  it("editar serviço exige o time, salvo service:edit_any", () => {
    const dev = defaultSubject("MAINTAINER", ["t1"]);
    expect(canManageService(dev, { ownerTeamId: "t1" })).toBe(true);
    expect(canManageService(dev, { ownerTeamId: "t2" })).toBe(false);
    expect(canManageService(defaultSubject("ADMIN"), { ownerTeamId: "t2" })).toBe(true);
  });
  it("serviço restrito só para o time ou quem lê privados", () => {
    const svc = { visibility: "TEAM" as const, ownerTeamId: "t1" };
    expect(canSeeService(defaultSubject("VIEWER", ["t2"]), svc)).toBe(false);
    expect(canSeeService(defaultSubject("VIEWER", ["t1"]), svc)).toBe(true);
    expect(canSeeService(defaultSubject("ADMIN"), svc)).toBe(true);
  });
  it("o filtro da listagem concorda com canSeeService em papel, time e visibilidade", () => {
    const roles = ["OWNER", "ADMIN", "MAINTAINER", "VIEWER"] as const;
    const teams = [[], ["t1"], ["t1", "t2"]];
    const services = [
      { visibility: "ORG" as const, ownerTeamId: null },
      { visibility: "ORG" as const, ownerTeamId: "t1" },
      { visibility: "TEAM" as const, ownerTeamId: "t1" },
      { visibility: "TEAM" as const, ownerTeamId: "t2" },
      { visibility: "TEAM" as const, ownerTeamId: null },
    ];
    for (const role of roles) {
      for (const teamIds of teams) {
        const actor = defaultSubject(role, teamIds);
        for (const service of services) {
          expect(matchesCatalogVisibility(catalogVisibility(actor), service)).toBe(canSeeService(actor, service));
        }
        const blind = { ...actor, permissions: new Set<Permission>(["graph:read"]) };
        for (const service of services) {
          expect(matchesCatalogVisibility(catalogVisibility(blind), service)).toBe(canSeeService(blind, service));
        }
      }
    }
  });
  it("não deixa a instalação sem OWNER e admin não promove a OWNER", () => {
    expect(canChangeRole({ actor: { id: "a", ...defaultSubject("OWNER") }, target: { id: "b", role: "OWNER" }, newRole: "ADMIN", ownerCount: 1 }).ok).toBe(false);
    expect(canChangeRole({ actor: { id: "a", ...defaultSubject("ADMIN") }, target: { id: "b", role: "VIEWER" }, newRole: "OWNER", ownerCount: 1 }).ok).toBe(false);
  });
});
