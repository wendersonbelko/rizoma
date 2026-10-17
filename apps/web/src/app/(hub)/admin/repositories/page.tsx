import { can, readPageRequest, type QueryParams } from "@api-hub/core";
import { githubTokenSource } from "@/lib/github-token";
import { Pagination } from "@/components/pagination";
import { CreateModal } from "../_registry/forms/create-modal";
import { RepositoryForm } from "../_registry/forms/repository-form";
import { requireNavAccess } from "../_registry/guard";
import { configuredSourceProviders, repositoriesPage } from "../_registry/query";
import { RegistryHeader } from "../_registry/registry-header";
import { RepositoriesTable } from "../_registry/repositories-table";

export default async function RepositoriesRegistryPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const actor = await requireNavAccess("/admin/repositories");
  const sp = await searchParams;
  const [{ rows, info }, providers, githubToken] = await Promise.all([
    repositoriesPage(readPageRequest(sp)),
    configuredSourceProviders(),
    githubTokenSource(actor.id),
  ]);

  return (
    <div className="max-w-5xl space-y-6">
      <RegistryHeader
        tour="repositories-header"
        title="Repositórios"
        description="Os repositórios de código que o hub conhece. Para ligar um deles a um serviço, crie o vínculo em Vínculos."
        action={(
          <CreateModal
            id="new-repository"
            tour="repositories-new"
            label="Novo repositório"
            title="Novo repositório"
            description="O hub confirma que o repositório existe antes de guardá-lo."
            tone="primary"
          >
            <RepositoryForm providers={providers} githubToken={githubToken} canConfigureSources={can(actor, "settings:manage")} />
          </CreateModal>
        )}
      />
      <RepositoriesTable
        tour="repositories-list"
        rows={rows}
        pagination={<Pagination info={info} noun={["repositório", "repositórios"]} params={sp} />}
      />
    </div>
  );
}
