import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { LifecycleBadge } from "@/components/lifecycle-badge";
import { CellTitle, DataTable, RowActionLink, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { TeamCell } from "@/components/team-cell";
import { Badge } from "@/components/ui";

type Service = { id: string; slug: string; name: string; lifecycle: string; archivedAt: Date | null; ownerTeam: { name: string } | null };

/** Serviços que a pessoa mantém (ativos e arquivados), com atalho para editar. */
export function ServicesTable({ rows, pagination }: { rows: Service[]; pagination?: ReactNode }) {
  if (rows.length === 0) return <EmptyState title="Você ainda não mantém nenhum serviço" description="Cadastre um no assistente abaixo." />;
  return (
    <DataTable caption="Serviços que você mantém" minWidth={560} pagination={pagination}>
      <THead>
        <Th>Serviço</Th>
        <Th>Time</Th>
        <Th align="right"><SrOnly>Ações</SrOnly></Th>
      </THead>
      <TBody>
        {rows.map((s) => (
          <Tr key={s.id}>
            <Td>
              <CellTitle
                title={s.name}
                href={s.archivedAt ? `/services/${s.slug}/edit` : `/services/${s.slug}`}
                badge={s.archivedAt ? <Badge>arquivado em {s.archivedAt.toLocaleDateString("pt-BR")}</Badge> : <LifecycleBadge lifecycle={s.lifecycle} />}
              />
            </Td>
            <Td><TeamCell name={s.ownerTeam?.name} /></Td>
            <Td align="right"><RowActions><RowActionLink href={`/services/${s.slug}/edit`}>{s.archivedAt ? "Restaurar" : "Editar"}</RowActionLink></RowActions></Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}
