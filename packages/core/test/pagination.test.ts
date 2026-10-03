import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, pageHref, pageInfo, pageSizeHref, pageWindow, paginate, queryWith, readPageRequest } from "../src/pagination";

describe("readPageRequest", () => {
  it("usa o padrão quando a URL não pede nada ou pede algo inválido", () => {
    expect(readPageRequest({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    expect(readPageRequest({ page: "abc", size: "7" })).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    expect(readPageRequest({ page: "-3", size: "0" })).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it("aceita só tamanhos da lista e respeita nomes de parâmetro próprios", () => {
    expect(readPageRequest({ page: "3", size: "50" })).toEqual({ page: 3, pageSize: 50 });
    expect(readPageRequest({ hpage: "2", hsize: "10" }, { pageKey: "hpage", sizeKey: "hsize", defaultSize: 20 })).toEqual({ page: 2, pageSize: 10 });
    expect(readPageRequest({ page: ["4", "9"] })).toEqual({ page: 4, pageSize: DEFAULT_PAGE_SIZE });
  });
});

describe("pageInfo", () => {
  it("calcula o intervalo exibido", () => {
    expect(pageInfo(45, { page: 2, pageSize: 20 })).toMatchObject({ page: 2, pages: 3, from: 21, to: 40, skip: 20, take: 20 });
    expect(pageInfo(45, { page: 3, pageSize: 20 })).toMatchObject({ from: 41, to: 45 });
  });

  it("uma página além da última vira a última; lista vazia tem uma página", () => {
    expect(pageInfo(45, { page: 99, pageSize: 20 })).toMatchObject({ page: 3, skip: 40 });
    expect(pageInfo(0, { page: 5, pageSize: 20 })).toMatchObject({ page: 1, pages: 1, from: 0, to: 0 });
  });
});

describe("paginate", () => {
  it("corta a lista em memória", () => {
    const { items, info } = paginate([1, 2, 3, 4, 5], { page: 2, pageSize: 2 });
    expect(items).toEqual([3, 4]);
    expect(info).toMatchObject({ total: 5, pages: 3 });
  });
});

describe("pageWindow", () => {
  it("mostra tudo quando cabe", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("resume com reticências nas pontas", () => {
    expect(pageWindow(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, "…", 12]);
    expect(pageWindow(12, 12)).toEqual([1, "…", 11, 12]);
  });

  it("não troca uma única página escondida por reticências", () => {
    expect(pageWindow(4, 12)).toEqual([1, 2, 3, 4, 5, "…", 12]);
  });
});

describe("hrefs", () => {
  const params = { q: "pedidos", tag: undefined, t: "tokens", page: "3" };

  it("preserva os outros parâmetros e tira a página 1 da URL", () => {
    expect(pageHref(params, 2)).toBe("?q=pedidos&t=tokens&page=2");
    expect(pageHref(params, 1)).toBe("?q=pedidos&t=tokens");
    expect(pageHref({}, 1)).toBe("?");
  });

  it("trocar o tamanho volta para a página 1", () => {
    expect(pageSizeHref(params, 50)).toBe("?q=pedidos&t=tokens&size=50");
    expect(pageSizeHref({ hpage: "2", page: "4" }, 10, { pageKey: "hpage", sizeKey: "hsize" })).toBe("?page=4&hsize=10");
  });

  it("queryWith remove chaves vazias do patch", () => {
    expect(queryWith({ a: "1", b: "2" }, { b: "" })).toBe("?a=1");
  });
});
