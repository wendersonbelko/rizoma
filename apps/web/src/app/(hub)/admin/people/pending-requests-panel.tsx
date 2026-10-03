import { CardList } from "@/components/card-list";
import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/ui";
import { AccessRequestItem } from "./access-request-item";

type AccessRequest = Parameters<typeof AccessRequestItem>[0]["request"];

/** "Pedidos aguardando" — a decisão de cada um vive em AccessRequestItem. */
export function PendingRequestsPanel({ requests, canGrantAdmin }: { requests: AccessRequest[]; canGrantAdmin: boolean }) {
  return (
    <Section title={`Pedidos aguardando (${requests.length})`} description="Quem pediu acesso e ainda não teve uma decisão.">
      {requests.length === 0 ? (
        <EmptyState title="Nenhum pedido aberto" description="Novos pedidos de acesso aparecem aqui." />
      ) : (
        <CardList>
          {requests.map((r) => <AccessRequestItem key={r.id} request={r} canGrantAdmin={canGrantAdmin} />)}
        </CardList>
      )}
    </Section>
  );
}
