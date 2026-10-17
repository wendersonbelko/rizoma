"use client";

import { useMemo, useState } from "react";
import { mostConnectedService, parseNodeId, resolveFocus, type FocusScope, type GraphInput, type NodeKind } from "@api-hub/core/graph";
import { SERVICE_KINDS, type ServiceKind } from "@api-hub/core/types";
import { countLabel } from "@api-hub/core/text";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui";
import { dimEdges, useGraphLayout } from "./use-graph-layout";
import { GraphToolbar } from "./graph-toolbar";
import { GraphCanvas } from "./graph-canvas";
import { GraphList } from "./graph-list";
import { GraphLegend } from "./graph-legend";
import { AddLinkButton } from "./add-link-button";
import { PrintGraphButton } from "./graph-print";
import type { GraphMode } from "./constants";

/**
 * Página do mapa de ligações. Abre em foco (achado D1 da auditoria de UX de 02/10/2026): o item
 * pedido em `?focus=` ou, sem pedido, o serviço mais conectado. Os vizinhos até o alcance escolhido
 * ficam nítidos e o resto esmaece a 25%, sem sumir. Um clique troca o foco; o duplo clique abre.
 * O layout mora em use-graph-layout.ts, a câmera em focus-camera.tsx e a regra de foco no core.
 */
export function GraphView({ input, initialFocus, initialScope, canEdit = false }: {
  input: GraphInput; initialFocus?: string; initialScope: FocusScope; canEdit?: boolean;
}) {
  const [mode, setMode] = useState<GraphMode>("map");
  const [kinds, setKinds] = useState<NodeKind[]>(["service", "resource", "repository", "team"]);
  const [serviceKinds, setServiceKinds] = useState<ServiceKind[]>([...SERVICE_KINDS]);
  const [requestedFocus, setRequestedFocus] = useState(initialFocus);
  const [scope, setScope] = useState<FocusScope>(initialScope);

  const { graph, nodes, edges } = useGraphLayout(input, kinds, serviceKinds);
  const defaultFocus = useMemo(() => mostConnectedService(input), [input]);

  // O foco pedido vale só se o item está no mapa; se a pessoa esconder o tipo dele, volta ao padrão.
  const focusId = useMemo(() => {
    const present = new Set(graph.nodes.map((n) => n.id));
    return [requestedFocus, defaultFocus].find((id) => id !== undefined && present.has(id));
  }, [graph, requestedFocus, defaultFocus]);
  const view = useMemo(() => resolveFocus(graph, focusId, scope), [graph, focusId, scope]);

  const drawnEdges = useMemo(() => dimEdges(edges, view), [edges, view]);
  // O que está nítido: é o que a lista mostra e o que o print leva.
  const sharp = useMemo(
    () => ({ nodes: graph.nodes.filter((n) => view.nodeIds.has(n.id)), edges: graph.edges.filter((e) => view.edgeIds.has(e.id)) }),
    [graph, view],
  );

  function changeFocus(id: string) {
    if (id === focusId) return;
    setRequestedFocus(id);
    syncUrl(id, scope);
  }
  function changeScope(next: FocusScope) {
    setScope(next);
    syncUrl(focusId, next);
  }

  const focusLabel = graph.nodes.find((n) => n.id === focusId)?.label;
  const summary = !focusId || scope === "all"
    ? countLabel(graph.nodes.length, "item", "itens")
    : view.nodeIds.size === 1
      ? "Este item não tem ligações nos tipos exibidos."
      : `${view.nodeIds.size} de ${graph.nodes.length} itens em foco`;
  const layoutKey = `${kinds.join(",")}:${serviceKinds.join(",")}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <GraphToolbar
        mode={mode} onModeChange={setMode}
        nodes={graph.nodes} focusId={focusId} onFocus={changeFocus}
        scope={scope} onScopeChange={changeScope}
        kinds={kinds} onKindsChange={setKinds}
        serviceKinds={serviceKinds} onServiceKindsChange={setServiceKinds}
        summary={summary}
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {graph.nodes.length === 0 ? (
          <EmptyState
            tour="graph-canvas"
            title="Nenhum item no mapa"
            description="Marque mais tipos em “Tipos” ou cadastre serviços e vínculos para ver as ligações aqui."
            action={canEdit ? <LinkButton href="/admin/links#new-link">Novo vínculo</LinkButton> : undefined}
          />
        ) : mode === "map" ? (
          <>
            <GraphCanvas
              nodes={nodes} edges={drawnEdges}
              memberIds={view.nodeIds} focusId={focusId} scope={scope} layoutKey={layoutKey}
              onFocus={changeFocus}
            />
            <GraphLegend kinds={kinds} />
            {/* Imprimir e + Vínculo só no modo mapa (regra do apps/web/AGENTS.md). */}
            <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
              {canEdit && <AddLinkButton href={newLinkHref(focusId)} title={focusLabel ? `Novo vínculo a partir de ${focusLabel}` : "Novo vínculo"} />}
              <PrintGraphButton
                nodes={sharp.nodes}
                edges={sharp.edges}
                filters={{
                  kinds,
                  serviceKinds,
                  focusLabel: focusId ? focusLabel : undefined,
                  depth: focusId && scope !== "all" ? scope : undefined,
                }}
              />
            </div>
          </>
        ) : (
          <GraphList
            key={`${focusId}:${scope}:${layoutKey}`} // foco ou filtro novo → volta para a página 1
            nodes={sharp.nodes} edges={sharp.edges}
            onFocus={(id) => { setMode("map"); changeFocus(id); }}
          />
        )}
      </div>
    </div>
  );
}

/** Guarda o foco e o alcance no endereço (`?focus=`, `?depth=`), sem recarregar: ao voltar de um serviço aberto, o mapa reabre onde estava. */
function syncUrl(focus: string | undefined, scope: FocusScope) {
  const url = new URL(window.location.href);
  if (focus) url.searchParams.set("focus", focus);
  else url.searchParams.delete("focus");
  if (scope === 1) url.searchParams.delete("depth");
  else url.searchParams.set("depth", String(scope));
  window.history.replaceState(null, "", url);
}

/** Contrato com o cadastro de vínculos: o item em foco, se for serviço ou repositório, vira o "De". */
function newLinkHref(focusId: string | undefined) {
  const parsed = focusId ? parseNodeId(focusId) : null;
  if (!parsed || (parsed.kind !== "service" && parsed.kind !== "repository")) return "/admin/links#new-link";
  const params = new URLSearchParams({ from: parsed.realId, fromKind: parsed.kind });
  return `/admin/links?${params.toString()}#new-link`;
}
