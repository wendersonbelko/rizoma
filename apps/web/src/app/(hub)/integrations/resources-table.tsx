import Link from "next/link";
import type { ReactNode } from "react";
import { RESOURCE_KIND_LABEL, RESOURCE_RELATION_LABEL, countLabel, type ResourceKind, type ResourceRelation } from "@api-hub/core";
import { CellTitle, DataTable, TBody, THead, Td, Th, Tr } from "@/components/table";
import { Badge } from "@/components/ui";

type Resource = {
  id: string; slug: string; name: string; kind: ResourceKind; provider: string | null;
  services: { id: string; relation: ResourceRelation; service: { slug: string; name: string; archivedAt: Date | null } }[];
};

/** Listagem de integrações externas — mesma tabela do Catálogo de APIs. */
export function ResourcesTable({ resources, pagination }: { resources: Resource[]; pagination?: ReactNode }) {
  return (
    <DataTable tour="integrations-list" caption="Integrações externas" minWidth={640} pagination={pagination}>
      <THead>
        <Th>Integração</Th>
        <Th>Tipo</Th>
        <Th hideBelow="md">Usada por</Th>
      </THead>
      <TBody>
        {resources.map((r) => {
          const active = r.services.filter((s) => !s.service.archivedAt);
          return (
            <Tr key={r.id}>
              <Td><CellTitle title={r.name} href={`/integrations/${r.slug}`} meta={r.provider ?? undefined} /></Td>
              <Td><Badge>{RESOURCE_KIND_LABEL[r.kind]}</Badge></Td>
              <Td hideBelow="md" muted>
                {active.length === 0 ? "Nenhum serviço vinculado" : (
                  <ul className="space-y-0.5">
                    {active.slice(0, 3).map((s) => (
                      <li key={s.id}>
                        <Link href={`/services/${s.service.slug}?tab=integrations`} className="text-ink hover:text-accent">{s.service.name}</Link>
                        {" "}{RESOURCE_RELATION_LABEL[s.relation]} {r.name}
                      </li>
                    ))}
                    {active.length > 3 && <li>+{countLabel(active.length - 3, "serviço", "serviços")}</li>}
                  </ul>
                )}
              </Td>
            </Tr>
          );
        })}
      </TBody>
    </DataTable>
  );
}
