import { prisma } from "@api-hub/db";
import { can, canManageService, countLabel, pageInfo, readPageRequest } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { EnvBadge } from "@/components/env";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { DataTable, SrOnly, TBody, THead, Th } from "@/components/table";
import { Section } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { CopyEnvForm } from "../forms/copy-env-form";
import { EnvVarForm } from "../forms/env-var-form";
import { EnvVarRow } from "./env-var-row";
import { EmptyEnvVars } from "./empty-env-vars";
import type { HrefFor, Search, ServiceDetail } from "../types";

type Env = { id: string; slug: string; name: string; color: string; isProduction?: boolean };

/** Aba "Variáveis de ambiente": lista, edição e cópia entre ambientes. */
export async function EnvVarsTab({ user, service, env, envs, editingKey, slug, hrefFor, params }: {
  user: CurrentUser; service: ServiceDetail; env: Env; envs: Env[]; editingKey?: string; slug: string; hrefFor: HrefFor; params: Search;
}) {
  if (!can(user, "envvars:read")) return <EmptyState title="Sem acesso às variáveis" description="Você não tem permissão para ver variáveis de ambiente." />;
  const where = { serviceId: service.id, environmentId: env.id };
  const info = pageInfo(await prisma.serviceEnvVar.count({ where }), readPageRequest(params));
  const [vars, editing] = await Promise.all([
    prisma.serviceEnvVar.findMany({ where, orderBy: { key: "asc" }, skip: info.skip, take: info.take }),
    editingKey ? prisma.serviceEnvVar.findFirst({ where: { ...where, key: editingKey } }) : null,
  ]);
  const canEdit = canManageService(user, service, "envvars:edit");
  const canReveal = canManageService(user, service, "envvars:reveal");
  // "Editar" e "Cancelar edição" não tiram a pessoa da página da lista em que ela estava.
  const hrefKeepingPage: HrefFor = (patch) => hrefFor({ page: params.page, size: params.size, ...patch });

  return (
    <div className="space-y-8">
      <Section
        title={<>Variáveis em <EnvBadge env={env} small /></>}
        description={`${countLabel(info.total, "variável", "variáveis")}. Segredos ficam cifrados; revelar fica registrado na auditoria.`}
        action={
          <span className="flex flex-wrap items-center gap-3">
            <a href={`/api/services/${slug}/dotenv?env=${env.slug}`} className="text-sm text-accent">Baixar .env (sem segredos)</a>
            {canEdit && envs.length > 1 && (
              <FormModal label="Copiar de outro ambiente" title={`Copiar chaves para ${env.name}`}>
                <CopyEnvForm serviceId={service.id} envs={envs} toEnvId={env.id} toName={env.name} />
              </FormModal>
            )}
            {canEdit && (
              <FormModal label="Nova variável" title={`Nova variável em ${env.name}`} tone="primary" size="md">
                <EnvVarForm serviceId={service.id} environmentId={env.id} envName={env.name} />
              </FormModal>
            )}
          </span>
        }
      >
        {info.total === 0 ? (
          <EmptyEnvVars envName={env.name} canEdit={canEdit} />
        ) : (
          <DataTable caption={`Variáveis de ambiente em ${env.name}`} minWidth={720} pagination={<Pagination info={info} noun={["variável", "variáveis"]} params={params} />}>
            <THead>
              <Th>Nome</Th>
              <Th>Valor</Th>
              <Th hideBelow="md">Descrição</Th>
              <Th align="right"><SrOnly>Ações</SrOnly></Th>
            </THead>
            <TBody>
              {vars.map((v) => <EnvVarRow key={v.id} envVar={v} canEdit={canEdit} canReveal={canReveal} hrefFor={hrefKeepingPage} />)}
            </TBody>
          </DataTable>
        )}
      </Section>
      {canEdit && editing && (
        <FormModal title={`Editar ${editing.key} em ${env.name}`} size="md" forced closeHref={hrefKeepingPage({ var: "" })}>
          <EnvVarForm key={editing.id} serviceId={service.id} environmentId={env.id} envName={env.name} current={editing} />
        </FormModal>
      )}
    </div>
  );
}
