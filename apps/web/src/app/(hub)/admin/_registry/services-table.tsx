import type { ReactNode } from "react";
import { SERVICE_KIND_LABEL, type ServiceKind } from "@api-hub/core/types";
import { EmptyState } from "@/components/empty-state";
import { LifecycleBadge } from "@/components/lifecycle-badge";
import { CellTitle, DataTable, RowActionLink, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { TeamCell } from "@/components/team-cell";
import { Badge } from "@/components/ui";

type Service = { id: string; slug: string; name: string; kind: string; lifecycle: string; archivedAt: Date | null; ownerTeam: { name: string } | null };

/** Serviços que a pessoa mantém (ativos e arquivados), com atalho para editar. */
export function ServicesTable({ rows, pagination, canCreate, tour }: { rows: Service[]; pagination?: ReactNode; canCreate?: boolean; tour?: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        tour={tour}
        title="Você ainda não mantém nenhum serviço"
        description={canCreate ? "Crie o primeiro em Novo serviço. Basta nome, time e tipo." : "Os serviços dos seus times aparecem aqui."}
      />
    );
  }
  return (
    <DataTable tour={tour} caption="Serviços que você mantém" minWidth={560} pagination={pagination}>
      <THead>
        <Th>Serviço</Th>
        <Th hideBelow="md">Tipo</Th>
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
                badge={s.archivedAt ? <Badge>Arquivado em {s.archivedAt.toLocaleDateString("pt-BR")}</Badge> : <LifecycleBadge lifecycle={s.lifecycle} />}
              />
            </Td>
            <Td hideBelow="md" muted>{SERVICE_KIND_LABEL[s.kind as ServiceKind] ?? s.kind}</Td>
            <Td><TeamCell name={s.ownerTeam?.name} /></Td>
            <Td align="right"><RowActions><RowActionLink href={`/services/${s.slug}/edit`}>{s.archivedAt ? "Restaurar" : "Editar"}</RowActionLink></RowActions></Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}
