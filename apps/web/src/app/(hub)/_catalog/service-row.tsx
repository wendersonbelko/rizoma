import { canManageService } from "@api-hub/core";
import { SERVICE_KIND_LABEL } from "@api-hub/core/types";
import { LifecycleBadge } from "@/components/lifecycle-badge";
import { CellTitle, RowActionLink, RowActions, SrOnly, Td, Tr } from "@/components/table";
import { TeamCell } from "@/components/team-cell";
import { Badge } from "@/components/ui";
import type { CurrentUser } from "@/lib/guards";
import { ServiceEnvChips } from "./service-env-chips";
import { HealthDot, hasProductionEnv, isServiceHealthy } from "./service-health";
import { ServiceLinksSummary } from "./service-links-summary";
import type { CatalogService } from "./query";

type Env = { id: string; slug: string; name: string; color: string; isProduction?: boolean };

/**
 * Uma linha do catálogo, compacta (p. 15 da auditoria de UX de 02/10/2026): ponto de saúde, nome com
 * o selo do tipo, uma linha de descrição, time, versão por ambiente e vínculos. Tags e "oferece/usa"
 * saíram da lista: ficam na página do serviço.
 */
export function ServiceRow({ service, envs, user, showActions }: { service: CatalogService; envs: Env[]; user: CurrentUser; showActions: boolean }) {
  // Achado N4: quem gerencia o serviço edita direto da lista, sem passar pela lista de gestão do admin.
  const canEdit = showActions && canManageService(user, service);
  return (
    <Tr>
      <Td className="max-w-md">
        <CellTitle
          leading={<HealthDot healthy={isServiceHealthy(service.specs, envs)} production={hasProductionEnv(envs)} />}
          title={service.name}
          href={`/services/${service.slug}`}
          badge={<><Badge>{SERVICE_KIND_LABEL[service.kind]}</Badge><LifecycleBadge lifecycle={service.lifecycle} /></>}
          meta={service.description ? <span className="line-clamp-1">{service.description}</span> : undefined}
        />
      </Td>
      <Td><TeamCell name={service.ownerTeam?.name} /></Td>
      <Td><ServiceEnvChips envs={envs} specs={service.specs} serviceSlug={service.slug} /></Td>
      <Td hideBelow="md" muted>
        <ServiceLinksSummary outgoing={service._count.outgoing} incoming={service._count.incoming} resources={service._count.resources} />
      </Td>
      {showActions && (
        <Td align="right">
          {canEdit && (
            <RowActions>
              <RowActionLink href={`/services/${service.slug}/edit`}>Editar<SrOnly> {service.name}</SrOnly></RowActionLink>
            </RowActions>
          )}
        </Td>
      )}
    </Tr>
  );
}
