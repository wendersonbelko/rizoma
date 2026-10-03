import { describe, expect, it } from "vitest";
import { parseHubManifest, planHubManifest, renderHubManifest } from "../src/hub-file";

const doc = `{
  "kind": "frontend",
  "channels": [{ "protocol": "websocket", "name": "Ao vivo", "addresses": { "prod": "wss://loja.exemplo/ws" } }],
  "consumes": [{ "service": "pedidos", "protocol": "http", "calls": [{ "method": "get", "path": "/pedidos" }] }, { "service": "fantasma", "calls": [] }],
  "resources": [{ "name": "Fila de pedidos", "kind": "queue", "provider": "RabbitMQ", "relation": "publishes" }]
}`;

describe("hub.json", () => {
  it("aceita o documento em minúsculas e separa serviço desconhecido", () => {
    const parsed = parseHubManifest(doc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const plan = planHubManifest(parsed.manifest, new Set(["pedidos"]));
    expect(plan.kind).toBe("FRONTEND");
    expect(plan.unknownServices).toEqual(["fantasma"]);
    expect(plan.consumes).toEqual([{ service: "pedidos", protocol: "HTTP", calls: [{ method: "GET", path: "/pedidos" }] }]);
    expect(plan.resources[0]).toMatchObject({ kind: "QUEUE", provider: "RabbitMQ", relation: "PUBLISHES", slug: "fila-de-pedidos" });
  });

  it("recusa endereço com senha e devolve o mesmo documento ao renderizar", () => {
    expect(parseHubManifest(`{"channels":[{"protocol":"http","name":"API","addresses":{"prod":"https://user:segredo@h"}}]}`).ok).toBe(false);
    const text = renderHubManifest({
      slug: "loja", kind: "FRONTEND",
      channels: [{ protocol: "WEBSOCKET", name: "Ao vivo", addresses: { prod: "wss://loja.exemplo/ws" } }],
      consumes: [{ service: "pedidos", protocol: "HTTP", calls: [{ method: "GET", path: "/pedidos" }] }],
      resources: [{ name: "Fila de pedidos", kind: "QUEUE", provider: "RabbitMQ", relation: "PUBLISHES" }],
    });
    const again = parseHubManifest(text);
    expect(again.ok).toBe(true);
  });
});
