import { describe, expect, it } from "vitest";
import { clearFiltersHref, hasCatalogFilters, readCatalogFilters } from "@/app/(hub)/_catalog/filters";

/** Achado D2 da auditoria de UX de 02/10/2026: filtros do Catálogo lidos da URL (nomes em inglês, valores validados). */
describe("filtros do catálogo", () => {
  it("lê cada parâmetro de URL", () => {
    expect(readCatalogFilters({ q: " pedidos ", team: "logistica", kind: "WORKER", lifecycle: "deprecated", nospec: "1", mine: "1", tag: "core" })).toEqual({
      q: "pedidos",
      team: "logistica",
      kind: "WORKER",
      lifecycle: "deprecated",
      noSpec: true,
      mine: true,
      tag: "core",
    });
  });

  it("ignora valor desconhecido, vazio ou diferente de 1", () => {
    const filters = readCatalogFilters({ q: "  ", kind: "BATCH", lifecycle: "toString", nospec: "true", mine: "0", team: "" });
    expect(filters).toEqual({});
    expect(hasCatalogFilters(filters)).toBe(false);
  });

  it("usa o primeiro valor quando o parâmetro se repete", () => {
    expect(readCatalogFilters({ kind: ["API", "WORKER"] })).toEqual({ kind: "API" });
  });

  it("Limpar filtros tira só os filtros e a página, e mantém o resto da URL", () => {
    expect(clearFiltersHref({ q: "a", team: "x", kind: "API", nospec: "1", page: "3", size: "20" })).toBe("/?size=20");
    expect(clearFiltersHref({ q: "a", page: "2" })).toBe("/");
  });
});
