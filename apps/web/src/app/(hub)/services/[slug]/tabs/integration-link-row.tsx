import Link from "next/link";
import { RESOURCE_KIND_LABEL, RESOURCE_RELATION_LABEL } from "@api-hub/core";
import { Markdown } from "@/components/markdown";
import { CellTitle, RowActions, Td, Tr } from "@/components/table";
import { unlinkResource } from "../actions";
import { UndoRemove } from "../forms/undo-remove";
import type { ServiceResourceLink } from "./integrations-tab";

/** Uma linha da tabela "Integrações externas" do serviço. */
export function IntegrationLinkRow({ link, envSlug, currentServiceId, canEdit }: { link: ServiceResourceLink; envSlug: string; currentServiceId: string; canEdit: boolean }) {
  const others = link.resource.services.filter((s) => s.serviceId !== currentServiceId);
  return (
    <Tr>
      <Td>
        <CellTitle
          title={link.resource.name}
          href={`/integrations/${link.resource.slug}?env=${envSlug}`}
          meta={`${RESOURCE_KIND_LABEL[link.resource.kind]}${link.resource.provider ? ` · ${link.resource.provider}` : ""}`}
        >
          {link.note && <div className="mt-1 text-muted"><Markdown compact>{link.note}</Markdown></div>}
        </CellTitle>
      </Td>
      <Td>{RESOURCE_RELATION_LABEL[link.relation]}</Td>
      <Td mono>{link.resource.endpoints[0]?.value ?? <span className="font-sans text-muted">não informado</span>}</Td>
      <Td hideBelow="lg" muted>
        {others.length === 0 ? "—" : others.map((s) => (
          <Link key={s.id} href={`/services/${s.service.slug}`} className="block text-ink hover:text-accent">{s.service.name} {RESOURCE_RELATION_LABEL[s.relation]} {link.resource.name}</Link>
        ))}
      </Td>
      <Td align="right">
        {canEdit && (
          <RowActions>
            <UndoRemove action={unlinkResource} id={link.id} removedLabel="Integração removida" />
          </RowActions>
        )}
      </Td>
    </Tr>
  );
}
