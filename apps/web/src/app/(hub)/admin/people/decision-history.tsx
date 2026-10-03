import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { DataTable, TBody, THead, Td, Th, Tr } from "@/components/table";
import { Section } from "@/components/ui";
import { ACTION_LABEL, who } from "./labels";

type Entry = { id: string; createdAt: Date; action: string; actor: { githubLogin: string | null; email: string | null } | null };

/** Histórico de eventos de acesso — mesmo formato de tabela da Auditoria. */
export function DecisionHistory({ entries, pagination }: { entries: Entry[]; pagination?: ReactNode }) {
  return (
    <Section title="Histórico de decisões" description="Eventos de acesso, do mais recente ao mais antigo. Com filtros por pessoa e período, na Auditoria.">
      {entries.length === 0 ? (
        <EmptyState title="Nenhuma decisão ainda" />
      ) : (
        <DataTable caption="Histórico de decisões de acesso" minWidth={560} pagination={pagination}>
          <THead>
            <Th>Quando</Th>
            <Th>Quem</Th>
            <Th>O que aconteceu</Th>
          </THead>
          <TBody>
            {entries.map((a) => (
              <Tr key={a.id}>
                <Td nowrap muted>{a.createdAt.toLocaleString("pt-BR")}</Td>
                <Td nowrap>{a.actor ? who(a.actor) : <span className="text-muted">sistema</span>}</Td>
                <Td>{ACTION_LABEL[a.action] ?? a.action}</Td>
              </Tr>
            ))}
          </TBody>
        </DataTable>
      )}
    </Section>
  );
}
