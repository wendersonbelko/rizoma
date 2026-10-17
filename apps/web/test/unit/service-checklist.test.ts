import { describe, expect, it } from "vitest";
import { buildChecklist, type ChecklistFacts } from "@/app/(hub)/services/[slug]/checklist";

const base: ChecklistFacts = {
  serviceId: "svc_1",
  slug: "pagamentos-api",
  teamName: "Pagamentos",
  visibility: "ORG",
  specSource: "CI_PUSH",
  hasSourceRepository: false,
  hasSpec: false,
  hasActiveToken: false,
  canLink: true,
  canToken: true,
};

describe("checklist do serviço (achado M2 da auditoria de UX)", () => {
  it("serviço recém-criado pelo CI: faltam 3 passos e cada um leva ao contrato da tela certa", () => {
    const c = buildChecklist(base);
    expect(c.pending).toBe(3);
    expect(c.summary).toBe("Faltam 3 passos para ele aparecer completo no catálogo e no mapa.");
    expect(c.steps.map((s) => [s.id, s.done])).toEqual([["created", true], ["repository", false], ["spec-source", false], ["token", false]]);
    const hrefs = Object.fromEntries(c.steps.map((s) => [s.id, s.href]));
    expect(hrefs.repository).toBe("/admin/links?from=svc_1&fromKind=service#new-link");
    expect(hrefs["spec-source"]).toBe("/services/pagamentos-api?tab=config");
    expect(hrefs.token).toBe("/admin/tokens?service=svc_1#new-token");
  });

  it("o primeiro passo mostra time e visibilidade", () => {
    expect(buildChecklist(base).steps[0]!.detail).toBe("Time Pagamentos · visível para toda a empresa");
    expect(buildChecklist({ ...base, teamName: null, visibility: "TEAM" }).steps[0]!.detail).toBe("Sem time responsável · visível só para o time");
  });

  it("token só conta quando a origem é o CI", () => {
    const c = buildChecklist({ ...base, specSource: "MANUAL_UPLOAD" });
    expect(c.steps.some((s) => s.id === "token")).toBe(false);
    expect(c.pending).toBe(2);
  });

  it("no singular e quando tudo está feito", () => {
    const one = buildChecklist({ ...base, hasSourceRepository: true, hasSpec: true });
    expect(one.pending).toBe(1);
    expect(one.summary).toBe("Falta 1 passo para ele aparecer completo no catálogo e no mapa.");
    const done = buildChecklist({ ...base, hasSourceRepository: true, hasSpec: true, hasActiveToken: true });
    expect(done.pending).toBe(0);
  });

  it("sem permissão para o cadastro, o passo não leva a um 404", () => {
    const c = buildChecklist({ ...base, canLink: false, canToken: false });
    expect(c.steps.find((s) => s.id === "repository")!.href).toBeUndefined();
    expect(c.steps.find((s) => s.id === "token")!.href).toBeUndefined();
    expect(c.steps.find((s) => s.id === "spec-source")!.href).toBeDefined();
  });
});
