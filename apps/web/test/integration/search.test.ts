import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@api-hub/db";
import type { CurrentUser } from "@/lib/guards";
import { asCurrent, install, makeUser } from "./helpers";

let current: CurrentUser | null = null;
vi.mock("@/lib/guards", () => ({
  requireUser: async () => { if (!current) throw new Error("NEXT_REDIRECT:/login"); return current; },
}));

const { searchServices } = await import("@/app/(hub)/_search/actions");

beforeEach(() => { current = null; });

/** Dois times, um leitor no time de pagamentos e serviços de todos os tipos de visibilidade. */
async function world() {
  await install();
  const pay = await prisma.team.create({ data: { slug: "pagamentos", name: "Pagamentos" } });
  const log = await prisma.team.create({ data: { slug: "logistica", name: "Logística" } });
  const viewer = await makeUser("leitor", { role: "VIEWER" });
  await prisma.teamMember.create({ data: { teamId: pay.id, userId: viewer.id } });
  const outsider = await makeUser("fora", { role: "VIEWER" });
  const admin = await makeUser("admin", { role: "ADMIN" });

  const svc = (slug: string, name: string, data: { visibility?: "ORG" | "TEAM"; teamId?: string; archived?: boolean } = {}) =>
    prisma.service.create({
      data: { slug, name, visibility: data.visibility ?? "ORG", ownerTeamId: data.teamId ?? null, archivedAt: data.archived ? new Date() : null },
    });
  await svc("pedidos-api", "Pedidos API", { teamId: log.id });
  await svc("pagamentos-api", "Pagamentos API", { teamId: pay.id });
  await svc("cobranca-interna", "Cobrança interna", { visibility: "TEAM", teamId: pay.id });
  await svc("frete-restrito", "Frete restrito", { visibility: "TEAM", teamId: log.id });
  await svc("pedidos-antigos", "Pedidos antigos", { archived: true });
  const faturamento = await svc("faturamento", "Faturamento", { teamId: pay.id });
  await prisma.specOperation.create({ data: { serviceId: faturamento.id, environmentId: "env_prod", method: "GET", path: "/pedidos/{id}" } });
  await prisma.specOperation.create({ data: { serviceId: faturamento.id, environmentId: "env_prod", method: "POST", path: "/notas" } });
  return { viewer, outsider, admin };
}

const names = (hits: { name: string }[]) => hits.map((h) => h.name);

describe("busca global ⌘K (searchServices)", () => {
  it("só consulta a partir de 2 letras e ignora entrada que não é texto", async () => {
    const { viewer } = await world();
    current = await asCurrent(viewer.id);
    expect(await searchServices("p")).toEqual([]);
    expect(await searchServices("   ")).toEqual([]);
    expect(await searchServices(42 as unknown as string)).toEqual([]);
    expect(await searchServices("x".repeat(200))).toEqual([]);
  });

  it("exige sessão: sem login a ação redireciona em vez de buscar", async () => {
    await world();
    await expect(searchServices("pedidos")).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("RN-30: serviço de time só aparece para o próprio time; arquivado nunca aparece", async () => {
    const { viewer, outsider } = await world();
    current = await asCurrent(viewer.id);
    expect(names(await searchServices("interna"))).toEqual(["Cobrança interna"]);
    // Serviço restrito de outro time e serviço arquivado ficam de fora, mesmo casando com o texto.
    expect(await searchServices("frete")).toEqual([]);
    expect(names(await searchServices("antigos"))).toEqual([]);

    current = await asCurrent(outsider.id);
    expect(await searchServices("interna")).toEqual([]);
    expect(names(await searchServices("pagamentos"))).toEqual(["Pagamentos API"]);
  });

  it("quem tem catalog:read_private vê os serviços restritos de qualquer time", async () => {
    const { admin } = await world();
    current = await asCurrent(admin.id);
    expect(names(await searchServices("frete"))).toEqual(["Frete restrito"]);
    expect(names(await searchServices("interna"))).toEqual(["Cobrança interna"]);
  });

  it("acha por endpoint e mostra o endpoint só quando o nome não explica o resultado", async () => {
    const { viewer } = await world();
    current = await asCurrent(viewer.id);
    const hits = await searchServices("pedidos");
    // O nome que começa pelo texto vem antes de quem só entrou pelo endpoint.
    expect(names(hits)).toEqual(["Pedidos API", "Faturamento"]);
    expect(hits[0]).toMatchObject({ slug: "pedidos-api", teamName: "Logística", endpoint: null });
    expect(hits[1]).toMatchObject({ slug: "faturamento", teamName: "Pagamentos", endpoint: "GET /pedidos/{id}" });

    // "MÉTODO /caminho" respeita o método.
    expect(names(await searchServices("GET /pedidos"))).toEqual(["Faturamento"]);
    expect(await searchServices("DELETE /pedidos")).toEqual([]);
  });

  it("devolve no máximo 8 serviços", async () => {
    const { viewer } = await world();
    for (let i = 1; i <= 12; i++) await prisma.service.create({ data: { slug: `lote-${i}`, name: `Lote ${String(i).padStart(2, "0")}` } });
    current = await asCurrent(viewer.id);
    expect(await searchServices("lote")).toHaveLength(8);
  });
});
