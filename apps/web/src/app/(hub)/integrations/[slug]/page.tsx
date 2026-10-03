import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@api-hub/db";
import { RESOURCE_KIND_LABEL, RESOURCE_RELATION_LABEL, can, canSeeService, paginate, readPageRequest } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { getEnvironments } from "@/lib/install";
import { EnvBadge } from "@/components/env";
import { Markdown } from "@/components/markdown";
import { Button, Input, Panel, Section } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { CellTitle, DataTable, TBody, THead, Td, Th, Tr } from "@/components/table";
import { deleteResource } from "../actions";
import { ResourceForm } from "../form";

export default async function ResourcePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ erro?: string; page?: string; size?: string }> }) {
  const user = await requirePermission("catalog:read");
  const { slug } = await params;
  const sp = await searchParams;
  const { erro } = sp;
  const envs = await getEnvironments();
  const r = await prisma.externalResource.findUnique({
    where: { slug },
    include: { endpoints: true, services: { include: { service: true }, orderBy: [{ relation: "asc" }, { service: { name: "asc" } }] } },
  });
  if (!r) notFound();
  const services = r.services.filter((s) => !s.service.archivedAt && canSeeService(user, s.service));
  // A visibilidade é decidida serviço a serviço (RN-30), então a página é cortada em memória.
  const { items: servicesPage, info } = paginate(services, readPageRequest(sp));
  const canEdit = can(user, "link:edit");

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <Link href="/integrations" className="text-sm text-muted hover:text-ink">Integrações externas</Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{r.name}</h1>
          <span className="text-sm text-muted">{RESOURCE_KIND_LABEL[r.kind]}{r.provider ? ` · ${r.provider}` : ""}</span>
          {canEdit && (
            <FormModal label="Editar" title="Editar integração" wide>
              <ResourceForm envs={envs} resource={r} />
            </FormModal>
          )}
        </div>
        {r.docsUrl && <a href={r.docsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-accent">Documentação oficial ↗</a>}
      </header>

      {r.description && <Panel><Markdown>{r.description}</Markdown></Panel>}
      <Section title="Endereços por ambiente">
            <DataTable caption="Endereço da integração em cada ambiente" minWidth={480}>
              <THead>
                <Th width={200}>Ambiente</Th>
                <Th>Endereço</Th>
              </THead>
              <TBody>
                {envs.map((e) => (
                  <Tr key={e.id}>
                    <Td nowrap><EnvBadge env={e} small /> <span className="ml-1">{e.name}</span></Td>
                    <Td mono>{r.endpoints.find((x) => x.environmentId === e.id)?.value ?? <span className="font-sans text-muted">não informado</span>}</Td>
                  </Tr>
                ))}
              </TBody>
            </DataTable>
        </Section>

      <Section
        title={`Serviços que usam (${services.length})`}
        action={<Link href={`/graph?focus=x:${r.id}`} className="text-sm text-accent">Ver no mapa</Link>}
      >
        {services.length === 0 ? (
          <EmptyState title="Nenhum serviço usa esta integração" description="Ou nenhum que você tenha permissão para ver." />
        ) : (
          <DataTable caption="Serviços que usam esta integração" minWidth={480} pagination={<Pagination info={info} noun={["serviço", "serviços"]} params={sp} />}>
            <THead>
              <Th>Serviço</Th>
              <Th>Relação</Th>
            </THead>
            <TBody>
              {servicesPage.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <CellTitle title={s.service.name} href={`/services/${s.service.slug}?tab=integrations`}>
                      {s.note && <div className="mt-1 text-muted"><Markdown compact>{s.note}</Markdown></div>}
                    </CellTitle>
                  </Td>
                  <Td muted>{RESOURCE_RELATION_LABEL[s.relation]} {r.name}</Td>
                </Tr>
              ))}
            </TBody>
          </DataTable>
        )}
      </Section>

      {canEdit && (
        <FormModal label="Excluir integração" title="Excluir integração" tone="quiet">
          <form action={deleteResource} className="space-y-4">
            <input type="hidden" name="id" value={r.id} />
            <p className="text-sm text-muted">
              {r.services.length === 0 && "Remove a integração."}
              {r.services.length === 1 && "Remove a integração e a ligação com 1 serviço."}
              {r.services.length > 1 && `Remove a integração e as ${r.services.length} ligações com serviços.`}
              {" "}Digite EXCLUIR para confirmar.
            </p>
            <Input name="confirm" className="w-40" autoComplete="off" />
            <div className="flex items-center gap-3">
              <Button tone="danger">Excluir</Button>
              {erro && <span className="text-sm text-danger">Confirmação incorreta.</span>}
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
}
