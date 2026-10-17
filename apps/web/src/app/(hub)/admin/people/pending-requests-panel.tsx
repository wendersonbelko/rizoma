import { CardList } from "@/components/card-list";
import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/ui";
import { AccessRequestItem } from "./access-request-item";

type AccessRequest = Parameters<typeof AccessRequestItem>[0]["request"];

/** "Solicitações de acesso" aguardando decisão (achado V4: antes "Pedidos"). A decisão de cada uma vive em AccessRequestItem. */
export function PendingRequestsPanel({ requests, canGrantAdmin }: { requests: AccessRequest[]; canGrantAdmin: boolean }) {
  return (
    <Section title={`Solicitações de acesso (${requests.length})`} description="Quem pediu acesso e ainda não teve uma decisão.">
      {requests.length === 0 ? (
        <EmptyState title="Nenhuma solicitação aberta" description="Novas solicitações de acesso aparecem aqui." />
      ) : (
        <CardList>
          {requests.map((r) => <AccessRequestItem key={r.id} request={r} canGrantAdmin={canGrantAdmin} />)}
        </CardList>
      )}
    </Section>
  );
}
