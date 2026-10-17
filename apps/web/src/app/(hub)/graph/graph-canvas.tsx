"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FocusScope } from "@api-hub/core/graph";
import { FocusCamera } from "./focus-camera";
import { GraphFocusContext } from "./focus-context";
import { hubNodeTypes } from "./graph-node";

/**
 * O mapa em si (React Flow): só sabe desenhar nós/arestas e repassar cliques; nenhuma regra de
 * vínculo ou de foco mora aqui. Um clique troca o foco, o duplo clique abre o item. As posições
 * não dependem do foco; a câmera é que vai até ele (FocusCamera).
 */
export function GraphCanvas({ nodes, edges, memberIds, focusId, scope, layoutKey, onFocus }: {
  nodes: Node[]; edges: Edge[];
  /** Itens nítidos: a câmera enquadra esses. */
  memberIds: ReadonlySet<string>; focusId?: string; scope: FocusScope;
  /** Muda quando o desenho muda (tipos exibidos), para a câmera enquadrar de novo. */
  layoutKey: string;
  onFocus: (nodeId: string) => void;
}) {
  const router = useRouter();
  const focus = useMemo(() => ({ focusId, nodeIds: memberIds }), [focusId, memberIds]);
  return (
    <div data-tour="graph-canvas" className="hub-graph relative min-h-0 flex-1 overflow-hidden rounded-panel border border-line bg-paper">
      <GraphFocusContext value={focus}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={hubNodeTypes}
          minZoom={0.25}
          maxZoom={1.6}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable={false}
          // Sem teclado no desenho: quem navega por teclado usa "Foco ▾" e o modo Lista, que fazem o mesmo.
          nodesFocusable={false}
          edgesFocusable={false}
          // O duplo clique abre o item; sem isto ele também daria zoom no mapa ao mesmo tempo.
          zoomOnDoubleClick={false}
          className="h-full w-full"
          onNodeClick={(_, n) => onFocus(n.id)}
          onNodeDoubleClick={(_, n) => {
            const href = (n.data as { href?: string }).href;
            if (href?.startsWith("/")) router.push(href);
            else if (href) window.open(href, "_blank", "noopener");
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={22} size={1.2} color="var(--color-line)" />
          <Controls showInteractive={false} position="bottom-left" />
          <FocusCamera nodes={nodes} memberIds={memberIds} focusId={focusId} scope={scope} layoutKey={layoutKey} />
        </ReactFlow>
      </GraphFocusContext>
    </div>
  );
}
