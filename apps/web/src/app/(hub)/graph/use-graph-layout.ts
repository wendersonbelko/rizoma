import { useMemo } from "react";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import { buildGraph, type FocusView, type GraphInput, type NodeKind } from "@api-hub/core/graph";
import type { ServiceKind } from "@api-hub/core/types";
import { edgeRelationLabel, layoutNodes, NODE_HEIGHT, NODE_WIDTH } from "./constants";

/**
 * Monta nós/arestas do React Flow a partir do grafo filtrado por tipo. Não depende do foco: o
 * desenho tem as mesmas posições ao trocar de foco (só o esmaecimento muda), assim a pessoa
 * aprende onde as coisas ficam. Única responsabilidade: layout.
 */
export function useGraphLayout(input: GraphInput, kinds: NodeKind[], serviceKinds: ServiceKind[]) {
  return useMemo(() => {
    const graph = buildGraph(input, { kinds, serviceKinds });
    const rfNodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: "hub",
      data: { title: n.label, sub: n.sub, kind: n.kind, href: n.href },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      // Tamanho conhecido de saída: a câmera enquadra sem esperar a medição do DOM.
      initialWidth: NODE_WIDTH,
      initialHeight: NODE_HEIGHT,
      style: { background: "transparent", border: "none", boxShadow: "none", padding: 0, width: NODE_WIDTH },
    }));
    const rfEdges: Edge[] = graph.edges.map((e) => ({
      id: e.id, source: e.source, target: e.target,
      label: edgeRelationLabel(e),
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--color-muted)" },
      style: { stroke: e.kind === "MEMBER" || e.kind === "OWNS" ? "var(--color-line-strong)" : "var(--color-muted)", strokeDasharray: e.kind === "SOURCE" ? "4 3" : undefined },
      labelStyle: { fontSize: 12, fontWeight: 600, fill: "var(--color-muted)" },
      labelBgStyle: { fill: "var(--color-paper)", fillOpacity: 0.92 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    }));
    return { graph, nodes: layoutNodes(rfNodes, rfEdges), edges: rfEdges };
  }, [input, kinds, serviceKinds]);
}

/**
 * Aplica o foco às setas: as que ficam fora dele esmaecem a 25% (não somem, achado D1 da auditoria
 * de UX de 02/10/2026) e perdem o rótulo, para a vizinhança respirar. Os cartões esmaecem sozinhos,
 * pelo GraphFocusContext, para os nós do React Flow não serem recriados a cada troca de foco.
 */
export function dimEdges(edges: Edge[], view: FocusView): Edge[] {
  return edges.map((e) => (view.edgeIds.has(e.id)
    ? { ...e, zIndex: 1 }
    : { ...e, label: undefined, zIndex: 0, style: { ...e.style, opacity: 0.25 } }));
}
