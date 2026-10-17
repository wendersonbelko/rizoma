import type { ReactNode } from "react";
import { can } from "@api-hub/core";
import { DataTable, SrOnly, TBody, THead, Th } from "@/components/table";
import type { CurrentUser } from "@/lib/guards";
import { ServiceRow } from "./service-row";
import { HealthLegend, hasProductionEnv } from "./service-health";
import type { CatalogService } from "./query";

type Env = { id: string; slug: string; name: string; color: string; isProduction?: boolean };

export function ServiceTable({ services, envs, user, pagination }: { services: CatalogService[]; envs: Env[]; user: CurrentUser; pagination?: ReactNode }) {
  // A coluna de ações só existe para quem tem a permissão de editar serviço; para o leitor seria uma coluna vazia.
  const showActions = can(user, "service:edit");
  return (
    <>
      <DataTable tour="catalog-list" caption="Serviços do catálogo" minWidth={720} pagination={pagination}>
        <THead>
          <Th>Serviço</Th>
          <Th>Time</Th>
          <Th>Ambientes</Th>
          <Th hideBelow="md">Vínculos</Th>
          {showActions && <Th align="right"><SrOnly>Ações</SrOnly></Th>}
        </THead>
        <TBody>
          {services.map((s) => <ServiceRow key={s.id} service={s} envs={envs} user={user} showActions={showActions} />)}
        </TBody>
      </DataTable>
      <HealthLegend production={hasProductionEnv(envs)} />
    </>
  );
}
