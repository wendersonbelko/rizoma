"use client";

import { useRouter } from "next/navigation";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { hubNodeTypes } from "./graph-node";

/** O mapa em si (React Flow) — só sabe desenhar nós/arestas e repassar cliques, nenhuma regra de vínculo mora aqui. */
export function GraphCanvas({ nodes, edges, viewKey, onNodeClick }: {
  nodes: Node[]; edges: Edge[]; viewKey: string; onNodeClick: (id: string) => void;
}) {
  const router = useRouter();
  return (
    <div data-tour="graph-canvas" className="hub-graph relative min-h-0 flex-1 overflow-hidden rounded-panel border border-line bg-paper">
      <ReactFlow
        key={viewKey}
        nodes={nodes}
        edges={edges}
        nodeTypes={hubNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1.15 }}
        minZoom={0.25}
        maxZoom={1.6}
        nodesConnectable={false}
        className="h-full w-full"
        onNodeClick={(_, n) => onNodeClick(n.id)}
        onNodeDoubleClick={(_, n) => {
          const href = (n.data as { href?: string }).href;
          if (href?.startsWith("/")) router.push(href);
          else if (href) window.open(href, "_blank", "noopener");
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={22} size={1.2} color="var(--color-line)" />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
