import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACCENT, THEME_MODES, THEME_TOKENS, accentProblems, buildPalette, buildPalettes, contrastRatio, paletteProblems,
  paletteToCssVars, readThemeCookie, resolveAccent, themeChoiceFromPreference, themeStyleSheet,
} from "../src/themes";

// Destaques que um admin poderia escolher: azul, roxo, vermelho, laranja escuro e quase preto.
const ACCENTS = ["#0f7a68", "#2563eb", "#7c3aed", "#b3261e", "#b45309", "#16242c"];

describe("paletas claro e escuro", () => {
  it("nenhum tema fica abaixo de WCAG AA, com o destaque padrão e com outros (achados F5 e p.11 da auditoria de UX)", () => {
    for (const accent of ACCENTS) {
      expect(accentProblems(accent), accent).toEqual([]);
      for (const mode of THEME_MODES) {
        expect(paletteProblems(buildPalette(mode, accent)), `${mode} com ${accent}`).toEqual([]);
      }
    }
  });

  it("borda de campo tem 3:1 contra o campo nos dois temas (WCAG 1.4.11)", () => {
    for (const mode of THEME_MODES) {
      const p = buildPalette(mode);
      expect(contrastRatio(p["line-strong"], p.field), mode).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(p["line-strong"], p.raised), mode).toBeGreaterThanOrEqual(3);
    }
  });

  it("o escuro tem 3 degraus de elevação: fundo, painel e modal", () => {
    const { dark } = buildPalettes();
    expect(dark.paper).toBe("#0f1316");
    expect(dark.sheet).toBe("#161d22");
    expect(dark.raised).toBe("#1f2830");
    expect(contrastRatio(dark.sheet, dark.paper)).toBeGreaterThan(1.05);
    // Antes o painel do modal ficava a 1,17:1 do fundo e se confundia com a página.
    expect(contrastRatio(dark.raised, dark.paper)).toBeGreaterThan(1.2);
    expect(contrastRatio(dark.raised, dark.sheet)).toBeGreaterThan(1.1);
  });

  it("no claro o destaque é o escolhido; no escuro ele clareia só o necessário", () => {
    const { light, dark } = buildPalettes("#0f7a68");
    expect(light.accent).toBe("#0f7a68");
    expect(dark.accent).not.toBe("#0f7a68");
    expect(contrastRatio(dark.accent, dark.raised)).toBeGreaterThanOrEqual(4.5);
    // Já legível no escuro: não clareia à toa.
    expect(buildPalette("dark", "#9bd4c6").accent).toBe("#9bd4c6");
  });

  it("o texto do botão é preto ou branco, o que tiver mais contraste", () => {
    expect(buildPalette("light", "#0f7a68")["accent-ink"]).toBe("#ffffff");
    expect(buildPalette("dark", "#0f7a68")["accent-ink"]).toBe("#0a0f12");
  });

  it("o overlay do modal escurece nos dois temas", () => {
    const { light, dark } = buildPalettes();
    expect(dark.overlay).toBe("rgb(0 0 0 / 0.6)");
    expect(light.overlay).toBe("rgb(22 36 44 / 0.45)");
  });
});

describe("accentProblems", () => {
  it("recusa cor mal escrita, com a forma de corrigir", () => {
    expect(accentProblems("verde")[0]).toMatch(/#rrggbb/);
    expect(accentProblems("#12345")[0]).toMatch(/#rrggbb/);
  });

  it("recusa destaque claro demais para o tema claro", () => {
    expect(accentProblems("#f0f0f0")[0]).toMatch(/clara demais/);
    expect(accentProblems("#ffeb3b")[0]).toMatch(/tom mais escuro/);
  });

  it("aceita o destaque padrão e tons escuros", () => {
    expect(accentProblems(DEFAULT_ACCENT)).toEqual([]);
    expect(accentProblems("#000000")).toEqual([]);
  });
});

describe("resolveAccent", () => {
  it("lê o destaque de themeOverrides e normaliza para minúsculas", () => {
    expect(resolveAccent({ accent: "#2563EB" })).toBe("#2563eb");
  });

  it("ignora o que não serve e volta ao padrão", () => {
    expect(resolveAccent(null)).toBe(DEFAULT_ACCENT);
    expect(resolveAccent(undefined)).toBe(DEFAULT_ACCENT);
    expect(resolveAccent("#2563eb")).toBe(DEFAULT_ACCENT);
    expect(resolveAccent({ accent: "vermelho" })).toBe(DEFAULT_ACCENT);
    expect(resolveAccent({ accent: "#f0f0f0" })).toBe(DEFAULT_ACCENT);
    // Chaves do editor antigo de 9 cores não valem mais.
    expect(resolveAccent({ ink: "#000000", paper: "#ffffff" })).toBe(DEFAULT_ACCENT);
  });
});

describe("CSS do tema", () => {
  it("expõe os tokens novos como variáveis --color-*", () => {
    const vars = paletteToCssVars(buildPalette("light"));
    expect(Object.keys(vars)).toEqual(THEME_TOKENS.map((t) => `--color-${t}`));
    expect(vars["--color-raised"]).toBeTruthy();
    expect(vars["--color-line-strong"]).toBeTruthy();
    expect(vars["--color-overlay"]).toBeTruthy();
  });

  it("gera claro por padrão, escuro por data-theme e escuro do sistema só em prefers-color-scheme", () => {
    const css = themeStyleSheet("#2563eb");
    expect(css).toContain("html:root{");
    expect(css).toContain('html[data-theme="dark"]{');
    expect(css).toContain('@media (prefers-color-scheme: dark){html[data-theme="system"]{');
    expect(css).toContain("color-scheme:light");
    expect(css).toContain("color-scheme:dark");
    expect(css).toContain(`--color-accent:#2563eb`);
    // Só cores fixas e um destaque #rrggbb: nada que feche a tag <style>.
    expect(css).not.toMatch(/[<>]/);
  });

  it("um destaque inválido não entra no CSS", () => {
    expect(themeStyleSheet("</style><script>")).toContain(`--color-accent:${DEFAULT_ACCENT}`);
  });
});

describe("cookie de tema", () => {
  it("só aceita claro, escuro e sistema; o resto vira sistema", () => {
    expect(readThemeCookie("light")).toBe("light");
    expect(readThemeCookie("dark")).toBe("dark");
    expect(readThemeCookie("system")).toBe("system");
    expect(readThemeCookie("roxo")).toBe("system");
    expect(readThemeCookie(undefined)).toBe("system");
    expect(readThemeCookie(null)).toBe("system");
  });

  it("converte a preferência salva no banco", () => {
    expect(themeChoiceFromPreference("LIGHT")).toBe("light");
    expect(themeChoiceFromPreference("DARK")).toBe("dark");
    expect(themeChoiceFromPreference("SYSTEM")).toBe("system");
  });
});
