import { readPageRequest, type QueryParams } from "@api-hub/core";
import { Pagination } from "@/components/pagination";
import { CreateModal } from "../_registry/forms/create-modal";
import { LinkForm } from "../_registry/forms/link-form";
import { requireNavAccess } from "../_registry/guard";
import { LinksTable } from "../_registry/links-table";
import { firstParam } from "../_registry/params";
import { activeServiceOptions, linksPage, managedServices, repositoryOptions } from "../_registry/query";
import { RegistryHeader } from "../_registry/registry-header";

export default async function LinksRegistryPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const actor = await requireNavAccess("/admin/links");
  const sp = await searchParams;
  // Contrato de URL: /admin/links?from=<id>&fromKind=service|repository#new-link abre o cadastro com o "De" já escolhido.
  const fromId = firstParam(sp.from);
  const fromKind = firstParam(sp.fromKind);
  const start: { id: string; kind: "service" | "repository" } | undefined =
    fromId && (fromKind === "service" || fromKind === "repository") ? { id: fromId, kind: fromKind } : undefined;
  const [{ items, info }, mine, targets, repositories] = await Promise.all([
    linksPage(readPageRequest(sp)),
    managedServices(actor),
    activeServiceOptions(),
    repositoryOptions(),
  ]);

  return (
    <div className="max-w-5xl space-y-6">
      <RegistryHeader
        tour="links-header"
        title="Vínculos"
        description="Quem depende de quem: um vínculo registra que um serviço ou repositório se liga a outro, e é ele que alimenta o Mapa de ligações."
        action={(
          <CreateModal
            id="new-link"
            tour="links-new"
            label="Novo vínculo"
            title="Novo vínculo"
            description="Escolha de onde sai e para onde vai. Um item não pode se ligar a ele mesmo."
            size="md"
            tone="primary"
          >
            <LinkForm
              services={mine.filter((s) => !s.archivedAt).map((s) => ({ id: s.id, label: s.name }))}
              targets={targets}
              repositories={repositories}
              start={start}
            />
          </CreateModal>
        )}
      />
      <LinksTable
        tour="links-list"
        rows={items}
        pagination={<Pagination info={info} noun={["vínculo", "vínculos"]} params={sp} />}
      />
    </div>
  );
}
