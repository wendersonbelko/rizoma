import { describe, expect, it } from "vitest";
import { normalizeSearchText, parseEndpointQuery, rankCommands, scoreSearch, sortByRelevance } from "../src/command-search";

const labels = (items: { label: string }[]) => items.map((i) => i.label);

describe("normalizeSearchText", () => {
  it("tira acento, caixa e espaço repetido", () => {
    expect(normalizeSearchText("  Integração   Externa ")).toBe("integracao externa");
  });
});

describe("scoreSearch", () => {
  it("busca vazia casa com tudo", () => {
    expect(scoreSearch("", { label: "Catálogo" })).toBeGreaterThan(0);
    expect(scoreSearch("   ", { label: "Catálogo" })).toBeGreaterThan(0);
  });
  it("ignora acento e caixa", () => {
    expect(scoreSearch("catalogo", { label: "Catálogo" })).toBeGreaterThan(0);
    expect(scoreSearch("INTEGRACOES", { label: "Integrações externas" })).toBeGreaterThan(0);
  });
  it("não casa quando algum termo não aparece", () => {
    expect(scoreSearch("catalogo grafo", { label: "Catálogo" })).toBe(0);
    expect(scoreSearch("xyz", { label: "Catálogo", keywords: ["inicio"] })).toBe(0);
  });
  it("aceita os termos em qualquer ordem", () => {
    expect(scoreSearch("token gerar", { label: "Gerar token de CI" })).toBeGreaterThan(0);
  });
  it("palavra-chave também encontra, mas vale menos que o rótulo", () => {
    const porRotulo = scoreSearch("equipe", { label: "Equipe de plataforma" });
    const porPalavra = scoreSearch("equipe", { label: "Novo time", keywords: ["equipe"] });
    expect(porPalavra).toBeGreaterThan(0);
    expect(porRotulo).toBeGreaterThan(porPalavra);
  });
  it("começo do rótulo vale mais que começo de palavra e que o meio", () => {
    const inicio = scoreSearch("ser", { label: "Serviços" });
    const palavra = scoreSearch("ser", { label: "Novo serviço" });
    const meio = scoreSearch("ser", { label: "Reservas" });
    expect(inicio).toBeGreaterThan(palavra);
    expect(palavra).toBeGreaterThan(meio);
    expect(meio).toBeGreaterThan(0);
  });
});

describe("rankCommands", () => {
  const items = [
    { label: "Catálogo" },
    { label: "Mapa de ligações" },
    { label: "Novo serviço", keywords: ["criar", "cadastrar"] },
    { label: "Serviços" },
    { label: "Pessoas e acesso" },
  ];

  it("sem busca devolve tudo na ordem original", () => {
    expect(labels(rankCommands(items, ""))).toEqual(labels(items));
  });
  it("descarta o que não casa e põe o começo do rótulo primeiro", () => {
    expect(labels(rankCommands(items, "serv"))).toEqual(["Serviços", "Novo serviço"]);
  });
  it("acha pela palavra-chave", () => {
    expect(labels(rankCommands(items, "criar"))).toEqual(["Novo serviço"]);
  });
  it("empate mantém a ordem original", () => {
    expect(labels(rankCommands([{ label: "Beta um" }, { label: "Beta dois" }], "beta"))).toEqual(["Beta um", "Beta dois"]);
  });
  it("não altera a lista recebida", () => {
    const copy = [...items];
    rankCommands(items, "serv");
    expect(items).toEqual(copy);
  });
});

describe("sortByRelevance", () => {
  it("ordena sem descartar quem não casa com o texto", () => {
    const hits = [{ label: "Faturamento" }, { label: "Pagamentos API" }, { label: "Pedidos" }];
    // "Faturamento" entrou no resultado do banco por um endpoint: continua na lista, só que depois.
    expect(labels(sortByRelevance(hits, "pag"))).toEqual(["Pagamentos API", "Faturamento", "Pedidos"]);
  });
});

describe("parseEndpointQuery", () => {
  it("separa método e caminho", () => {
    expect(parseEndpointQuery("get /pedidos/{id}")).toEqual({ method: "GET", path: "/pedidos/{id}" });
    expect(parseEndpointQuery("  DELETE   /v1/itens ")).toEqual({ method: "DELETE", path: "/v1/itens" });
  });
  it("devolve null quando não há método", () => {
    expect(parseEndpointQuery("/pedidos")).toBeNull();
    expect(parseEndpointQuery("pedidos api")).toBeNull();
    expect(parseEndpointQuery("GET")).toBeNull();
  });
});
