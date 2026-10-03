"use client";

import { UndoButton } from "@/components/undo-button";
import { CellTitle, RowActions, Td, Tr } from "@/components/table";
import { Badge } from "@/components/ui";
import { removeMember } from "./actions";

/** Uma linha da tabela de membros de um time. */
export function MemberRow({ teamId, userId, label, meta, role }: { teamId: string; userId: string; label: string; meta?: string; role: "LEAD" | "MEMBER" }) {
  return (
    <Tr>
      <Td><CellTitle title={label} meta={meta} /></Td>
      <Td>{role === "LEAD" ? <Badge tone="accent">líder</Badge> : <Badge>membro</Badge>}</Td>
      <Td align="right">
        <RowActions>
          <UndoButton
            removedLabel="Membro removido"
            onRemove={() => {
              const fd = new FormData();
              fd.set("teamId", teamId);
              fd.set("userId", userId);
              return removeMember(fd);
            }}
          />
        </RowActions>
      </Td>
    </Tr>
  );
}
