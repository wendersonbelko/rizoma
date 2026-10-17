import dagre from "@dagrejs/dagre";
import { CHANNEL_PROTOCOL_LABEL, RESOURCE_RELATION_LABEL, SERVICE_REPO_ROLE_LABEL, type ServiceRepoRole } from "@api-hub/core/types";
import type { FocusScope, GraphEdge, NodeKind } from "@api-hub/core/graph";
import type { Edge, Node } from "@xyflow/react";

export type GraphMode = "map" | "list";

/** Tamanho do cartão de cada item no mapa (px). O layout (dagre) e a câmera partem destes valores. */
export const NODE_WIDTH = 224;
export const NODE_HEIGHT = 72;

/**
 * Cada tipo de item tem um nome e uma forma. `shell` é o contorno do cartão no mapa e `swatch` o
 * mesmo contorno em miniatura (legenda e menu de tipos), para a legenda explicar o que o mapa
 * desenha. Cores só por tokens do tema, então o mapa acompanha o claro e o escuro.
 */
export const KIND: Record<NodeKind, { label: string; shell: string; swatch: string }> = {
  service: { label: "Serviços", shell: "rounded-xl border border-line-strong bg-sheet", swatch: "rounded-[5px] border border-line-strong bg-sheet" },
  resource: { label: "Integrações externas", shell: "rounded-xl border border-dashed border-wait bg-sheet", swatch: "rounded-[5px] border border-dashed border-wait bg-sheet" },
  repository: { label: "Repositórios", shell: "rounded-sm border border-line-strong bg-sheet", swatch: "rounded-[1px] border border-line-strong bg-sheet" },
  team: { label: "Times", shell: "rounded-full border border-line-strong bg-sheet", swatch: "rounded-full border border-line-strong bg-sheet" },
  person: { label: "Pessoas", shell: "rounded-full border-2 border-muted bg-sheet", swatch: "rounded-full border-2 border-muted bg-sheet" },
};

/** Rótulos do alcance do foco (achado D1 da auditoria de UX de 02/10/2026). */
export const FOCUS_SCOPES: { id: FocusScope; label: string }[] = [
  { id: 1, label: "1º grau" },
  { id: 2, label: "2º grau" },
  { id: "all", label: "Tudo" },
];

export const EDGE_LABEL: Record<string, string> = {
  ...RESOURCE_RELATION_LABEL,
  PUBLISHES_TO: "publica em",
  SUBSCRIBES_TO: "assina",
  SHARES_LIBRARY: "compartilha lib",
  DEPENDS_ON: "depende de",
};

/**
 * O que a seta diz, em português, para o mapa, a lista e o print. Os códigos internos (OWNS,
 * MEMBER, CLIENT_SDK…) nunca vão para a tela.
 */
export function edgeRelationLabel(e: Pick<GraphEdge, "kind" | "label" | "protocol">): string {
  if (e.kind === "OWNS") return "mantém";
  if (e.kind === "MEMBER") return "é membro de";
  if (e.kind === "SOURCE") return SERVICE_REPO_ROLE_LABEL[e.label as ServiceRepoRole] ?? "tem código em";
  const base = EDGE_LABEL[e.kind] ?? e.label;
  return e.protocol ? `${base} via ${CHANNEL_PROTOCOL_LABEL[e.protocol]}` : base;
}

/** Posiciona os nós com dagre (esquerda→direita); React Flow só desenha o que já vier posicionado. */
export function layoutNodes(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 32, ranksep: 88 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_WIDTH / 2, y: p.y - NODE_HEIGHT / 2 } };
  });
}
