import { CellTitle, Td, Tr } from "@/components/table";
import { describeAuditEvent, type queryAudit } from "./query";

type Row = Awaited<ReturnType<typeof queryAudit>>["rows"][number];

/** Uma linha da auditoria. O texto da ação abre o registro. */
export function AuditRow({ row, targetName, href }: { row: Row; targetName: string | undefined; href: string }) {
  const who = row.actor ? (row.actor.githubLogin ? `@${row.actor.githubLogin}` : row.actor.email) : "sistema";
  return (
    <Tr>
      <Td nowrap muted>{row.createdAt.toLocaleString("pt-BR")}</Td>
      <Td nowrap>{who}</Td>
      <Td><CellTitle title={describeAuditEvent(row, targetName)} href={href} /></Td>
      <Td muted>{row.targetId ? (targetName ?? row.targetType ?? "—") : "—"}</Td>
      <Td hideBelow="lg" muted nowrap>{row.ip ?? "—"}</Td>
    </Tr>
  );
}
