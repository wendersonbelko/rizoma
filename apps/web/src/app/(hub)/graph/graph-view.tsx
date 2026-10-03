"use client";

import { useMemo, useState } from "react";
import { buildGraph, parseNodeId, type GraphInput, type NodeKind } from "@api-hub/core/graph";
import { SERVICE_KINDS, type ServiceKind } from "@api-hub/core/types";
import { useGraphLayout } from "./use-graph-layout";
import { GraphToolbar } from "./graph-toolbar";
import { GraphCanvas } from "./graph-canvas";
import { GraphList } from "./graph-list";
import { GraphIndex } from "./graph-index";
import { AddLinkButton } from "./add-link-button";
import { PrintGraphButton } from "./graph-print";
import type { GraphMode } from "./constants";

/**
 * Página do mapa de ligações: junta modo, filtros e seleção com a toolbar, o mapa e a lista.
 * O layout do grafo mora em use-graph-layout.ts. O "+" leva ao cadastro de vínculos.
 */
const PICK_MAX = 12;

export function GraphView({ input, initialFocus, canEdit = false }: {
  input: GraphInput; initialFocus?: string; canEdit?: boolean;
}) {
  const [mode, setMode] = useState<GraphMode>("map");
  const [kinds, setKinds] = useState<NodeKind[]>(["service", "resource", "repository", "team"]);
  const [serviceKinds, setServiceKinds] = useState<ServiceKind[]>([...SERVICE_KINDS]);
  const [selected, setSelected] = useState<string[]>(() => (initialFocus ? [initialFocus] : []));
  const [depth, setDepth] = useState(1);
  const [pickLimit, setPickLimit] = useState(4);
  const [pickNotice, setPickNotice] = useState<string>();
  const cap = Math.min(PICK_MAX, Math.max(1, pickLimit));
  const focus = selected[0];

  const { nodes, edges, graph } = useGraphLayout(input, kinds, selected, depth, serviceKinds);
  const indexNodes = useMemo(
    () => buildGraph(input, { kinds, serviceKinds }).nodes,
    [input, kinds, serviceKinds],
  );
  const newLinkHref = useMemo(() => linkCreateHref(selected), [selected]);

  function changePickLimit(n: number) {
    const next = Number.isFinite(n) ? Math.min(PICK_MAX, Math.max(1, Math.trunc(n))) : 1;
    setPickLimit(next);
    setSelected((current) => current.slice(0, next));
    setPickNotice(undefined);
  }

  function togglePick(id: string) {
    setMode("map");
    setSelected((current) => {
      if (current.includes(id)) {
        setPickNotice(undefined);
        return current.filter((x) => x !== id);
      }
      if (current.length >= cap) {
        setPickNotice(`O limite é ${cap}. O máximo aceito é ${PICK_MAX}.`);
        return current;
      }
      setPickNotice(undefined);
      return [...current, id];
    });
  }

  const displayNodes = useMemo(
    () => nodes.map((n) => ({ ...n, data: { ...(n.data as object), picked: selected.includes(n.id) } })),
    [nodes, selected],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <GraphToolbar
        mode={mode} onModeChange={setMode}
        kinds={kinds} onKindsChange={setKinds}
        serviceKinds={serviceKinds} onServiceKindsChange={setServiceKinds}
        focus={selected.length > 0} onShowAll={() => { setSelected([]); setPickNotice(undefined); }}
        depth={depth} onDepthChange={setDepth}
        pickLimit={pickLimit} onPickLimit={changePickLimit} pickCount={selected.length} pickMax={PICK_MAX}
        toast={pickNotice}
      />
      <div className="flex min-h-0 flex-1 gap-3">
        <GraphIndex nodes={indexNodes} focus={focus} selected={selected} onPick={togglePick} />
        <div className="relative flex min-h-0 flex-1 flex-col">
        {mode === "map" ? (
          <GraphCanvas
            nodes={displayNodes} edges={edges} viewKey={`${selected.join(",")}:${depth}:${kinds.join(",")}`}
            onNodeClick={togglePick}
          />
        ) : (
          <GraphList
            key={`${selected.join(",")}:${depth}:${kinds.join(",")}`} // filtro novo → volta para a página 1
            nodes={graph.nodes} edges={graph.edges} onFocus={togglePick}
          />
        )}

        {mode === "map" && (
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            {canEdit && <AddLinkButton href={newLinkHref} title={linkCreateTitle(selected, indexNodes)} />}
            <PrintGraphButton
              nodes={graph.nodes}
              edges={graph.edges}
              filters={{
                kinds,
                serviceKinds,
                focusLabel: selected.map((id) => indexNodes.find((n) => n.id === id)?.label).filter(Boolean).join(", ") || undefined,
                depth: focus ? depth : undefined,
              }}
            />
          </div>
        )}
        </div>
      </div>
      <p className="text-sm text-muted">
        {mode === "map"
          ? "Clique para focar. Duplo clique abre o serviço, a integração ou o repositório."
          : "Use “Focar” para restringir o mapa a partir de um item."}
      </p>
    </div>
  );
}

/** O último item da seleção, se for serviço ou repositório, vira o "De" do cadastro de vínculos. */
function linkCreateHref(selected: string[]) {
  const start = linkStart(selected);
  const params = new URLSearchParams({ t: "links" });
  if (start) {
    params.set("from", start.realId);
    params.set("fromKind", start.kind);
  }
  return `/admin/catalog?${params.toString()}#new-link`;
}

function linkCreateTitle(selected: string[], nodes: { id: string; label: string }[]) {
  const start = linkStart(selected);
  if (!start) return "Novo vínculo";
  const label = nodes.find((n) => n.id === selected[selected.length - 1])?.label;
  return label ? `Novo vínculo a partir de ${label}` : "Novo vínculo";
}

function linkStart(selected: string[]) {
  const last = selected[selected.length - 1];
  if (!last) return null;
  const parsed = parseNodeId(last);
  if (!parsed || (parsed.kind !== "service" && parsed.kind !== "repository")) return null;
  return { kind: parsed.kind, realId: parsed.realId };
}
