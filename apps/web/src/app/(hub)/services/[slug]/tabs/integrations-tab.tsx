import Link from "next/link";
import { prisma, type Prisma } from "@api-hub/db";
import { CHANNEL_PROTOCOL_LABEL, LINK_KIND_LABEL, SECONDARY_PAGE_SIZE, can, canManageService, paginate, readPageRequest } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { CellTitle, DataTable, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { Badge, Button, LinkButton, Section } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { ResourceLinkForm } from "../forms/resource-link-form";
import { ChannelForm } from "../forms/channel-form";
import { CallForm } from "../forms/call-form";
import { linkPreset, removeChannel } from "../actions";
import { UndoRemove } from "../forms/undo-remove";
import { IntegrationLinkRow } from "./integration-link-row";
import type { Search, ServiceDetail } from "../types";

export type ServiceResourceLink = Prisma.ServiceResourceGetPayload<{
  include: { resource: { include: { endpoints: true; services: { include: { service: { select: { slug: true; name: true } } } } } } };
}>;

type Env = { id: string; slug: string; name: string };

const PROTOCOL_TONE: Record<string, string> = {
  HTTP: "bg-accent/15 text-accent",
  GRPC: "bg-wait/15 text-wait",
  WEBSOCKET: "bg-ink/10 text-ink",
};

// Duas listagens na mesma aba, cada uma com os próprios parâmetros de página na URL.
const HUB_KEYS = { pageKey: "lpage", sizeKey: "lsize" };
const EXTERNAL_KEYS = { pageKey: "xpage", sizeKey: "xsize" };

/** Aba "Integrações": canais oferecidos, ligações com outros serviços do hub e integrações externas. */
export async function IntegrationsTab({ user, service, env, envs, params }: { user: CurrentUser; service: ServiceDetail; env: Env; envs: Env[]; params: Search }) {
  const [links, allResources, channels] = await Promise.all([
    prisma.serviceResource.findMany({
      where: { serviceId: service.id },
      include: { resource: { include: { endpoints: { where: { environmentId: env.id } }, services: { include: { service: { select: { slug: true, name: true } } } } } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.externalResource.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, kind: true } }),
    prisma.serviceChannel.findMany({
      where: { serviceId: service.id },
      include: { addresses: { include: { environment: { select: { name: true } } } } },
      orderBy: [{ protocol: "asc" }, { name: "asc" }],
    }),
  ]);
  const canEdit = canManageService(user, service);
  const hubLinks = [
    ...service.outgoing.map((d) => ({ id: d.id, direction: "out" as const, kind: d.kind, detected: d.detected, other: d.to })),
    ...service.incoming.map((d) => ({ id: d.id, direction: "in" as const, kind: d.kind, detected: d.detected, other: d.from })),
  ].sort((a, b) => a.other.name.localeCompare(b.other.name, "pt-BR") || a.direction.localeCompare(b.direction));
  const hubPage = paginate(hubLinks, readPageRequest(params, { ...HUB_KEYS, defaultSize: SECONDARY_PAGE_SIZE }));
  const externalPage = paginate(links, readPageRequest(params, { ...EXTERNAL_KEYS, defaultSize: SECONDARY_PAGE_SIZE }));

  return (
    <div className="space-y-8">
      <Section
        title="Canais"
        description="HTTP, gRPC e WebSocket que este sistema oferece, além do contrato da spec."
        action={
          <span className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">{channels.length === 0 ? "Nenhum canal extra" : `${channels.length} ${channels.length === 1 ? "canal" : "canais"}`}</span>
            {canEdit && (
              <FormModal label="Novo canal" title="Novo canal" size="md">
                <ChannelForm serviceId={service.id} envs={envs} />
              </FormModal>
            )}
          </span>
        }
      >
        {channels.length === 0 ? (
          <p className="text-sm text-muted">Nenhum canal além do HTTP da documentação.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
                {channels.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 rounded-panel border border-line bg-sheet px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PROTOCOL_TONE[c.protocol] ?? "bg-paper text-muted"}`}>{CHANNEL_PROTOCOL_LABEL[c.protocol]}</span>
                        <span className="text-sm font-semibold">{c.name}</span>
                      </p>
                      {c.addresses.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-muted">
                          {c.addresses.map((a) => (
                            <li key={a.environmentId} className="truncate"><span className="text-ink">{a.environment.name}</span> · <code className="font-mono">{a.value}</code></li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-muted">Sem endereço.</p>
                      )}
                    </div>
                    {canEdit && (
                      <UndoRemove action={removeChannel} id={c.id} removedLabel="Canal removido" />
                    )}
                  </li>
                ))}
              </ul>
        )}
      </Section>

      <Section
        title="Outros serviços do hub"
        description="Vínculos entre este serviço e os demais."
        action={
          <span className="flex flex-wrap items-center gap-3">
            {canEdit && (
              <FormModal label="Registrar chamada" title="Registrar chamada de endpoint">
                <CallForm serviceId={service.id} />
              </FormModal>
            )}
            {/* Contrato com a tela de Vínculos: abre o modal "Novo vínculo" com este serviço no "De". */}
            {canEdit && can(user, "link:edit") && <LinkButton href={`/admin/links?from=${service.id}&fromKind=service#new-link`} tone="quiet">Novo vínculo</LinkButton>}
            <Link href={`/graph?focus=s:${service.id}`} className="text-sm text-accent">Ver no mapa</Link>
          </span>
        }
      >
        {hubLinks.length === 0 ? (
          <EmptyState title="Nenhum vínculo registrado" description="Vínculos entre serviços aparecem aqui. Crie em Vínculos ou direto no Mapa de ligações." />
        ) : (
          <DataTable caption="Vínculos com outros serviços" minWidth={560} pagination={<Pagination info={hubPage.info} noun={["vínculo", "vínculos"]} params={params} {...HUB_KEYS} />}>
            <THead>
              <Th>Direção</Th>
              <Th>Serviço</Th>
              <Th>Relação</Th>
              <Th hideBelow="md">Origem</Th>
            </THead>
            <TBody>
              {hubPage.items.map((l) => (
                <Tr key={l.id}>
                  <Td>{l.direction === "out" ? <Badge tone="accent">sai daqui</Badge> : <Badge>chega aqui</Badge>}</Td>
                  <Td><CellTitle title={l.other.name} href={`/services/${l.other.slug}?env=${env.slug}`} /></Td>
                  <Td muted>{l.direction === "out" ? `este serviço ${LINK_KIND_LABEL[l.kind]} ${l.other.name}` : `${l.other.name} ${LINK_KIND_LABEL[l.kind]} este serviço`}</Td>
                  <Td hideBelow="md">{l.detected ? <Badge>declarado na spec</Badge> : <Badge>manual</Badge>}</Td>
                </Tr>
              ))}
            </TBody>
          </DataTable>
        )}
      </Section>

      <Section
        title="Integrações externas"
        description={`APIs de terceiros, filas, webhooks e bancos — com o endereço de ${env.name}.`}
        action={canEdit ? (
          <span className="flex flex-wrap items-center gap-2">
            <form action={linkPreset}><input type="hidden" name="serviceId" value={service.id} /><input type="hidden" name="preset" value="postgres" /><Button type="submit" tone="quiet">PostgreSQL</Button></form>
            <form action={linkPreset}><input type="hidden" name="serviceId" value={service.id} /><input type="hidden" name="preset" value="rabbit" /><Button type="submit" tone="quiet">RabbitMQ</Button></form>
            <FormModal label="Ligar integração" title="Ligar integração externa" tone="primary" size="md">
              <ResourceLinkForm serviceId={service.id} resources={allResources} />
            </FormModal>
          </span>
        ) : undefined}
      >
        {links.length === 0 ? (
          <EmptyState title="Nenhuma integração externa ligada" description="Use Ligar integração para conectar uma API, fila, webhook ou banco." />
        ) : (
          <DataTable caption="Integrações externas do serviço" minWidth={680} pagination={<Pagination info={externalPage.info} noun={["integração", "integrações"]} params={params} {...EXTERNAL_KEYS} />}>
            <THead>
              <Th>Integração</Th>
              <Th>Relação</Th>
              <Th>Endereço em {env.slug}</Th>
              <Th hideBelow="lg">Também usam</Th>
              <Th align="right"><SrOnly>Ações</SrOnly></Th>
            </THead>
            <TBody>
              {externalPage.items.map((l) => <IntegrationLinkRow key={l.id} link={l} envSlug={env.slug} currentServiceId={service.id} canEdit={canEdit} />)}
            </TBody>
          </DataTable>
        )}
      </Section>
    </div>
  );
}
