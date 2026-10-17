import { ROLE_LABEL, personLabel, type Role } from "@api-hub/core";
import { PersonAvatar } from "@/components/person-avatar";
import { DataTable, TBody, THead, Th } from "@/components/table";
import { Badge, Panel, Section } from "@/components/ui";
import { AccessEventRow, type AccessEvent } from "./access-event-row";
import { STATUS_LABEL, STATUS_TONE, accessOrigin, type PersonStatus } from "./labels";
import { PersonRoleForm } from "./person-role-form";
import { PersonSecurity } from "./person-security";

type Person = {
  id: string; name: string | null; email: string | null; githubLogin: string | null; image: string | null; role: Role;
  status: PersonStatus; accessExpiresAt: Date | null; isOrgMember: boolean; accessGrant: string | null;
  teams: { role: "LEAD" | "MEMBER"; team: { name: string; slug: string } }[];
};

/**
 * O acesso de uma pessoa, no lugar da lista. Papel e Segurança são seções separadas (achado F4 da
 * auditoria de UX de 02/10/2026): salvar o papel é inofensivo; gerar link de senha e suspender, não.
 * `roleOptions` são os papéis que quem está logado pode dar (regra canChangeRole); vazio = só leitura.
 */
export function PersonDetail({ person, isSelf, canManage, canResetPassword, roleOptions, events, targets }: {
  person: Person; isSelf: boolean; canManage: boolean; canResetPassword: boolean; roleOptions: Role[];
  events: AccessEvent[]; targets: Record<string, string>;
}) {
  const label = personLabel(person);
  const details = [person.email, person.githubLogin ? `@${person.githubLogin}` : null].filter((v) => v && v !== label).join(" · ");
  const editableRole = canManage && !isSelf && roleOptions.length > 1;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <PersonAvatar person={person} />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">{label}</h2>
            {details && <p className="text-sm text-muted">{details}</p>}
          </div>
        </div>
        <Badge tone={STATUS_TONE[person.status]}>{STATUS_LABEL[person.status]}</Badge>
      </header>

      <Panel title="Acesso">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted">Origem</dt><dd className="mt-0.5">{accessOrigin(person)}</dd></div>
          <div><dt className="text-xs text-muted">Times</dt><dd className="mt-0.5">{person.teams.length === 0 ? "Nenhum" : person.teams.map((t) => t.team.name).join(", ")}</dd></div>
          <div>
            <dt className="text-xs text-muted">Prazo do acesso</dt>
            <dd className="mt-0.5">{person.accessExpiresAt ? `até ${person.accessExpiresAt.toLocaleDateString("pt-BR")}` : "sem prazo"}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Papel">
        {editableRole ? (
          <PersonRoleForm userId={person.id} current={person.role} options={roleOptions} />
        ) : (
          <p className="text-sm">
            <span className="font-semibold">{ROLE_LABEL[person.role]}</span>
            <span className="text-muted">
              {isSelf ? ". Você não pode mudar o próprio papel." : !canManage ? ". Só quem gerencia pessoas muda o papel." : ". Você não pode mudar o papel desta pessoa."}
            </span>
          </p>
        )}
      </Panel>

      <Section title="Eventos de acesso" description="Os últimos 20 desta pessoa. O histórico completo está na visão Histórico.">
        {events.length === 0 ? (
          <p className="text-sm text-muted">Nenhum evento de acesso desta pessoa.</p>
        ) : (
          <DataTable caption={`Eventos de acesso de ${label}`} minWidth={480}>
            <THead>
              <Th>Quando</Th>
              <Th>O que aconteceu</Th>
            </THead>
            <TBody>
              {events.map((e) => <AccessEventRow key={e.id} entry={e} targets={targets} />)}
            </TBody>
          </DataTable>
        )}
      </Section>

      {canManage && !isSelf && (
        <Panel title="Segurança">
          <PersonSecurity userId={person.id} suspended={person.status === "SUSPENDED"} canResetPassword={canResetPassword} />
        </Panel>
      )}
    </div>
  );
}
