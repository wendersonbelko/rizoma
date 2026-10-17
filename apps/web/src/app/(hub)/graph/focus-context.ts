"use client";

import { createContext } from "react";

/**
 * Foco do mapa, entregue aos cartões por contexto e não pelos dados de cada nó: assim os nós do
 * React Flow mantêm a mesma identidade ao trocar de foco e ele não precisa medi-los de novo
 * (o que piscaria o mapa inteiro a cada clique).
 */
export interface GraphFocus {
  focusId?: string;
  /** Itens nítidos; quem não está aqui esmaece. Sem o conjunto, todos ficam nítidos. */
  nodeIds?: ReadonlySet<string>;
}

export const GraphFocusContext = createContext<GraphFocus>({});
