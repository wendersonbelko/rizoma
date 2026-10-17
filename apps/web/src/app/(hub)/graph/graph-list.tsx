"use client";

import type { GraphEdge, GraphNode } from "@api-hub/core/graph";
import { ClientPagination, useClientPagination } from "@/components/client-pagination";
import { EmptyState } from "@/components/empty-state";
import { CellTitle, DataTable, rowActionClass, THead, TBody, Td, Th, Tr } from "@/components/table";
import { edgeRelationLabel, KIND } from "./constants";

/**
 * Alternativa em tabela ao mapa visual (achado da revisão de UX G2): o grafo interativo depende
 * de mouse; esta lista é navegável por teclado/leitor de tela com os mesmos dados e o mesmo foco.
 * Os dados já estão todos no navegador, então a paginação é local (quem usa dá uma `key` que
 * muda com os filtros, para voltar à página 1).
 *
 * `innerScroll`: a lista mora numa coluna de altura fixa (a página do mapa não rola), então a
 * rolagem acontece dentro do card e o cabeçalho fica fixo nela.
 */
export function GraphList({ nodes, edges, onFocus }: { nodes: GraphNode[]; edges: GraphEdge[]; onFocus: (nodeId: string) => void }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const cell = (id: string) => {
    const n = byId.get(id);
    if (!n) return null;
    return (
      <CellTitle title={n.label} href={n.href} meta={KIND[n.kind].label}>
        <button type="button" aria-label={`Focar o mapa em ${n.label}`} onClick={() => onFocus(n.id)} className={`mt-1 ${rowActionClass()}`}>
          Focar no mapa
        </button>
      </CellTitle>
    );
  };
  const sortedEdges = [...edges].sort((a, b) => (byId.get(a.source)?.label ?? "").localeCompare(byId.get(b.source)?.label ?? "", "pt-BR"));
  const { items, info, onChange } = useClientPagination(sortedEdges);

  if (sortedEdges.length === 0) {
    return <EmptyState tour="graph-canvas" title="Nenhuma ligação neste foco" description="Escolha “2º grau” ou “Tudo”, ou marque mais tipos em “Tipos”." />;
  }

  return (
    <DataTable
      tour="graph-canvas" caption="Ligações do mapa, em formato de tabela" minWidth={640} stickyHeader innerScroll className="min-h-0 flex-1"
      pagination={<ClientPagination info={info} noun={["ligação", "ligações"]} onChange={onChange} />}
    >
      <THead sticky>
        <Th>De</Th>
        <Th>Relação</Th>
        <Th>Para</Th>
      </THead>
      <TBody>
        {items.map((e) => (
          <Tr key={e.id}>
            <Td>{cell(e.source)}</Td>
            <Td muted>{edgeRelationLabel(e)}</Td>
            <Td>{cell(e.target)}</Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}
