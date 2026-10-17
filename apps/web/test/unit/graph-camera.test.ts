import { describe, expect, it } from "vitest";
import { cameraFor } from "../../src/app/(hub)/graph/camera";
import { NODE_HEIGHT, NODE_WIDTH } from "../../src/app/(hub)/graph/constants";

const at = (id: string, x: number, y: number) => ({ id, position: { x, y } });

describe("cameraFor", () => {
  it("poucos itens em foco: enquadra todos sem passar do zoom máximo ", () => {
    const nodes = [at("a", 0, 0), at("b", 320, 0)];
    const cam = cameraFor({ nodes, focusId: "a", scope: 1, width: 1000, height: 600 })!;
    expect(cam.zoom).toBeLessThanOrEqual(1.1);
    expect(cam.zoom).toBeGreaterThanOrEqual(1);
    // o centro do conjunto cai no centro do mapa
    const centerX = (0 + 320 + NODE_WIDTH) / 2;
    expect(cam.x + centerX * cam.zoom).toBeCloseTo(500);
  });

  it("no 1º grau o zoom nunca cai abaixo do legível; com muitos vizinhos centra no foco", () => {
    const nodes = Array.from({ length: 30 }, (_, i) => at(`n${i}`, i === 0 ? 0 : 320, i * 100));
    const cam = cameraFor({ nodes, focusId: "n0", scope: 1, width: 1000, height: 600 })!;
    expect(cam.zoom).toBe(0.8);
    expect(cam.x + (NODE_WIDTH / 2) * cam.zoom).toBeCloseTo(500);
    expect(cam.y + (NODE_HEIGHT / 2) * cam.zoom).toBeCloseTo(300);
  });

  it("só enquadra os itens em foco (memberIds), não o mapa inteiro", () => {
    const nodes = [at("a", 0, 0), at("b", 320, 0), at("longe", 5000, 5000)];
    const cam = cameraFor({ nodes, memberIds: new Set(["a", "b"]), focusId: "a", scope: 1, width: 1000, height: 600 })!;
    expect(cam.zoom).toBeGreaterThanOrEqual(0.8);
  });

  it("\"Tudo\" enquadra todos os itens, mesmo abaixo do zoom legível", () => {
    const nodes = [at("a", 0, 0), at("longe", 4000, 3000)];
    const cam = cameraFor({ nodes, memberIds: new Set(["a"]), focusId: "a", scope: "all", width: 1000, height: 600 })!;
    expect(cam.zoom).toBeLessThan(0.5);
    expect(cam.zoom).toBeGreaterThanOrEqual(0.25);
  });

  it("sem tamanho medido ou sem itens não há câmera", () => {
    expect(cameraFor({ nodes: [at("a", 0, 0)], scope: 1, width: 0, height: 0 })).toBeNull();
    expect(cameraFor({ nodes: [], scope: 1, width: 1000, height: 600 })).toBeNull();
  });
});
