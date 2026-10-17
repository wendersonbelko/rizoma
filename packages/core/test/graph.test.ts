import { describe, expect, it } from "vitest";
import { buildGraph, mostConnectedService, parseFocusScope, parseNodeId, resolveFocus, type GraphInput } from "../src/graph";

describe("parseNodeId", () => {
  it("reconhece cada prefixo de nó", () => {
    expect(parseNodeId("s:abc")).toEqual({ kind: "service", realId: "abc" });
    expect(parseNodeId("r:xyz")).toEqual({ kind: "repository", realId: "xyz" });
    expect(parseNodeId("t:1")).toEqual({ kind: "team", realId: "1" });
    expect(parseNodeId("p:1")).toEqual({ kind: "person", realId: "1" });
    expect(parseNodeId("x:1")).toEqual({ kind: "resource", realId: "1" });
  });
  it("devolve null para ids sem prefixo reconhecido ou malformados", () => {
    expect(parseNodeId("zz")).toBeNull();
    expect(parseNodeId("q:1")).toBeNull();
    expect(parseNodeId("s:")).toBeNull();
    expect(parseNodeId(":abc")).toBeNull();
  });
});

/** Cadeia A → B → C → D, mais um serviço E solto e uma integração ligada a B. */
const input: GraphInput = {
  services: ["A", "B", "C", "D", "E"].map((n) => ({ id: n, slug: n.toLowerCase(), name: `Serviço ${n}`, ownerTeamId: "t1", lifecycle: "ACTIVE" })),
  repositories: [],
  teams: [{ id: "t1", name: "Time 1" }],
  people: [],
  resources: [{ id: "x1", slug: "stripe", name: "Stripe", kind: "HTTP_API" }],
  serviceDeps: [
    { id: "1", fromServiceId: "A", toServiceId: "B", kind: "DEPENDS_ON" },
    { id: "2", fromServiceId: "B", toServiceId: "C", kind: "DEPENDS_ON" },
    { id: "3", fromServiceId: "C", toServiceId: "D", kind: "DEPENDS_ON" },
  ],
  repoLinks: [],
  serviceRepos: [],
  serviceResources: [{ id: "r1", serviceId: "B", resourceId: "x1", relation: "PUBLISHES" }],
};
const full = () => buildGraph(input, { kinds: ["service", "resource"] });

describe("buildGraph com foco", () => {
  it("1º grau mantém o foco e os vizinhos diretos, nos dois sentidos", () => {
    const g = buildGraph(input, { kinds: ["service", "resource"], focusId: "s:B", depth: 1 });
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["s:A", "s:B", "s:C", "x:x1"]);
  });
  it("2º grau alcança os vizinhos dos vizinhos", () => {
    const g = buildGraph(input, { kinds: ["service", "resource"], focusId: "s:B", depth: 2 });
    expect(g.nodes.map((n) => n.id)).toContain("s:D");
  });
});

describe("parseFocusScope", () => {
  it("aceita 2 e all; o resto vira 1º grau", () => {
    expect(parseFocusScope("2")).toBe(2);
    expect(parseFocusScope("all")).toBe("all");
    expect(parseFocusScope("1")).toBe(1);
    expect(parseFocusScope("lixo")).toBe(1);
    expect(parseFocusScope(undefined)).toBe(1);
    expect(parseFocusScope(null)).toBe(1);
  });
});

describe("resolveFocus", () => {
  it("1º grau deixa nítidos o foco e os vizinhos; as arestas só entre nós nítidos", () => {
    const v = resolveFocus(full(), "s:B", 1);
    expect([...v.nodeIds].sort()).toEqual(["s:A", "s:B", "s:C", "x:x1"]);
    expect(v.edgeIds.has("sd:1")).toBe(true);
    expect(v.edgeIds.has("sd:2")).toBe(true);
    expect(v.edgeIds.has("sd:3")).toBe(false);
    expect(v.focusId).toBe("s:B");
  });
  it("2º grau inclui quem está a dois saltos, mas não quem está a três", () => {
    const v = resolveFocus(full(), "s:A", 2);
    expect(v.nodeIds.has("s:C")).toBe(true);
    expect(v.nodeIds.has("s:D")).toBe(false);
  });
  it("\"Tudo\" deixa todos nítidos e mantém o foco", () => {
    const g = full();
    const v = resolveFocus(g, "s:A", "all");
    expect(v.nodeIds.size).toBe(g.nodes.length);
    expect(v.edgeIds.size).toBe(g.edges.length);
    expect(v.focusId).toBe("s:A");
  });
  it("foco ausente ou que não está no grafo deixa tudo nítido e sem foco", () => {
    const g = full();
    for (const focus of [undefined, "s:nao-existe", "t:t1"]) {
      const v = resolveFocus(g, focus, 1);
      expect(v.focusId).toBeUndefined();
      expect(v.nodeIds.size).toBe(g.nodes.length);
    }
  });
  it("item sem ligação em foco fica sozinho", () => {
    const v = resolveFocus(full(), "s:E", 1);
    expect([...v.nodeIds]).toEqual(["s:E"]);
    expect(v.edgeIds.size).toBe(0);
  });
});

describe("mostConnectedService", () => {
  it("escolhe o serviço com mais ligações, contando serviços e integrações", () => {
    expect(mostConnectedService(input)).toBe("s:B");
  });
  it("empate resolve pelo nome", () => {
    const tied = { ...input, serviceDeps: [input.serviceDeps[0]!], serviceResources: [] };
    expect(mostConnectedService(tied)).toBe("s:A");
  });
  it("o time dono não conta como ligação", () => {
    expect(mostConnectedService({ ...input, serviceDeps: [], serviceResources: [] })).toBeUndefined();
  });
  it("ligações de serviços fora da lista (sem acesso) não contam", () => {
    const only = { ...input, services: input.services.filter((s) => s.id === "C") };
    expect(mostConnectedService(only)).toBe("s:C");
    expect(mostConnectedService({ ...only, services: [] })).toBeUndefined();
  });
});
