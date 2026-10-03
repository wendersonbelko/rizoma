import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@api-hub/db";
import { can, canManageService, countLabel } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { Button, Panel } from "@/components/ui";
import { setArchived } from "./actions";
import { EditServiceForm, SpecSourceForm } from "./form";

export default async function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const actor = await requirePermission("service:edit");
  const { slug } = await params;
  const service = await prisma.service.findUnique({ where: { slug }, include: { _count: { select: { specs: true, incoming: true } } } });
  if (!service || !canManageService(actor, service)) notFound();

  const teams = await prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const allowed = actor.permissions.has("service:edit_any") ? teams : teams.filter((t) => actor.teamIds.includes(t.id));
  const [repos, sources] = await Promise.all([
    prisma.repository.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true, provider: true } }),
    prisma.sourceIntegration.findMany({ select: { type: true } }),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <Link href={`/services/${service.slug}`} className="text-sm text-muted hover:text-ink">{service.name}</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Editar serviço</h1>
      </header>

      <Panel>
        <EditServiceForm service={service} teams={allowed} slugLocked={service._count.specs > 0} allowNoTeam={actor.permissions.has("service:edit_any")} />
      </Panel>

      <Panel title="Origem da spec">
        <SpecSourceForm
          service={{ id: service.id, specSource: service.specSource, specRepositoryId: service.specRepositoryId, specPath: service.specPath, pullUrl: service.pullUrl, hasHeaders: !!service.pullHeadersEnc }}
          repos={repos}
          integrations={sources.map((x) => x.type)}
        />
      </Panel>

      {can(actor, "service:archive") && (
        <Panel title={service.archivedAt ? "Serviço arquivado" : "Arquivar serviço"}>
          <p className="mb-4 max-w-prose text-sm text-muted">
            {service.archivedAt
              ? `Arquivado em ${service.archivedAt.toLocaleDateString("pt-BR")}. Restaurar devolve o serviço ao catálogo; os tokens revogados continuam revogados.`
              : `Some do catálogo e do mapa, e todos os tokens de publicação são revogados. O histórico de specs é mantido.${service._count.incoming > 0 ? ` Atenção: ${countLabel(service._count.incoming, "serviço depende", "serviços dependem")} deste.` : ""}`}
          </p>
          <form action={setArchived}>
            <input type="hidden" name="id" value={service.id} />
            <input type="hidden" name="archive" value={service.archivedAt ? "0" : "1"} />
            <Button tone={service.archivedAt ? "quiet" : "danger"}>{service.archivedAt ? "Restaurar serviço" : "Arquivar serviço"}</Button>
          </form>
        </Panel>
      )}
    </div>
  );
}
