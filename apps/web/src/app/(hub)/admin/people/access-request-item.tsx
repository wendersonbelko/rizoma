import { CardListItem } from "@/components/card-list";
import { CellTitle } from "@/components/table";
import { Badge, Button, Input, Select } from "@/components/ui";
import { decideAccessRequest } from "./actions";
import { who } from "./labels";

type AccessRequest = {
  id: string; reason: string | null; isOrgMember: boolean; createdAt: Date;
  user: { name: string | null; image: string | null; githubLogin: string | null; email: string | null };
};

/** Um pedido de acesso pendente, com a decisão (aprovar/recusar) logo abaixo. */
export function AccessRequestItem({ request, canGrantAdmin }: { request: AccessRequest; canGrantAdmin: boolean }) {
  return (
    <CardListItem>
      <div className="mb-3">
        <CellTitle
          title={request.user.name ?? who(request.user)}
          meta={<>{who(request.user)} · pedido em {request.createdAt.toLocaleDateString("pt-BR")}</>}
          badge={request.isOrgMember ? <Badge tone="accent">vínculo comprovado</Badge> : <Badge tone="wait">sem vínculo comprovado</Badge>}
          leading={request.user.image ? <img src={request.user.image} alt="" className="size-9 rounded-full" /> : undefined}
        />
      </div>
      {request.reason ? (
        <blockquote className="mb-3 max-w-prose border-l-2 border-line pl-3 text-sm">{request.reason}</blockquote>
      ) : (
        <p className="mb-3 text-sm text-muted">Sem justificativa.</p>
      )}
      <form action={decideAccessRequest} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="requestId" value={request.id} />
        <Select name="role" defaultValue="VIEWER" className="w-auto">
          <option value="VIEWER">VIEWER</option>
          <option value="MAINTAINER">MAINTAINER</option>
          {canGrantAdmin && <option value="ADMIN">ADMIN</option>}
        </Select>
        <Select name="expiresInDays" defaultValue={request.isOrgMember ? "0" : "90"} className="w-auto">
          <option value="0">Sem prazo</option>
          <option value="30">Por 30 dias</option>
          <option value="90">Por 90 dias</option>
          <option value="180">Por 180 dias</option>
        </Select>
        <Input name="note" placeholder="Observação (opcional)" className="w-56" />
        <Button name="decision" value="approve">Aprovar</Button>
        <Button name="decision" value="reject" tone="danger">Recusar</Button>
      </form>
    </CardListItem>
  );
}
