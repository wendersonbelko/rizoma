import type { ReactNode } from "react";
import { DataTable, TBody, THead, Th } from "@/components/table";
import { ServiceRow } from "./service-row";
import type { CatalogService } from "./query";

type Env = { id: string; slug: string; name: string; color: string; isProduction?: boolean };

export function ServiceTable({ services, envs, pagination }: { services: CatalogService[]; envs: Env[]; pagination?: ReactNode }) {
  return (
    <DataTable tour="catalog-list" caption="Serviços do catálogo" minWidth={720} pagination={pagination}>
      <THead>
        <Th>Serviço</Th>
        <Th>Time</Th>
        <Th>Ambientes</Th>
        <Th hideBelow="md">Ligações</Th>
      </THead>
      <TBody>
        {services.map((s) => <ServiceRow key={s.id} service={s} envs={envs} />)}
      </TBody>
    </DataTable>
  );
}
