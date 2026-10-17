import { describe, expect, it } from "vitest";
import { resolveSettingsSection, visibleSettingsSections } from "@/app/(hub)/admin/settings/sections";

const subject = (...permissions: string[]) => ({ permissions: new Set(permissions) });
const owner = subject("settings:manage", "appearance:manage");
const onlyAppearance = subject("appearance:manage");
const nobody = subject("catalog:read");

describe("abas de Configurações", () => {
  it("quem tem as duas permissões vê as quatro abas, na ordem do menu", () => {
    expect(visibleSettingsSections(owner).map((s) => s.id)).toEqual(["organization", "connections", "environments", "appearance"]);
  });

  it("quem só muda a aparência vê só a aba Aparência", () => {
    expect(visibleSettingsSections(onlyAppearance).map((s) => s.id)).toEqual(["appearance"]);
  });

  it("sem `s`, abre a primeira aba que a pessoa pode ver", () => {
    expect(resolveSettingsSection(undefined, owner)).toEqual({ kind: "show", section: "organization" });
    expect(resolveSettingsSection(undefined, onlyAppearance)).toEqual({ kind: "show", section: "appearance" });
    expect(resolveSettingsSection("valor-que-nao-existe", owner)).toEqual({ kind: "show", section: "organization" });
  });

  it("abrir uma aba sem a permissão dela é 404, não um redirecionamento para outra", () => {
    expect(resolveSettingsSection("organization", onlyAppearance)).toEqual({ kind: "forbidden" });
    expect(resolveSettingsSection("appearance", subject("settings:manage"))).toEqual({ kind: "forbidden" });
    expect(resolveSettingsSection(undefined, nobody)).toEqual({ kind: "forbidden" });
  });

  it("os valores antigos de ?s= redirecionam para a aba nova, com a âncora do bloco", () => {
    expect(resolveSettingsSection("login", owner)).toEqual({ kind: "redirect", section: "connections", anchor: "login" });
    expect(resolveSettingsSection("email", owner)).toEqual({ kind: "redirect", section: "connections", anchor: "email" });
    expect(resolveSettingsSection("repositories", owner)).toEqual({ kind: "redirect", section: "connections", anchor: "repositories" });
    expect(resolveSettingsSection("access", owner)).toEqual({ kind: "redirect", section: "organization", anchor: "access" });
    expect(resolveSettingsSection("sessions", owner)).toEqual({ kind: "redirect", section: "environments", anchor: "sessions" });
  });

  it("os nomes em português antigos também redirecionam", () => {
    expect(resolveSettingsSection("organizacao", owner)).toEqual({ kind: "redirect", section: "organization" });
    expect(resolveSettingsSection("repositorios", owner)).toEqual({ kind: "redirect", section: "connections", anchor: "repositories" });
    expect(resolveSettingsSection("ambientes", owner)).toEqual({ kind: "redirect", section: "environments" });
    expect(resolveSettingsSection("sessoes", owner)).toEqual({ kind: "redirect", section: "environments", anchor: "sessions" });
  });

  it("um valor antigo que leva a uma aba sem permissão também é 404", () => {
    expect(resolveSettingsSection("login", onlyAppearance)).toEqual({ kind: "forbidden" });
  });
});
