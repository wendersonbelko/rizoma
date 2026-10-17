"use client";

import { TEAM_ROLE_LABEL } from "@api-hub/core/types";
import { personLabel } from "@api-hub/core/text";
import { PersonAvatar } from "@/components/person-avatar";
import { UndoButton } from "@/components/undo-button";
import { CellTitle, RowActions, Td, Tr } from "@/components/table";
import { Badge } from "@/components/ui";
import { removeMember } from "./actions";

type Person = { name: string | null; githubLogin: string | null; email: string | null; image: string | null };

/** Uma linha da tabela de membros de um time: avatar e nome (o e-mail vira detalhe), papel e remover com "Desfazer". */
export function MemberRow({ teamId, userId, person, role }: { teamId: string; userId: string; person: Person; role: "LEAD" | "MEMBER" }) {
  const label = personLabel(person);
  return (
    <Tr>
      <Td>
        <CellTitle
          title={label}
          meta={person.email && person.email !== label ? person.email : undefined}
          leading={<PersonAvatar person={person} />}
        />
      </Td>
      <Td>{role === "LEAD" ? <Badge tone="accent">{TEAM_ROLE_LABEL.LEAD}</Badge> : <Badge>{TEAM_ROLE_LABEL.MEMBER}</Badge>}</Td>
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
