import Link from "next/link";
import { prisma } from "@api-hub/db";
import { canManageService } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { Markdown } from "@/components/markdown";
import { LinkButton } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { DangerAction, DangerZone } from "@/components/danger-zone";
import { EmptyState } from "@/components/empty-state";
import { deleteDoc } from "../actions";
import { DocEditor } from "../forms/doc-editor";
import type { HrefFor, ServiceDetail, Search } from "../types";

/** Aba "Regras de negócio": lista de páginas em Markdown. Criar e editar abrem num modal. */
export async function DocsTab({ user, service, slug, sp, hrefFor }: {
  user: CurrentUser; service: ServiceDetail; slug: string; sp: Pick<Search, "doc" | "edit">; hrefFor: HrefFor;
}) {
  const docs = await prisma.serviceDoc.findMany({ where: { serviceId: service.id }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const canEdit = canManageService(user, service, "docs:edit");
  const current = docs.find((d) => d.slug === sp.doc) ?? docs[0];
  const editing = canEdit && sp.edit === "1" && current;
  const creating = canEdit && sp.edit === "new";

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-1 text-sm">
        {docs.map((d) => (
          <Link key={d.id} href={hrefFor({ doc: d.slug })} className={`block rounded-control px-2 py-1.5 ${d.id === current?.id ? "bg-sheet font-semibold" : "text-muted hover:text-ink"}`}>{d.title}</Link>
        ))}
        {canEdit && <Link href={hrefFor({ edit: "new" })} className="block px-2 py-1.5 text-accent">+ Nova página</Link>}
        <p className="px-2 pt-3 text-xs text-muted">As regras valem para todos os ambientes.</p>
      </aside>
      {current ? (
        <article className="min-w-0 rounded-panel border border-line bg-sheet p-6 md:p-8">
          <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
            <h2 className="text-2xl font-bold tracking-tight">{current.title}</h2>
            <span className="text-sm text-muted">
              Atualizado em {current.updatedAt.toLocaleDateString("pt-BR")}
              {canEdit && <> · <Link href={hrefFor({ doc: current.slug, edit: "1" })} className="text-accent">Editar</Link></>}
            </span>
          </header>
          <Markdown>{current.content || "_Página vazia._"}</Markdown>
          {canEdit && (
            <div className="mt-8">
              {/* Achado F3 da auditoria de UX de 02/10/2026: ação destrutiva sempre numa DangerZone. Sem volta,
                  então pede o título da página (o servidor confere de novo em deleteDoc). */}
              <DangerZone>
                <DangerAction
                  title="Excluir esta página"
                  description="A página e o texto dela são apagados do hub. Se o repositório do serviço estiver conectado, o arquivo dela também sai de lá. Não dá para desfazer."
                  actionLabel="Excluir página"
                  action={deleteDoc}
                  fields={{ id: current.id }}
                  confirmText={current.title}
                />
              </DangerZone>
            </div>
          )}
        </article>
      ) : (
        <EmptyState
          title="Nenhuma regra de negócio documentada"
          description="Descreva como o serviço funciona, as regras que ele aplica e os pontos de atenção. Tudo em Markdown."
          action={canEdit ? <LinkButton href={hrefFor({ edit: "new" })}>Escrever a primeira página</LinkButton> : undefined}
        />
      )}
      {(creating || editing) && (
        <FormModal title={editing ? `Editar: ${current.title}` : "Nova página"} size="lg" forced closeHref={hrefFor({ edit: "" })}>
          <DocEditor serviceId={service.id} slug={slug} doc={editing ? current : undefined} />
        </FormModal>
      )}
    </div>
  );
}
