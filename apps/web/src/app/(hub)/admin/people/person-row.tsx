import { ROLE_LABEL, personLabel, type Role } from "@api-hub/core";
import { PersonAvatar } from "@/components/person-avatar";
import { CellTitle, Td, Tr } from "@/components/table";
import { Badge } from "@/components/ui";
import { STATUS_LABEL, STATUS_TONE, accessOrigin, type PersonStatus } from "./labels";

type Person = {
  id: string; name: string | null; email: string | null; githubLogin: string | null; image: string | null; role: Role;
  status: PersonStatus; accessExpiresAt: Date | null; isOrgMember: boolean; accessGrant: string | null;
};

/** Uma linha da tabela de pessoas: avatar e nome (o e-mail vira detalhe), status, origem e papel. */
export function PersonRow({ person, isSelf, href }: { person: Person; isSelf: boolean; href: string }) {
  const label = personLabel(person);
  return (
    <Tr>
      <Td>
        <CellTitle
          title={label}
          href={href}
          meta={person.email && person.email !== label ? person.email : undefined}
          badge={isSelf ? <Badge>você</Badge> : undefined}
          leading={<PersonAvatar person={person} />}
        />
      </Td>
      <Td>
        <Badge tone={STATUS_TONE[person.status]}>{STATUS_LABEL[person.status]}</Badge>
        {person.accessExpiresAt && <span className="mt-1 block text-xs text-muted">até {person.accessExpiresAt.toLocaleDateString("pt-BR")}</span>}
      </Td>
      <Td hideBelow="md" muted>{accessOrigin(person)}</Td>
      <Td muted>{ROLE_LABEL[person.role]}</Td>
    </Tr>
  );
}
