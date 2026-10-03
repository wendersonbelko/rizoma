import type { ReactNode } from "react";
import { DataTable, TBody, THead, Th } from "@/components/table";
import { AuditRow } from "./audit-row";
import type { queryAudit } from "./query";

type Row = Awaited<ReturnType<typeof queryAudit>>["rows"][number];

export function AuditTable({ rows, targets, hrefFor, pagination }: {
  rows: Row[]; targets: Record<string, string>; hrefFor: (id: string) => string; pagination?: ReactNode;
}) {
  return (
    <DataTable tour="audit-table" caption="Registros de auditoria" minWidth={720} stickyHeader pagination={pagination}>
      <THead sticky>
        <Th>Quando</Th>
        <Th>Quem</Th>
        <Th>Ação</Th>
        <Th>Alvo</Th>
        <Th hideBelow="lg">IP</Th>
      </THead>
      <TBody>
        {rows.map((r) => <AuditRow key={r.id} row={r} targetName={r.targetId ? targets[r.targetId] : undefined} href={hrefFor(r.id)} />)}
      </TBody>
    </DataTable>
  );
}
