import { describe, expect, it } from "vitest";
import { buildMatrix } from "../src/rbac";
import { CREATE_SHORTCUTS, visibleCreateShortcuts } from "../src/create-shortcuts";

const matrix = buildMatrix([]);
const subject = (role: keyof typeof matrix) => ({ permissions: matrix[role] });
const only = (...permissions: string[]) => ({ permissions: new Set(permissions) });
const ids = (s: { permissions: ReadonlySet<string> }) => visibleCreateShortcuts(s).map((e) => e.id);

describe("visibleCreateShortcuts", () => {
  it("leitor não vê nenhum atalho de criação", () => {
    expect(ids(subject("VIEWER"))).toEqual([]);
  });
  it("mantenedor cria serviço, repositório, vínculo, token e integração, mas não time nem convite", () => {
    expect(ids(subject("MAINTAINER"))).toEqual(["new-service", "new-repository", "new-link", "new-token", "new-integration"]);
  });
  it("administrador vê todos, na ordem do menu", () => {
    expect(ids(subject("ADMIN"))).toEqual(["new-service", "new-repository", "new-link", "new-token", "new-integration", "new-team", "invite"]);
  });
  it("cada atalho depende só da permissão do botão de criar da própria tela", () => {
    expect(ids(only("team:manage"))).toEqual(["new-team"]);
    expect(ids(only("user:manage"))).toEqual(["invite"]);
    expect(ids(only("token:manage"))).toEqual(["new-token"]);
    expect(ids(only("service:edit"))).toEqual([]);
  });
});

describe("CREATE_SHORTCUTS", () => {
  it("o destino é uma rota do hub com o #id do modal-padrão", () => {
    for (const s of CREATE_SHORTCUTS) {
      expect(s.href).toMatch(/^\/[a-z/-]+#[a-z-]+$/);
      expect(s.href.endsWith(`#${s.id}`)).toBe(true);
    }
  });
  it("não repete id", () => {
    expect(new Set(CREATE_SHORTCUTS.map((s) => s.id)).size).toBe(CREATE_SHORTCUTS.length);
  });
  it("o que vai ao cliente não carrega a função de permissão", () => {
    const first = visibleCreateShortcuts(subject("OWNER"))[0]!;
    expect(Object.keys(first).sort()).toEqual(["href", "id", "keywords", "label"]);
  });
});
