import { LifecycleBadge } from "@/components/lifecycle-badge";
import { TagList } from "@/components/tag-list";
import { CellTitle, Td, Tr } from "@/components/table";
import { TeamCell } from "@/components/team-cell";
import { ServiceEnvChips } from "./service-env-chips";
import { ServiceLinksSummary } from "./service-links-summary";
import { CHANNEL_PROTOCOL_LABEL, RESOURCE_KIND_LABEL, SERVICE_KIND_LABEL } from "@api-hub/core/types";
import type { CatalogService } from "./query";

type Env = { id: string; slug: string; name: string; color: string; isProduction?: boolean };

/** Uma linha do catálogo: só compõe células padrão com o conteúdo do serviço. */
export function ServiceRow({ service, envs }: { service: CatalogService; envs: Env[] }) {
  const offers = [...new Set(service.channels.map((c) => CHANNEL_PROTOCOL_LABEL[c.protocol]))];
  const uses = [...new Set(service.resources.map((r) => r.resource.provider || RESOURCE_KIND_LABEL[r.resource.kind]))];
  const landscape = [offers.length ? `oferece ${offers.join(", ")}` : "", uses.length ? `usa ${uses.join(", ")}` : ""].filter(Boolean).join(" · ");
  return (
    <Tr>
      <Td className="max-w-sm">
        <CellTitle
          title={service.name}
          href={`/services/${service.slug}`}
          badge={<><LifecycleBadge lifecycle={service.lifecycle} /> <span className="text-muted">{SERVICE_KIND_LABEL[service.kind]}</span></>}
          meta={
            <>
              {service.description ? <span className="line-clamp-1">{service.description}</span> : null}
              {landscape ? <span className="line-clamp-1 text-muted">{landscape}</span> : null}
            </>
          }
        >
          <TagList tags={service.tags} hrefFor={(t) => `/?tag=${t}`} />
        </CellTitle>
      </Td>
      <Td><TeamCell name={service.ownerTeam?.name} /></Td>
      <Td><ServiceEnvChips envs={envs} specs={service.specs} serviceSlug={service.slug} /></Td>
      <Td hideBelow="md" muted>
        <ServiceLinksSummary outgoing={service._count.outgoing} incoming={service._count.incoming} resources={service._count.resources} />
      </Td>
    </Tr>
  );
}
