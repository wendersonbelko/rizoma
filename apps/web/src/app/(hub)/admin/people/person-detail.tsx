import { ROLES, type Role } from "@api-hub/core";
import { Badge, type BadgeTone, Button, Section, Select } from "@/components/ui";
import { DataTable, TBody, THead, Td, Th, Tr } from "@/components/table";
import { changeRole, setSuspended } from "./actions";
import { ResetLinkButton } from "./invite-forms";
import { ACTION_LABEL, STATUS_LABEL, who } from "./labels";

type Status = keyof typeof STATUS_LABEL;
const STATUS_TONE: Record<Status, BadgeTone> = { ACTIVE: "accent", PENDING: "wait", SUSPENDED: "danger", REJECTED: "danger" };

type Person = {
  id: string; name: string | null; email: string | null; githubLogin: string | null; role: Role;
  status: Status; accessExpiresAt: Date | null; isOrgMember: boolean; accessGrant: string | null; passwordHash: string | null;
  teams: { role: "LEAD" | "MEMBER"; team: { name: string; slug: string } }[];
};
type Event = { id: string; createdAt: Date; action: string };

/** O acesso de uma pessoa, no lugar da lista. */
export function PersonDetail({ person, isSelf, canResetPassword, events }: {
  person: Person; isSelf: boolean; canResetPassword: boolean; events: Event[];
}) {
  const origin = person.isOrgMember ? "da empresa" : person.accessGrant === "MANUAL_APPROVAL" ? "aprovado ou convidado" : "externo";
  return (
    <Section
      title={who(person)}
      description={[person.email, person.name].filter((v) => v && v !== who(person)).join(" · ") || origin}
      action={
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[person.status]}>{STATUS_LABEL[person.status]}</Badge>
          {isSelf ? null : (
            <form action={setSuspended}>
              <input type="hidden" name="userId" value={person.id} />
              <input type="hidden" name="suspend" value={person.status === "SUSPENDED" ? "0" : "1"} />
              <Button type="submit" tone={person.status === "SUSPENDED" ? "quiet" : "danger"}>{person.status === "SUSPENDED" ? "Reativar" : "Suspender"}</Button>
            </form>
          )}
        </span>
      }
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-muted">Origem</dt><dd className="mt-0.5">{origin}</dd></div>
        <div><dt className="text-xs text-muted">Times</dt><dd className="mt-0.5">{person.teams.length === 0 ? "Nenhum" : person.teams.map((t) => t.team.name).join(", ")}</dd></div>
        <div>
          <dt className="text-xs text-muted">Acesso</dt>
          <dd className="mt-0.5">{person.accessExpiresAt ? `até ${person.accessExpiresAt.toLocaleDateString("pt-BR")}` : "sem prazo"}</dd>
        </div>
      </dl>

      {!isSelf && (
        <form action={changeRole} className="mt-5 flex flex-wrap items-end gap-3">
          <input type="hidden" name="userId" value={person.id} />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Papel</span>
            <Select name="role" defaultValue={person.role} className="w-auto">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </label>
          <Button tone="quiet" type="submit">Salvar papel</Button>
          {canResetPassword && person.passwordHash && <ResetLinkButton userId={person.id} />}
        </form>
      )}

      <div className="mt-6">
        {events.length === 0 ? (
          <p className="text-sm text-muted">Nenhum evento de acesso desta pessoa.</p>
        ) : (
          <DataTable caption={`Eventos de acesso de ${who(person)}`} minWidth={480}>
            <THead>
              <Th>Quando</Th>
              <Th>O que aconteceu</Th>
            </THead>
            <TBody>
              {events.map((e) => (
                <Tr key={e.id}>
                  <Td nowrap muted>{e.createdAt.toLocaleString("pt-BR")}</Td>
                  <Td>{ACTION_LABEL[e.action] ?? e.action}</Td>
                </Tr>
              ))}
            </TBody>
          </DataTable>
        )}
      </div>
    </Section>
  );
}
