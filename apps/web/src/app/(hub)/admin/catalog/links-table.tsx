import type { ReactNode } from "react";
import { LINK_KIND_LABEL, type LinkKind } from "@api-hub/core";
import { EmptyState } from "@/components/empty-state";
import { DataTable, SrOnly, TBody, THead, Th } from "@/components/table";
import { Badge } from "@/components/ui";
import { LinkRow } from "./link-row";

type ServiceDep = { id: string; kind: LinkKind; detected: boolean; from: { name: string }; to: { name: string } };
type RepoLink = { id: string; kind: LinkKind; from: { fullName: string }; to: { fullName: string } };
type Origin = "spec" | "manual" | "repository";
export type LinkItem = { id: string; type: "service" | "repository"; from: string; relation: string; to: string; origin: Origin };

const ORIGIN_LABEL: Record<Origin, string> = { spec: "declarado na spec", manual: "manual", repository: "repositórios" };

/**
 * Vínculos serviço→serviço e repositório→repositório numa lista só, em ordem alfabética de
 * origem e destino — ordem estável, para a paginação não repetir nem pular vínculos.
 */
export function linkItems(deps: ServiceDep[], repoLinks: RepoLink[]): LinkItem[] {
  return [
    ...deps.map((d) => ({ id: d.id, type: "service" as const, from: d.from.name, relation: LINK_KIND_LABEL[d.kind], to: d.to.name, origin: (d.detected ? "spec" : "manual") as Origin })),
    ...repoLinks.map((l) => ({ id: l.id, type: "repository" as const, from: l.from.fullName, relation: LINK_KIND_LABEL[l.kind], to: l.to.fullName, origin: "repository" as Origin })),
  ].sort((a, b) => a.from.localeCompare(b.from, "pt-BR") || a.to.localeCompare(b.to, "pt-BR"));
}

/** Vínculos já cadastrados. */
export function LinksTable({ rows, pagination }: { rows: LinkItem[]; pagination?: ReactNode }) {
  if (rows.length === 0) return <EmptyState title="Nenhum vínculo cadastrado" description="Crie o primeiro acima — ou direto no Mapa de ligações, pelo botão +." />;
  return (
    <DataTable caption="Vínculos cadastrados" minWidth={640} pagination={pagination}>
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
