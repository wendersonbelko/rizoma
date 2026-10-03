import type { ReactNode } from "react";

/**
 * Lista de itens "ricos" que não cabem numa linha de tabela (ex.: pedido de acesso com
 * justificativa e formulário de decisão). Mesmo card, borda e divisórias da DataTable, para as
 * duas formas de listagem terem a mesma cara lado a lado.
 */
export function CardList({ children, tour }: { children: ReactNode; tour?: string }) {
  return <ul data-tour={tour} className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-sheet">{children}</ul>;
}

export function CardListItem({ children }: { children: ReactNode }) {
  return <li className="px-4 py-4">{children}</li>;
}
