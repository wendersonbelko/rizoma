import type { FocusScope } from "@api-hub/core/graph";
import { NODE_HEIGHT, NODE_WIDTH } from "./constants";

/** Folga entre o que é enquadrado e a borda do mapa (px): deixa espaço para os botões e a legenda. */
const PADDING = 56;
/** Perto demais o mapa vira um zoom exagerado quando há poucos itens em foco. */
const MAX_ZOOM = 1.1;
/**
 * Zoom mínimo em que o nome do item ainda é legível: 15px de texto vezes o zoom. No 1º grau é 0,8
 * (rótulo de 12px ou mais; achado D1 da auditoria de UX de 02/10/2026): com zoom 1 um serviço com
 * uns dez vizinhos não cabia e parte deles ficava fora da tela ao abrir o mapa. No 2º grau aceita
 * um pouco menos para caber mais; em "Tudo" a pessoa pediu o mapa inteiro.
 */
const MIN_READABLE_ZOOM: Record<"1" | "2" | "all", number> = { "1": 0.8, "2": 0.65, all: 0.25 };

export interface Viewport { x: number; y: number; zoom: number }

/**
 * Onde pôr a câmera ao trocar de foco. Enquadra os itens em foco; se nem no zoom mínimo legível
 * eles cabem, centra no item em foco e deixa o resto para a pessoa arrastar. Função pura: quem
 * aplica o resultado é o FocusCamera.
 */
export function cameraFor(args: {
  nodes: { id: string; position: { x: number; y: number } }[];
  /** Itens em foco; sem isto enquadra todos. */
  memberIds?: ReadonlySet<string>;
  focusId?: string;
  scope: FocusScope;
  width: number;
  height: number;
}): Viewport | null {
  const { memberIds, focusId, scope, width, height } = args;
  if (width <= 0 || height <= 0) return null;
  const nodes = memberIds && scope !== "all" ? args.nodes.filter((n) => memberIds.has(n.id)) : args.nodes;
  if (nodes.length === 0) return null;

  const minX = Math.min(...nodes.map((n) => n.position.x));
  const maxX = Math.max(...nodes.map((n) => n.position.x + NODE_WIDTH));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxY = Math.max(...nodes.map((n) => n.position.y + NODE_HEIGHT));

  const fit = Math.min((width - PADDING * 2) / (maxX - minX), (height - PADDING * 2) / (maxY - minY));
  const floor = MIN_READABLE_ZOOM[String(scope) as "1" | "2" | "all"];
  const zoom = Math.min(MAX_ZOOM, Math.max(floor, fit));

  const focus = scope !== "all" && fit < floor ? nodes.find((n) => n.id === focusId) : undefined;
  const cx = focus ? focus.position.x + NODE_WIDTH / 2 : (minX + maxX) / 2;
  const cy = focus ? focus.position.y + NODE_HEIGHT / 2 : (minY + maxY) / 2;
  return { x: width / 2 - cx * zoom, y: height / 2 - cy * zoom, zoom };
}
