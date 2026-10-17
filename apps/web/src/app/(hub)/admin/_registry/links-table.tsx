import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { DataTable, SrOnly, TBody, THead, Th } from "@/components/table";
import { Badge } from "@/components/ui";
import { LinkRow } from "./link-row";
import type { LinkItem } from "./query";

const ORIGIN_LABEL: Record<LinkItem["origin"], string> = { spec: "Declarado na spec", manual: "Manual", repository: "Repositórios" };

/** Vínculos já cadastrados. */
export function LinksTable({ rows, pagination, tour }: { rows: LinkItem[]; pagination?: ReactNode; tour?: string }) {
  if (rows.length === 0) {
    return <EmptyState tour={tour} title="Nenhum vínculo cadastrado" description="Crie o primeiro em Novo vínculo. Também dá para vincular direto no Mapa de ligações, pelo botão +." />;
  }
  return (
    <DataTable tour={tour} caption="Vínculos cadastrados" minWidth={640} pagination={pagination}>
      <THead>
        <Th>De</Th>
        <Th>Relação</Th>
        <Th>Para</Th>
        <Th hideBelow="md">Origem</Th>
        <Th align="right"><SrOnly>Ações</SrOnly></Th>
      </THead>
      <TBody>
        {rows.map((l) => (
          <LinkRow key={l.id} type={l.type} id={l.id} from={l.from} relation={l.relation} to={l.to} origin={<Badge>{ORIGIN_LABEL[l.origin]}</Badge>} />
        ))}
      </TBody>
    </DataTable>
  );
}
