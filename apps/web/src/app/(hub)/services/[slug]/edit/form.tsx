"use client";

import { useActionState, useEffect, useState } from "react";
import type { SourceProvider } from "@api-hub/core/sources";
import { DirtyForm } from "@/components/save-bar";
import { Notice, Panel } from "@/components/ui";
import { updateService, type EditResult } from "./actions";
import { ServiceFields, type ServiceFieldsProps } from "./service-fields";
import { SpecSourceFields, type SpecSourceFieldsProps } from "./spec-source-fields";

type Props = {
  service: ServiceFieldsProps["service"] & { id: string };
  teams: ServiceFieldsProps["teams"];
  slugLocked: boolean;
  allowNoTeam: boolean;
  source: SpecSourceFieldsProps["service"];
  repos: { id: string; fullName: string; provider: SourceProvider }[];
  integrations: SourceProvider[];
  canToken: boolean;
};

/**
 * Edição do serviço num único formulário (achado F1 da auditoria de UX de 02/10/2026): dados e origem da spec
 * são salvos juntos por `updateService`. O botão "Salvar" só aparece quando algo mudou (DirtyForm) e a página avisa
 * antes de sair com edição pendente.
 */
export function EditServiceForm({ service, teams, slugLocked, allowNoTeam, source, repos, integrations, canToken }: Props) {
  const [state, action] = useActionState<EditResult, FormData>(updateService, { ok: false });
  const errors = state.ok ? undefined : state.errors;
  return (
    <div className="space-y-4">
      <SavedNotice state={state} />
      <DirtyForm action={action} error={state.ok ? undefined : state.message} saveLabel="Salvar alterações" className="space-y-6">
        <input type="hidden" name="id" value={service.id} />
        <Panel title="Dados do serviço">
          <ServiceFields service={service} teams={teams} slugLocked={slugLocked} allowNoTeam={allowNoTeam} errors={errors} />
        </Panel>
        <Panel title="Origem da spec" id="spec-source">
          <SpecSourceFields service={source} repos={repos} integrations={integrations} canToken={canToken} errors={errors} />
        </Panel>
      </DirtyForm>
    </div>
  );
}

/**
 * O que a ação devolveu depois de salvar (ex.: o hub.json foi ou não gravado no repositório). A barra do DirtyForm
 * some ao salvar, então o recado de sucesso vive aqui em cima e some sozinho depois de alguns segundos.
 */
function SavedNotice({ state }: { state: EditResult }) {
  const [hiddenFor, setHiddenFor] = useState<EditResult | null>(null);
  useEffect(() => {
    if (!state.ok || !state.message) return;
    const timer = window.setTimeout(() => setHiddenFor(state), 8000);
    return () => window.clearTimeout(timer);
  }, [state]);
  if (!state.ok || !state.message || hiddenFor === state) return null;
  return <Notice title="Alterações salvas">{state.message.replace(/^Alterações salvas\.\s*/, "") || "Tudo certo."}</Notice>;
}
