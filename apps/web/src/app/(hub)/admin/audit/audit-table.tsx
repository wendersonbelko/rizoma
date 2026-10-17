import type { ReactNode } from "react";
import { DataTable, TBody, THead, Th } from "@/components/table";
import { AuditRow } from "./audit-row";
import type { queryAudit } from "./query";

type Row = Awaited<ReturnType<typeof queryAudit>>["rows"][number];

/**
 * Lista da auditoria. Cabeçalho fixo na rolagem da PÁGINA, sem barra de rolagem interna (achado D5):
 * o `stickyHeader` do DataTable já resolve, é só usá-lo com `<THead sticky>`.
 */
export function AuditTable({ rows, targets, pagination }: { rows: Row[]; targets: Record<string, string>; pagination?: ReactNode }) {
  return (
    <DataTable tour="audit-table" caption="Registros de auditoria" minWidth={560} stickyHeader pagination={pagination}>
      <THead sticky>
        <Th>O que aconteceu</Th>
      </THead>
      <TBody>
        {rows.map((r) => <AuditRow key={r.id} row={r} targets={targets} />)}
      </TBody>
    </DataTable>
  );
}
