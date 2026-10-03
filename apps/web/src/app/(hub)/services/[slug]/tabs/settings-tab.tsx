import { SPEC_SOURCE_LABEL, canManageService } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { Panel } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { renderServiceHubFile } from "@/lib/hub-manifest";
import { parseRepoSync } from "@/lib/repo-state";
import { HubFilePanel } from "../hub-file-panel";
import { RepoConflicts } from "../forms/repo-conflicts";
import { RepoSyncButton } from "../forms/repo-sync-button";
import { SpecUploadForm } from "../forms/spec-upload-form";
import { SyncButton } from "../forms/sync-button";
import type { ServiceDetail } from "../types";

type Env = { id: string; slug: string; name: string };

/** Aba Configurações: publicar a spec, sincronizar o repositório e mostrar o hub.json. */
export async function SettingsTab({ user, service, env }: {
  user: CurrentUser; service: ServiceDetail; env: Env;
}) {
  const canPublish = canManageService(user, service, "spec:publish");
  const canEdit = canManageService(user, service);
  const pulls = service.specSource === "URL_PULL" || service.specSource === "REPO_FILE";
  const hasSource = service.repositories.some((link) => link.role === "SOURCE");
  const conflicts = parseRepoSync(service.repoSync).conflicts;
  const text = await renderServiceHubFile(service.id);

  return (
    <div className="space-y-5">
      {conflicts.length > 0 && (
        <Panel title="Conflitos com o repositório">
          <p className="mb-4 text-sm text-muted">Os dois lados têm conteúdo. Nada foi sobrescrito.</p>
          <RepoConflicts serviceId={service.id} conflicts={conflicts} canEdit={canEdit} />
        </Panel>
      )}
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <Panel title="Publicar spec" action={<span className="text-sm text-muted">{env.name}</span>}>
        <p className="text-sm text-muted">A origem configurada é {SPEC_SOURCE_LABEL[service.specSource]}.</p>
        {canPublish ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FormModal label="Publicar spec" title={`Publicar spec em ${env.name}`} tone="primary">
              <SpecUploadForm serviceId={service.id} environmentId={env.id} envName={env.name} />
            </FormModal>
            {pulls && <SyncButton serviceId={service.id} />}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Você não publica spec neste serviço.</p>
        )}
      </Panel>

      <Panel title="hub.json">
        <p className="mb-5 text-sm text-muted">Arquivo da raiz do repositório. Se o token não consegue gravar, copie daqui e suba no código.</p>
        {text ? <HubFilePanel text={text} /> : <p className="text-sm text-muted">Ainda não há o que gerar.</p>}
        {canEdit && hasSource && <RepoSyncButton serviceId={service.id} />}
      </Panel>
    </div>
    </div>
  );
}
