import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HUB_NAV } from "@api-hub/core";
import { getTour, MANDATORY_TOUR, resolveTourKey, TOURS } from "@/lib/tours";

const SRC = path.resolve(__dirname, "../../src");

function allSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...allSourceFiles(p));
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(p);
  }
  return out;
}

const SOURCE = allSourceFiles(SRC).map((f) => readFileSync(f, "utf8")).join("\n");

describe("tours", () => {
  it("toda tela do menu (HUB_NAV) tem um tour com pelo menos 3 passos", () => {
    for (const entry of HUB_NAV) {
      const def = TOURS[entry.href];
      expect(def, `tour de ${entry.href}`).toBeTruthy();
      expect(def!.steps.length, `passos de ${entry.href}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("resolveTourKey normaliza a rota dinâmica do serviço e rejeita a de edição", () => {
    expect(resolveTourKey("/services/pedidos-api")).toBe("/services/[slug]");
    expect(resolveTourKey("/services/pedidos-api/edit")).toBeNull();
    expect(resolveTourKey("/integrations/stripe")).toBeNull();
    expect(resolveTourKey("/graph/")).toBe("/graph");
  });

  it("getTour devolve null para uma chave sem tour, sem lançar erro", () => {
    expect(getTour(null)).toBeNull();
    expect(getTour("/rota-que-nao-existe")).toBeNull();
  });

  it("todo seletor [data-tour=\"...\"] referenciado nos tours existe em algum arquivo de src/", () => {
    const missing: string[] = [];
    const defs = { ...TOURS, "obrigatorio": MANDATORY_TOUR };
    for (const [route, def] of Object.entries(defs)) {
      for (const step of def.steps) {
        if (!step.selector) continue;
        const id = step.selector.match(/data-tour="([^"]+)"/)?.[1];
        if (!id) continue;
        // Aceita data-tour="x", tour="x" (prop dos componentes padrão), tour={cond ? "x" : …} e tour: "x".
        // service-tab-* é montado dinamicamente (`service-tab-${t.id}`); procura o template.
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const assigned = new RegExp(`tour\\s*[=:][^\\n]*["']${escaped}["']`);
        const found = id.startsWith("service-tab-") ? SOURCE.includes("`service-tab-${") : assigned.test(SOURCE);
        if (!found) missing.push(`${route} → ${id}`);
      }
    }
    expect(missing, missing.join(", ")).toEqual([]);
  });
});
