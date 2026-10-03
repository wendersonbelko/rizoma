import { describe, expect, it } from "vitest";
import { THEMES, paletteProblems } from "../src/themes";

describe("paletteProblems", () => {
  it("nenhum tema padrão fica abaixo de WCAG AA (achado G1 da auditoria de UX)", () => {
    for (const theme of THEMES) {
      expect(paletteProblems(theme.palette), `tema "${theme.name}"`).toEqual([]);
    }
  });
});
