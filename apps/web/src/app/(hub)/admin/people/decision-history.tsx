import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { DataTable, TBody, THead, Th } from "@/components/table";
import { Section } from "@/components/ui";
import { AccessEventRow, type AccessEvent } from "./access-event-row";

/** Histórico de eventos de acesso: mesma tabela e mesmas frases da Auditoria, só dos eventos de acesso. */
export function DecisionHistory({ entries, targets, pagination }: { entries: AccessEvent[]; targets: Record<string, string>; pagination?: ReactNode }) {
  return (
    <Section title="Histórico de decisões" description="Eventos de acesso, do mais recente ao mais antigo. Para filtrar por pessoa e período, use a Auditoria.">
      {entries.length === 0 ? (
        <EmptyState title="Nenhuma decisão ainda" />
      ) : (
        <DataTable caption="Histórico de decisões de acesso" minWidth={480} stickyHeader pagination={pagination}>
          <THead sticky>
            <Th>Quando</Th>
            <Th>O que aconteceu</Th>
          </THead>
          <TBody>
            {entries.map((e) => <AccessEventRow key={e.id} entry={e} targets={targets} />)}
          </TBody>
        </DataTable>
      )}
    </Section>
  );
}
