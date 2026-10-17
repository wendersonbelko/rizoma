import { notFound } from "next/navigation";
import { prisma } from "@api-hub/db";
import { can, canManageService, countLabel } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { Breadcrumb } from "@/components/breadcrumb";
import { DangerAction, DangerZone } from "@/components/danger-zone";
import { Button, Panel } from "@/components/ui";
import { setArchived } from "./actions";
import { EditServiceForm } from "./form";

/** Restaurar não é destrutivo: é um botão comum, fora da zona de perigo. Quem chega aqui já passou pelo escopo da página. */
async function restoreService(form: FormData) {
  "use server";
  const result = await setArchived(form);
  if (result && !result.ok) throw new Error(result.message);
}

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
      <header className="space-y-1">
        {/* Achado N2 da auditoria de UX de 02/10/2026: trilha "Catálogo › serviço › Editar" em vez de um rótulo solto. */}
        <Breadcrumb items={[{ label: "Catálogo", href: "/" }, { label: service.name, href: `/services/${service.slug}` }, { label: "Editar" }]} />
        <h1 className="text-2xl font-bold tracking-tight">Editar serviço</h1>
      </header>

      <EditServiceForm
        service={service}
        teams={allowed}
        slugLocked={service._count.specs > 0}
        allowNoTeam={actor.permissions.has("service:edit_any")}
        source={{ id: service.id, specSource: service.specSource, specRepositoryId: service.specRepositoryId, specPath: service.specPath, pullUrl: service.pullUrl, hasHeaders: !!service.pullHeadersEnc }}
        repos={repos}
        integrations={sources.map((x) => x.type)}
        canToken={can(actor, "token:manage")}
      />

      {can(actor, "service:archive") && (
        service.archivedAt ? (
          <Panel title="Serviço arquivado">
            <p className="mb-4 max-w-prose text-sm text-muted">
              Arquivado em {service.archivedAt.toLocaleDateString("pt-BR")}. Restaurar devolve o serviço ao catálogo e ao mapa; os tokens revogados continuam revogados.
            </p>
            <form action={restoreService}>
              <input type="hidden" name="id" value={service.id} />
              <input type="hidden" name="archive" value="0" />
              <Button tone="quiet">Restaurar serviço</Button>
            </form>
          </Panel>
        ) : (
          // Achado F3 da auditoria de UX de 02/10/2026: ação destrutiva numa DangerZone no fim da página.
          // Reversível, então basta uma confirmação simples (sem digitar o nome).
          <DangerZone>
            <DangerAction
              title="Arquivar serviço"
              description={`Ele sai do catálogo e do mapa, e os tokens de CI são revogados. O histórico de specs é mantido e dá para restaurar depois (os tokens continuam revogados).${service._count.incoming > 0 ? ` Atenção: ${countLabel(service._count.incoming, "vínculo de outro serviço aponta", "vínculos de outros serviços apontam")} para este.` : ""}`}
              actionLabel="Arquivar serviço"
              action={setArchived}
              fields={{ id: service.id, archive: "1" }}
            />
          </DangerZone>
        )
      )}
    </div>
  );
}
