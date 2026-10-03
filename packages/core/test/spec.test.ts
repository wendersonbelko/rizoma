import { describe, expect, it } from "vitest";
import { diffSpecs, listOperations, outlineOperations, parseSpec, SpecError, summarizeDiff } from "../src/spec";

describe("parseSpec", () => {
  it("lê YAML 3.1 e dependências declaradas", () => {
    const s = parseSpec(`openapi: 3.1.0\ninfo: { title: Pedidos, version: 2.3.0 }\npaths: {}\nx-api-hub: { dependsOn: [estoque] }\n`);
    expect(s).toMatchObject({ format: "openapi-3.1", version: "2.3.0", declaredDependencies: ["estoque"] });
  });
  it("recusa documento sem versão de OpenAPI", () => {
    expect(() => parseSpec(`{"info":{}}`)).toThrow(SpecError);
  });
  it("aponta método removido como incompatível e método novo como acréscimo", () => {
    const before = parseSpec(`{"openapi":"3.0.3","info":{"title":"P","version":"1"},"paths":{"/pedidos":{"get":{"responses":{"200":{"description":"ok"}}},"post":{"responses":{"201":{"description":"criado"}}}}}}`).normalized;
    const after = parseSpec(`{"openapi":"3.0.3","info":{"title":"P","version":"2"},"paths":{"/pedidos":{"get":{"responses":{"200":{"description":"lista"}}}},"/notas":{"post":{"responses":{"201":{"description":"ok"}}}}}}`).normalized;
    const diff = diffSpecs(before, after);
    expect(diff.breaking).toBe(true);
    expect(diff.changes).toEqual(expect.arrayContaining([
      { kind: "removed", method: "POST", path: "/pedidos" },
      { kind: "changed", method: "GET", path: "/pedidos" },
      { kind: "added", method: "POST", path: "/notas" },
    ]));
    expect(summarizeDiff(diff)).toMatchObject({ added: 1, removed: 1, changed: 1, breaking: true });
    expect(listOperations(after).map((o) => `${o.method} ${o.path}`).sort()).toEqual(["GET /pedidos", "POST /notas"]);
  });
  it("agrupa operações pela tag e pelo resumo", () => {
    const spec = parseSpec(`{"openapi":"3.0.3","info":{"title":"P","version":"1"},"paths":{"/produtos":{"get":{"tags":["Catálogo"],"summary":"Lista produtos","responses":{"200":{"description":"ok"}}},"post":{"deprecated":true,"responses":{"201":{"description":"criado"}}}}}}`).normalized;
    expect(outlineOperations(spec)).toEqual([
      { method: "GET", path: "/produtos", tag: "Catálogo", summary: "Lista produtos", deprecated: false },
      { method: "POST", path: "/produtos", tag: "Geral", summary: "", deprecated: true },
    ]);
  });
});
