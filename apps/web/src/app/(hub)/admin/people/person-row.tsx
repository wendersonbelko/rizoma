import type { Role } from "@api-hub/core";
import { CellTitle, Td, Tr } from "@/components/table";
import { Badge, type BadgeTone } from "@/components/ui";
import { STATUS_LABEL, who } from "./labels";

type Status = keyof typeof STATUS_LABEL;
type Person = {
  id: string; name: string | null; email: string | null; githubLogin: string | null; role: Role;
  status: Status; accessExpiresAt: Date | null; isOrgMember: boolean; accessGrant: string | null; passwordHash: string | null;
};

const STATUS_TONE: Record<Status, BadgeTone> = { ACTIVE: "accent", PENDING: "wait", SUSPENDED: "danger", REJECTED: "danger" };

/** Uma linha da tabela de pessoas: status, origem, papel e as ações (senha, suspender). */
export function PersonRow({ person, isSelf, href }: { person: Person; isSelf: boolean; href: string }) {
  const showName = person.name && person.githubLogin === null && person.name !== person.email;
  return (
    <Tr>
      <Td><CellTitle title={who(person)} href={href} meta={showName ? person.name : undefined} badge={isSelf ? <Badge>você</Badge> : undefined} /></Td>
      <Td>
        <Badge tone={STATUS_TONE[person.status]}>{STATUS_LABEL[person.status]}</Badge>
        {person.accessExpiresAt && <span className="mt-1 block text-xs text-muted">até {person.accessExpiresAt.toLocaleDateString("pt-BR")}</span>}
      </Td>
      <Td hideBelow="md" muted>{person.isOrgMember ? "da empresa" : person.accessGrant === "MANUAL_APPROVAL" ? "aprovado/convidado" : "externo"}</Td>
      <Td muted>{person.role}</Td>
    </Tr>
  );
}
