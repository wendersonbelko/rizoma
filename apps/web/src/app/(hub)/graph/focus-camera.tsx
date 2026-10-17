"use client";

import { useEffect, useRef } from "react";
import { useReactFlow, useStore, useStoreApi, type Node } from "@xyflow/react";
import type { FocusScope } from "@api-hub/core/graph";
import { cameraFor } from "./camera";

/** Espera antes de mover a câmera: dá tempo de um duplo clique abrir o item sem o mapa sair de baixo do cursor. */
const MOVE_DELAY_MS = 250;

/**
 * Leva a câmera para o foco quando ele (ou o alcance, ou os tipos exibidos) muda. Vive dentro do
 * <ReactFlow> para usar a câmera dele; não desenha nada. A primeira posição é imediata, as
 * seguintes deslizam. A conta do enquadramento é pura e mora em camera.ts.
 */
export function FocusCamera({ nodes, memberIds, focusId, scope, layoutKey }: {
  nodes: Node[]; memberIds: ReadonlySet<string>; focusId?: string; scope: FocusScope; layoutKey: string;
}) {
  const { setViewport } = useReactFlow();
  const store = useStoreApi();
  const measured = useStore((s) => s.width > 0 && s.height > 0);
  const latest = useRef({ nodes, memberIds });
  const first = useRef(true);

  // Os nós e o conjunto em foco mudam de identidade a cada render; o efeito da câmera só deve
  // rodar quando o foco, o alcance ou o desenho mudam de verdade, por isso lê daqui.
  useEffect(() => {
    latest.current = { nodes, memberIds };
  });

  useEffect(() => {
    if (!measured) return;
    const move = (duration: number) => {
      const { width, height } = store.getState();
      const camera = cameraFor({ nodes: latest.current.nodes, memberIds: latest.current.memberIds, focusId, scope, width, height });
      if (camera) void setViewport(camera, duration ? { duration } : undefined);
    };
    if (first.current) {
      first.current = false;
      move(0);
      return;
    }
    const timer = window.setTimeout(() => move(400), MOVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [measured, focusId, scope, layoutKey, setViewport, store]);

  return null;
}
