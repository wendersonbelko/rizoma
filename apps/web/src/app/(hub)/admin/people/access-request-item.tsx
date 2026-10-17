import { ROLE_LABEL, personLabel, relativeTime } from "@api-hub/core";
import { CardListItem } from "@/components/card-list";
import { PersonAvatar } from "@/components/person-avatar";
import { CellTitle } from "@/components/table";
import { Badge, Button, Field, Input, Select } from "@/components/ui";
import { decideAccessRequest } from "./actions";

type AccessRequest = {
  id: string; reason: string | null; isOrgMember: boolean; createdAt: Date;
  user: { name: string | null; image: string | null; githubLogin: string | null; email: string | null };
};

/** Uma solicitação de acesso pendente, com a decisão (aprovar ou recusar) logo abaixo. */
export function AccessRequestItem({ request, canGrantAdmin }: { request: AccessRequest; canGrantAdmin: boolean }) {
  const label = personLabel(request.user);
  const contact = request.user.email && request.user.email !== label ? request.user.email : undefined;
  return (
    <CardListItem>
      <div className="mb-3">
        <CellTitle
          title={label}
          meta={<>{contact ? `${contact} · ` : ""}solicitou <time dateTime={request.createdAt.toISOString()} title={request.createdAt.toLocaleString("pt-BR")}>{relativeTime(request.createdAt)}</time></>}
          badge={request.isOrgMember ? <Badge tone="accent">vínculo comprovado</Badge> : <Badge tone="wait">sem vínculo comprovado</Badge>}
          leading={<PersonAvatar person={request.user} />}
        />
      </div>
      {request.reason ? (
        <blockquote className="mb-3 max-w-prose border-l-2 border-line pl-3 text-sm">{request.reason}</blockquote>
      ) : (
        <p className="mb-3 text-sm text-muted">Sem justificativa.</p>
      )}
      <form action={decideAccessRequest} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="requestId" value={request.id} />
        <Field label="Papel">
          <Select name="role" defaultValue="VIEWER" className="w-auto">
            <option value="VIEWER">{ROLE_LABEL.VIEWER}</option>
            <option value="MAINTAINER">{ROLE_LABEL.MAINTAINER}</option>
            {canGrantAdmin && <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>}
          </Select>
        </Field>
        <Field label="Prazo do acesso">
          <Select name="expiresInDays" defaultValue={request.isOrgMember ? "0" : "90"} className="w-auto">
            <option value="0">Sem prazo</option>
            <option value="30">Por 30 dias</option>
            <option value="90">Por 90 dias</option>
            <option value="180">Por 180 dias</option>
          </Select>
        </Field>
        <Field label="Observação (opcional)"><Input name="note" className="w-56" /></Field>
        <div className="flex items-center gap-2 pb-px">
          <Button name="decision" value="approve">Aprovar acesso</Button>
          <Button name="decision" value="reject" tone="danger">Recusar</Button>
        </div>
      </form>
    </CardListItem>
  );
}
