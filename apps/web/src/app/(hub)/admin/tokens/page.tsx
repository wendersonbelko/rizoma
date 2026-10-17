import { readPageRequest, type QueryParams } from "@api-hub/core";
import { docUrl } from "@/lib/links";
import { Pagination } from "@/components/pagination";
import { CreateModal } from "../_registry/forms/create-modal";
import { LegacyHashAlias } from "../_registry/forms/legacy-hash-alias";
import { TokenForm } from "../_registry/forms/token-form";
import { requireNavAccess } from "../_registry/guard";
import { firstParam } from "../_registry/params";
import { managedServices, tokensPage } from "../_registry/query";
import { RegistryHeader } from "../_registry/registry-header";
import { TokensTable } from "../_registry/tokens-table";

export default async function TokensRegistryPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const actor = await requireNavAccess("/admin/tokens");
  const sp = await searchParams;
  const request = readPageRequest(sp);
  const [{ items, info }, mine] = await Promise.all([tokensPage(actor, request), managedServices(actor)]);
  const services = mine.filter((s) => !s.archivedAt).map((s) => ({ id: s.id, label: s.name }));

  return (
    <div className="max-w-5xl space-y-6">
      {/* Antes o modal abria por #tokens; o contrato agora é #new-token. */}
      <LegacyHashAlias from="tokens" to="new-token" />
      <RegistryHeader
        tour="tokens-header"
        title="Tokens de CI"
        description="Os tokens que o pipeline de CI usa para publicar a spec de cada serviço. O valor aparece só uma vez, quando você gera."
        action={(
          <CreateModal
            id="new-token"
            tour="tokens-new"
            label="Novo token"
            title="Novo token de CI"
            tone="primary"
          >
            {/* Contrato de URL: /admin/tokens?service=<id>#new-token já vem com o serviço escolhido. */}
            <TokenForm services={services} startServiceId={firstParam(sp.service)} docsHref={docUrl("receitas/publicar-pelo-github-actions")} />
          </CreateModal>
        )}
      />
      <TokensTable
        tour="tokens-list"
        rows={items}
        pagination={<Pagination info={info} noun={["token", "tokens"]} params={sp} />}
      />
    </div>
  );
}
