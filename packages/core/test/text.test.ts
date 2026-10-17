import { describe, expect, it } from "vitest";
import { countLabel, personLabel, plural, relativeTime, slugify } from "../src/text";
import { slugSchema } from "../src/schemas";

describe("slugify", () => {
  it("normaliza nome com acento e espaço", () => {
    expect(slugify("Pagamentos PIX API")).toBe("pagamentos-pix-api");
  });
  it("remove pontuação e acentos combinados", () => {
    expect(slugify("Ação/Único")).toBe("acao-unico");
  });
  it("produz slug aceito pelo schema", () => {
    expect(slugSchema.safeParse(slugify("Pedidos API")).success).toBe(true);
  });
});

describe("plural", () => {
  it("usa a forma singular só para 1", () => {
    expect(plural(1, "serviço", "serviços")).toBe("serviço");
  });
  it("usa a forma plural para 0 e para mais de 1", () => {
    expect(plural(0, "serviço", "serviços")).toBe("serviços");
    expect(plural(2, "serviço", "serviços")).toBe("serviços");
  });
});

describe("countLabel", () => {
  it("combina número formatado e a forma certa", () => {
    expect(countLabel(1, "serviço", "serviços")).toBe("1 serviço");
    expect(countLabel(1234, "registro", "registros")).toBe("1.234 registros");
  });
});

describe("personLabel", () => {
  it("prefere o nome, depois o login e por fim o e-mail", () => {
    expect(personLabel({ name: "Marina Costa", githubLogin: "marina", email: "m@x.com" })).toBe("Marina Costa");
    expect(personLabel({ name: null, githubLogin: "marina", email: "m@x.com" })).toBe("@marina");
    expect(personLabel({ name: " ", githubLogin: null, email: "m@x.com" })).toBe("m@x.com");
  });
  it("nunca devolve null nem vazio", () => {
    expect(personLabel({ name: null, githubLogin: null, email: null })).toBe("Alguém");
    expect(personLabel(null, "sistema")).toBe("sistema");
  });
});

describe("relativeTime", () => {
  const now = new Date(2026, 9, 2, 15, 0);
  it("fala em minutos e horas no mesmo dia", () => {
    expect(relativeTime(new Date(2026, 9, 2, 14, 59, 40), now)).toBe("agora");
    expect(relativeTime(new Date(2026, 9, 2, 14, 55), now)).toBe("há 5 min");
    expect(relativeTime(new Date(2026, 9, 2, 13, 0), now)).toBe("há 2 h");
  });
  it("usa ontem, data curta e data com ano", () => {
    expect(relativeTime(new Date(2026, 9, 1, 13, 39), now)).toBe("ontem, 13:39");
    expect(relativeTime(new Date(2026, 8, 28, 10, 45), now)).toBe("28/09, 10:45");
    expect(relativeTime(new Date(2025, 9, 1, 10, 45), now)).toBe("01/10/2025");
  });
});
