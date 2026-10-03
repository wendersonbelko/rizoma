import { useMemo } from "react";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import { buildGraph, type GraphInput, type NodeKind } from "@api-hub/core/graph";
import { CHANNEL_PROTOCOL_LABEL, type ServiceKind } from "@api-hub/core/types";
import { EDGE_LABEL, layoutNodes } from "./constants";

/** Monta nós/arestas do React Flow a partir do grafo filtrado — única responsabilidade: layout. */
export function useGraphLayout(input: GraphInput, kinds: NodeKind[], focusIds: string[], depth: number, serviceKinds: ServiceKind[]) {
  return useMemo(() => {
    const g = buildGraph(input, { kinds, focusIds: focusIds.length ? focusIds : undefined, depth, serviceKinds });
    const rfNodes: Node[] = g.nodes.map((n) => {
      return {
        id: n.id,
        type: "hub",
        data: { title: n.label, sub: n.sub, kind: n.kind, focused: focusIds[0] === n.id, picked: focusIds.includes(n.id), href: n.href },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { background: "transparent", border: "none", boxShadow: "none", padding: 0, width: 200 },
      };
    });
    const rfEdges: Edge[] = g.edges.map((e) => ({
      id: e.id, source: e.source, target: e.target,
      label: e.protocol ? `${EDGE_LABEL[e.kind] ?? e.kind} via ${CHANNEL_PROTOCOL_LABEL[e.protocol]}` : (EDGE_LABEL[e.kind] ?? e.label),
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { stroke: e.kind === "MEMBER" || e.kind === "OWNS" ? "var(--color-line)" : "var(--color-muted)", strokeDasharray: e.kind === "SOURCE" ? "4 3" : undefined },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: "var(--color-muted)" },
      labelBgStyle: { fill: "var(--color-paper)", fillOpacity: 0.92 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    }));
    return { nodes: layoutNodes(rfNodes, rfEdges), edges: rfEdges, graph: g };
  }, [input, kinds, focusIds, depth, serviceKinds]);
}
