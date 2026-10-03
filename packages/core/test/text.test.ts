import { describe, expect, it } from "vitest";
import { countLabel, plural, slugify } from "../src/text";
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
