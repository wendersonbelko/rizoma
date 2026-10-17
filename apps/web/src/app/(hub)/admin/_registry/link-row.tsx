"use client";

import type { ReactNode } from "react";
import { UndoButton } from "@/components/undo-button";
import { RowActions, Td, Tr } from "@/components/table";
import { deleteLink } from "./actions";

/** Uma linha da tabela de vínculos; remover passa pela janela de "Desfazer". */
export function LinkRow({ type, id, from, relation, to, origin }: {
  type: "service" | "repository"; id: string; from: ReactNode; relation: ReactNode; to: ReactNode; origin?: ReactNode;
}) {
  return (
    <Tr>
      <Td className="font-semibold">{from}</Td>
      <Td muted>{relation}</Td>
      <Td className="font-semibold">{to}</Td>
      <Td hideBelow="md">{origin}</Td>
      <Td align="right">
        <RowActions>
          <UndoButton
            removedLabel="Vínculo removido"
            onRemove={() => {
              const fd = new FormData();
              fd.set("type", type);
              fd.set("id", id);
              return deleteLink(fd);
            }}
          />
        </RowActions>
      </Td>
    </Tr>
  );
}
