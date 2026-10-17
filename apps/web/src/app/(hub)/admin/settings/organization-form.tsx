"use client";

import { ChipInput } from "@/components/chip-input";
import { Field, Input } from "@/components/ui";
import { saveOrganization } from "./actions";
import { SettingsForm } from "./form-primitives";

export function OrganizationForm({ orgName, orgSlug, orgs, domains, hasGithub }: { orgName: string; orgSlug: string; orgs: string[]; domains: string[]; hasGithub: boolean }) {
  return (
    <SettingsForm action={saveOrganization} saveLabel="Salvar organização">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da empresa *"><Input name="orgName" defaultValue={orgName} required /></Field>
        <Field label="Identificador" hint="Definido na instalação. Não muda."><Input value={orgSlug} disabled readOnly /></Field>
      </div>
      <Field label="Domínios de e-mail da empresa" hint="Digite um domínio e clique em +. Google, Microsoft, GitLab e OIDC: e-mail verificado desses domínios conta como vínculo com a empresa.">
        <ChipInput name="domains" defaultValues={domains} placeholder="belko.com.br" max={20} addLabel="Adicionar domínio" />
      </Field>
      {hasGithub && (
        <Field label="Organizações do GitHub aceitas" hint="Digite uma organização e clique em +. Ao remover uma, quem entrou por ela é conferido de novo no próximo acesso.">
          <ChipInput name="orgs" defaultValues={orgs} placeholder="belko-dev" max={10} addLabel="Adicionar organização" />
        </Field>
      )}
    </SettingsForm>
  );
}
