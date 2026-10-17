import { can, paginate, readPageRequest, type QueryParams } from "@api-hub/core";
import { Pagination } from "@/components/pagination";
import { CreateModal } from "../_registry/forms/create-modal";
import { ServiceForm } from "../_registry/forms/service-form";
import { requireNavAccess } from "../_registry/guard";
import { managedServices, teamsToOwn } from "../_registry/query";
import { RegistryHeader } from "../_registry/registry-header";
import { ServicesTable } from "../_registry/services-table";

export default async function ServicesRegistryPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const actor = await requireNavAccess("/admin/services");
  const sp = await searchParams;
  const canCreate = can(actor, "service:create");
  const [mine, teams] = await Promise.all([managedServices(actor), canCreate ? teamsToOwn(actor) : Promise.resolve([])]);
  const { items, info } = paginate(mine, readPageRequest(sp));

  return (
    <div className="max-w-5xl space-y-6">
      <RegistryHeader
        tour="services-header"
        title="Serviços"
        description="Os serviços que você mantém, inclusive os arquivados, que só você e quem administra o hub enxergam."
        action={canCreate ? (
          <CreateModal
            id="new-service"
            tour="services-new"
            label="Novo serviço"
            title="Novo serviço"
            description="Nome, time e tipo bastam. O resto você completa na página do serviço."
            tone="primary"
          >
            <ServiceForm teams={teams} requireTeam={!actor.permissions.has("service:edit_any")} />
          </CreateModal>
        ) : undefined}
      />
      <ServicesTable
        tour="services-list"
        rows={items}
        canCreate={canCreate}
        pagination={<Pagination info={info} noun={["serviço", "serviços"]} params={sp} />}
      />
    </div>
  );
}
