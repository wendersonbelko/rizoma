import dagre from "@dagrejs/dagre";
import { RESOURCE_RELATION_LABEL } from "@api-hub/core/types";
import type { NodeKind } from "@api-hub/core/graph";
import type { Edge, Node } from "@xyflow/react";

export type GraphMode = "map" | "list";

/** Estilo de cada tipo de nó. Cores vêm do tema ativo (variáveis CSS), então o mapa acompanha a Aparência. */
export const KIND: Record<NodeKind, { label: string; fill: string; stroke: string; text: string; radius: number; dashed?: boolean }> = {
  service: { label: "Serviços", fill: "var(--color-accent)", stroke: "var(--color-accent)", text: "var(--color-accent-ink)", radius: 8 },
  resource: { label: "Integrações externas", fill: "var(--color-sheet)", stroke: "var(--color-wait)", text: "var(--color-ink)", radius: 8, dashed: true },
  repository: { label: "Repositórios", fill: "var(--color-sheet)", stroke: "var(--color-ink)", text: "var(--color-ink)", radius: 2 },
  team: { label: "Times", fill: "var(--color-ink)", stroke: "var(--color-ink)", text: "var(--color-paper)", radius: 20 },
  person: { label: "Pessoas", fill: "var(--color-paper)", stroke: "var(--color-muted)", text: "var(--color-ink)", radius: 20 },
};

export const EDGE_LABEL: Record<string, string> = {
  ...RESOURCE_RELATION_LABEL,
  PUBLISHES_TO: "publica em",
  SUBSCRIBES_TO: "assina",
  SHARES_LIBRARY: "compartilha lib",
  DEPENDS_ON: "depende de",
};

/** Posiciona os nós com dagre (esquerda→direita); React Flow só desenha o que já vier posicionado. */
export function layoutNodes(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 72 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: 200, height: 58 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - 100, y: p.y - 29 } };
  });
}
