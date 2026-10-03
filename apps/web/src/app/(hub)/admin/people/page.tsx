import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma, type Prisma } from "@api-hub/db";
import { SECONDARY_PAGE_SIZE, can, pageInfo, paginate, readPageRequest, type QueryParams } from "@api-hub/core";
import { requireUser } from "@/lib/guards";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { Pagination } from "@/components/pagination";
import { FormModal } from "@/components/form-modal";
import { InviteForm } from "./invite-forms";
import { PendingRequestsPanel } from "./pending-requests-panel";
import { PeopleTable } from "./people-table";
import { DecisionHistory } from "./decision-history";
import { PersonDetail } from "./person-detail";

const HISTORY_KEYS = { pageKey: "hpage", sizeKey: "hsize" };
const text = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function personHref(q: string, f: string, id: string) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (f !== "all") p.set("f", f);
  p.set("person", id);
  return `/admin/people?${p}`;
}

function listHref(q: string, f: string, v = "people") {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (f !== "all") p.set("f", f);
  if (v !== "people") p.set("v", v);
  const s = p.toString();
  return s ? `/admin/people?${s}` : "/admin/people";
}

/**
 * Pessoas e acesso: uma lista por vez. O filtro escolhe pessoas, pedidos ou histórico.
 * Abrir uma pessoa substitui a lista pelo acesso dela.
 */
export default async function PeoplePage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const actor = await requireUser();
  if (!can(actor, "access:decide") && !can(actor, "user:manage")) notFound();
  const sp = await searchParams;
  const q = text(sp.q).trim();
  const filterAlias: Record<string, string> = { ativo: "active", suspenso: "suspended", todos: "all" };
  const viewAlias: Record<string, string> = { pessoas: "people", pedidos: "requests", historico: "history" };
  const rawF = text(sp.f);
  const rawV = text(sp.v);
  const f = filterAlias[rawF] ?? (rawF === "active" || rawF === "suspended" ? rawF : "all");
  const viewRaw = viewAlias[rawV] ?? rawV;
  const view = viewRaw === "requests" || viewRaw === "history" ? viewRaw : "people";
  const personId = text(sp.person) || text(sp.pessoa);
  if (sp.pessoa || rawF in filterAlias || rawV in viewAlias) {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key === "pessoa" || key === "person" || key === "f" || key === "v" || key === "q") continue;
      const v = Array.isArray(value) ? value[0] : value;
      if (v) p.set(key, v);
    }
    if (q) p.set("q", q);
    if (f !== "all") p.set("f", f);
    if (personId) p.set("person", personId);
    else if (view !== "people") p.set("v", view);
    const s = p.toString();
    redirect(s ? `/admin/people?${s}` : "/admin/people");
  }
  const credentials = await prisma.authProvider.findUnique({ where: { type: "CREDENTIALS" } });
  await prisma.accessRequest.updateMany({ where: { status: "PENDING", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });

  const peopleWhere: Prisma.UserWhereInput = { status: { not: "PENDING" } };
  const [requests, users, historyTotal] = await Promise.all([
    prisma.accessRequest.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({
      where: peopleWhere,
      orderBy: [{ role: "asc" }, { email: "asc" }, { id: "asc" }],
      include: { teams: { include: { team: { select: { name: true, slug: true } } } } },
    }),
    prisma.auditLog.count({ where: { action: { startsWith: "access." } } }),
  ]);

  const needle = q.toLocaleLowerCase("pt-BR");
  const matched = users.filter((u) => {
    if (f === "active" && u.status !== "ACTIVE") return false;
    if (f === "suspended" && u.status !== "SUSPENDED") return false;
    if (!needle) return true;
    const blob = `${u.name ?? ""} ${u.email ?? ""} ${u.githubLogin ?? ""} ${u.teams.map((t) => t.team.name).join(" ")}`.toLocaleLowerCase("pt-BR");
    return blob.includes(needle);
  });
  const { items: page, info } = paginate(matched, readPageRequest(sp));
  const opened = personId ? users.find((u) => u.id === personId) : undefined;
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const suspendedCount = users.filter((u) => u.status === "SUSPENDED").length;
  const events = opened
    ? await prisma.auditLog.findMany({
      where: { OR: [{ actorId: opened.id }, { targetId: opened.id }], action: { startsWith: "access." } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, action: true },
    })
    : [];
  const historyReq = readPageRequest(sp, { ...HISTORY_KEYS, defaultSize: SECONDARY_PAGE_SIZE });
  const historyInfo = pageInfo(historyTotal, historyReq);
  const history = view === "history"
    ? await prisma.auditLog.findMany({
      where: { action: { startsWith: "access." } },
      orderBy: { createdAt: "desc" },
      skip: historyInfo.skip,
      take: historyInfo.take,
      include: { actor: { select: { githubLogin: true, email: true } } },
    })
    : [];

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pessoas e acesso</h1>
          <p className="text-sm text-muted">Quem entra no hub. Abra uma pessoa para mudar o papel e o acesso.</p>
        </div>
        {can(actor, "user:manage") && (
          <FormModal tour="people-invite" label="Convidar usuário" title="Convidar usuário" wide tone="primary">
            {credentials?.enabled ? (
              <p className="mb-4 text-sm text-muted">A pessoa recebe um link para criar a senha. Se o e-mail do hub estiver configurado, o convite é enviado; o link também aparece aqui para copiar.</p>
            ) : (
              <p className="mb-4 text-sm text-muted">Para o convite funcionar, ative o login por e-mail e senha em <Link href="/admin/settings?s=login" className="text-accent">Configurações</Link>.</p>
            )}
            <InviteForm canInviteAdmin={actor.role === "OWNER"} />
          </FormModal>
        )}
      </div>

      {opened ? (
        <div className="space-y-4">
          <Link href={listHref(q, f)} className="text-sm text-muted hover:text-ink">← Pessoas</Link>
          <PersonDetail
            person={opened}
            isSelf={opened.id === actor.id}
            canResetPassword={!!credentials?.enabled && can(actor, "user:manage")}
            events={events}
          />
        </div>
      ) : (
        <>
          {view === "people" && (
            <form action="/admin/people" className="flex flex-wrap items-center gap-3">
              {f !== "all" && <input type="hidden" name="f" value={f} />}
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar nome, e-mail ou time"
                aria-label="Buscar pessoas"
                className="h-11 w-full max-w-sm rounded-control border border-line bg-field px-3 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
            </form>
          )}

          <FilterChips
            label="Filtrar pessoas e acesso"
            items={[
              { label: `Todos (${users.length})`, href: listHref(q, "all"), active: view === "people" && f === "all" },
              { label: `Ativos (${activeCount})`, href: listHref(q, "active"), active: view === "people" && f === "active" },
              { label: `Suspensos (${suspendedCount})`, href: listHref(q, "suspended"), active: view === "people" && f === "suspended" },
              { label: `Pedidos (${requests.length})`, href: listHref("", "all", "requests"), active: view === "requests", tour: "people-requests" },
              { label: "Histórico", href: listHref("", "all", "history"), active: view === "history", tour: "people-history" },
            ]}
          />

          {view === "requests" && <PendingRequestsPanel requests={requests} canGrantAdmin={actor.role === "OWNER"} />}
          {view === "history" && (
            <DecisionHistory
              entries={history}
              pagination={<Pagination info={historyInfo} noun={["evento", "eventos"]} params={sp} {...HISTORY_KEYS} />}
            />
          )}
          {view === "people" && (
            page.length === 0 ? (
              <EmptyState title="Nenhuma pessoa com esse filtro" description={users.length === 0 ? "Convide a primeira pessoa." : "Tente outro texto ou o filtro Todos."} />
            ) : (
              <PeopleTable
                people={page}
                actorId={actor.id}
                hrefFor={(id) => personHref(q, f, id)}
                pagination={<Pagination info={info} noun={["pessoa", "pessoas"]} params={sp} />}
              />
            )
          )}
        </>
      )}
    </div>
  );
}
