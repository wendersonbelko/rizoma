import type { Prisma } from "@api-hub/db";
import { personLabel, relativeTime } from "@api-hub/core";
import { Td, Tr } from "@/components/table";
import { auditTargetName, describeAuditEvent } from "../audit/events";

export type AccessEvent = {
  id: string; createdAt: Date; action: string; actorId: string | null; targetType: string | null; targetId: string | null;
  metadata: Prisma.JsonValue | null;
  actor: { name: string | null; githubLogin: string | null; email: string | null } | null;
};

/**
 * Uma linha de evento de acesso, na mesma frase da Auditoria ("Ana aprovou o acesso de Bruno como
 * Mantenedor"). A data fica relativa, com a completa no `title` (achado V3 da auditoria de UX de 02/10/2026).
 */
export function AccessEventRow({ entry, targets }: { entry: AccessEvent; targets: Record<string, string> }) {
  const author = entry.actor ? personLabel(entry.actor, "Alguém") : "Sistema";
  const sentence = describeAuditEvent(entry, auditTargetName(entry, targets));
  return (
    <Tr>
      <Td nowrap muted><time dateTime={entry.createdAt.toISOString()} title={entry.createdAt.toLocaleString("pt-BR")}>{relativeTime(entry.createdAt)}</time></Td>
      <Td><strong className="font-semibold text-ink">{author}</strong> {sentence}</Td>
    </Tr>
  );
}
