import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export type HubNodeData = { title: string; sub?: string; kind: string; focused?: boolean; picked?: boolean; href?: string };
type HubNode = Node<HubNodeData, "hub">;

const SHELL: Record<string, string> = {
  service: "rounded-xl border border-line bg-sheet",
  resource: "rounded-xl border border-dashed border-wait bg-paper",
  repository: "rounded-md border border-line bg-paper",
  team: "rounded-full border border-line bg-paper",
  person: "rounded-full border border-muted bg-sheet",
};

/** Cartão do mapa: nome em destaque e o tipo (API, time, fila…) numa linha menor. */
export function HubNodeCard({ data }: NodeProps<HubNode>) {
  return (
    <div className={`w-[200px] px-3 py-2 ${SHELL[data.kind] ?? SHELL.service} ${data.focused ? "ring-2 ring-wait" : data.picked ? "ring-2 ring-accent" : ""}`}>
      <Handle type="target" position={Position.Left} className="!size-2 !border-0 !bg-line" />
      <p className="truncate text-sm font-semibold leading-tight text-ink">{data.title}</p>
      {data.sub && <p className="mt-0.5 truncate text-[11px] font-medium text-accent">{data.sub}</p>}
      <Handle type="source" position={Position.Right} className="!size-2 !border-0 !bg-line" />
    </div>
  );
}

export const hubNodeTypes = { hub: HubNodeCard };
