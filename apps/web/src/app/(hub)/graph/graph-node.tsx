import { useContext } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { NodeKind } from "@api-hub/core/graph";
import { KIND, NODE_WIDTH } from "./constants";
import { GraphFocusContext } from "./focus-context";

export type HubNodeData = { title: string; sub?: string; kind: NodeKind; href?: string };
type HubNode = Node<HubNodeData, "hub">;

/**
 * Cartão do mapa: nome em destaque e o tipo (API, fila…) numa linha menor. O nome tem 15px, o
 * mesmo tamanho do texto do corpo (achado D1 da auditoria de UX de 02/10/2026: rótulos menores
 * que o corpo). Fora do foco o cartão fica a 25% de opacidade, mas continua clicável: um clique
 * nele leva o foco para ele.
 */
export function HubNodeCard({ id, data }: NodeProps<HubNode>) {
  const { focusId, nodeIds } = useContext(GraphFocusContext);
  const focused = focusId === id;
  const dimmed = nodeIds ? !nodeIds.has(id) : false;
  const roundShape = data.kind === "team" || data.kind === "person";
  return (
    <div
      title={data.title}
      style={{ width: NODE_WIDTH }}
      className={`flex min-h-14 flex-col justify-center py-2 transition-opacity duration-200 ${roundShape ? "px-5" : "px-3.5"} ${KIND[data.kind]?.shell ?? KIND.service.shell} ${
        focused ? "ring-2 ring-accent shadow-[0_4px_14px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_22%,transparent)]" : ""
      } ${dimmed ? "opacity-25 hover:opacity-60" : ""}`}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-0 !bg-line-strong" />
      <p className="line-clamp-2 break-words text-[15px] font-semibold leading-tight text-ink">{data.title}{dimmed && <span className="sr-only"> (fora do foco)</span>}</p>
      {data.sub && <p className="mt-0.5 truncate text-xs font-medium text-accent">{data.sub}</p>}
      <Handle type="source" position={Position.Right} className="!size-2 !border-0 !bg-line-strong" />
    </div>
  );
}

export const hubNodeTypes = { hub: HubNodeCard };
