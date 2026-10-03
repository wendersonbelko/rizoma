"use client";

import type { GraphEdge, GraphNode } from "@api-hub/core/graph";
import { ClientPagination, useClientPagination } from "@/components/client-pagination";
import { EmptyState } from "@/components/empty-state";
import { CellTitle, DataTable, RowActionButton, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { EDGE_LABEL, KIND } from "./constants";
import { CHANNEL_PROTOCOL_LABEL } from "@api-hub/core/types";

/**
 * Alternativa em tabela ao mapa visual (achado da revisão de UX G2): o grafo interativo depende
 * de mouse; esta lista é navegável por teclado/leitor de tela com os mesmos dados e filtros.
 * Os dados já estão todos no navegador, então a paginação é local (quem usa dá uma `key` que
 * muda com os filtros, para voltar à página 1).
 */
export function GraphList({ nodes, edges, onFocus }: { nodes: GraphNode[]; edges: GraphEdge[]; onFocus: (nodeId: string) => void }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const cell = (id: string) => {
    const n = byId.get(id);
    return n ? <CellTitle title={n.label} href={n.href} meta={KIND[n.kind].label} /> : id;
  };
  const sortedEdges = [...edges].sort((a, b) => (byId.get(a.source)?.label ?? "").localeCompare(byId.get(b.source)?.label ?? "", "pt-BR"));
  const { items, info, onChange } = useClientPagination(sortedEdges);

  if (sortedEdges.length === 0) return <EmptyState tour="graph-canvas" title="Nenhuma ligação com esses filtros" description="Marque mais tipos de item ou clique em “Mostrar tudo”." />;

  return (
    <DataTable
      tour="graph-canvas" caption="Ligações do mapa, em formato de tabela" minWidth={640} stickyHeader className="min-h-0 flex-1"
      pagination={<ClientPagination info={info} noun={["ligação", "ligações"]} onChange={onChange} />}
    >
      <THead sticky>
        <Th>De</Th>
        <Th>Relação</Th>
        <Th>Para</Th>
        <Th align="right"><SrOnly>Ações</SrOnly></Th>
      </THead>
      <TBody>
        {items.map((e) => (
          <Tr key={e.id}>
            <Td>{cell(e.source)}</Td>
            <Td muted>{e.protocol ? `${EDGE_LABEL[e.kind] ?? e.kind} via ${CHANNEL_PROTOCOL_LABEL[e.protocol]}` : (EDGE_LABEL[e.kind] ?? e.label)}</Td>
            <Td>{cell(e.target)}</Td>
            <Td align="right"><RowActions><RowActionButton type="button" onClick={() => onFocus(e.source)}>Focar no mapa</RowActionButton></RowActions></Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}
