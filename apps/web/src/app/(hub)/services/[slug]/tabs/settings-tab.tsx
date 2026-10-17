import Link from "next/link";
import { SPEC_SOURCE_LABEL, can, canManageService } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { LinkButton, Panel } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { renderServiceHubFile } from "@/lib/hub-manifest";
import { parseRepoSync } from "@/lib/repo-state";
import { HubFilePanel } from "../hub-file-panel";
import { SPEC_SOURCE_HELP } from "../spec-source-help";
import { RepoConflicts } from "../forms/repo-conflicts";
import { RepoSyncButton } from "../forms/repo-sync-button";
import { SpecUploadForm } from "../forms/spec-upload-form";
import { SyncButton } from "../forms/sync-button";
import type { ServiceDetail } from "../types";

type Env = { id: string; slug: string; name: string };

/** Aba Configurações: origem da spec, publicar a spec, sincronizar o repositório e mostrar o hub.json. */
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
      {/* Achado D3 da auditoria de UX de 02/10/2026: "Ver origem" do aviso da aba da API e o passo "Escolher como a spec chega" do checklist caem aqui. */}
      <Panel title="Origem da spec" id="origin" action={canEdit ? <LinkButton href={`/services/${service.slug}/edit#spec-source`} tone="quiet">Alterar origem</LinkButton> : undefined}>
        <p className="font-semibold">{SPEC_SOURCE_LABEL[service.specSource]}</p>
        <p className="mt-1 text-sm text-muted">{SPEC_SOURCE_HELP[service.specSource]}</p>
        {service.specSource === "CI_PUSH" && canEdit && can(user, "token:manage") && (
          <p className="mt-3 text-sm"><Link href={`/admin/tokens?service=${service.id}#new-token`} className="text-accent">Gerar token de CI</Link></p>
        )}
      </Panel>

      <Panel title="Publicar spec" action={<span className="text-sm text-muted">{env.name}</span>}>
        {canPublish ? (
          <div className="flex flex-wrap items-center gap-2">
            <FormModal label="Publicar spec" title={`Publicar spec em ${env.name}`} tone="primary">
              <SpecUploadForm serviceId={service.id} environmentId={env.id} envName={env.name} />
            </FormModal>
            {pulls && <SyncButton serviceId={service.id} />}
          </div>
        ) : (
          <p className="text-sm text-muted">Você não publica spec neste serviço.</p>
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
