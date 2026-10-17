import { notFound, redirect } from "next/navigation";
import { SECONDARY_PAGE_SIZE, ROLES, can, canChangeRole, pageInfo, paginate, personLabel, readPageRequest, type QueryParams } from "@api-hub/core";
import { prisma } from "@api-hub/db";
import { requireUser } from "@/lib/guards";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { Pagination } from "@/components/pagination";
import { FormModal, ModalActions } from "@/components/form-modal";
import { Input, LinkButton } from "@/components/ui";
import { InviteForm } from "./invite-forms";
import { PendingRequestsPanel } from "./pending-requests-panel";
import { PeopleTable } from "./people-table";
import { DecisionHistory } from "./decision-history";
import { PersonDetail } from "./person-detail";
import { loadHistory, loadPeople, loadPersonEvents } from "./query";

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
 * Pessoas e acesso: uma lista por vez. O filtro escolhe pessoas, solicitações de acesso ou histórico.
 * Abrir uma pessoa substitui a lista pelo acesso dela. A chave de URL `v=requests` continua a mesma
 * mesmo com o nome novo "Solicitações de acesso" (achado V4 da auditoria de UX de 02/10/2026).
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
  const canManage = can(actor, "user:manage");
  const credentials = await prisma.authProvider.findUnique({ where: { type: "CREDENTIALS" } });
  const { requests, users, historyTotal } = await loadPeople();

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
  const personEvents = opened ? await loadPersonEvents(opened.id) : null;
  const historyReq = readPageRequest(sp, { ...HISTORY_KEYS, defaultSize: SECONDARY_PAGE_SIZE });
  const historyInfo = pageInfo(historyTotal, historyReq);
  const history = view === "history" ? await loadHistory(historyInfo) : null;
  // Papéis que quem está logado pode dar a esta pessoa (regra canChangeRole). O papel atual sempre entra.
  const ownerCount = users.filter((u) => u.role === "OWNER").length;
  const roleOptions = opened
    ? ROLES.filter((r) => r === opened.role || canChangeRole({ actor, target: opened, newRole: r, ownerCount }).ok)
    : [];

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pessoas e acesso</h1>
          <p className="text-sm text-muted">Quem entra no hub. Abra uma pessoa para mudar o papel e o acesso.</p>
        </div>
        {canManage && (
          <FormModal id="invite" tour="people-invite" label="Convidar pessoa" title="Convidar pessoa" tone="primary" size="sm"
            description={credentials?.enabled ? "A pessoa recebe um link para criar a senha." : undefined}>
            {credentials?.enabled ? (
              <InviteForm canInviteAdmin={actor.role === "OWNER"} />
            ) : (
              <>
                <p className="text-sm text-muted">Para o convite funcionar, ative o login por e-mail e senha em Configurações.</p>
                <ModalActions cancelLabel="Fechar"><LinkButton href="/admin/settings?s=connections#login">Abrir Configurações</LinkButton></ModalActions>
              </>
            )}
          </FormModal>
        )}
      </div>

      {opened && personEvents ? (
        <div className="space-y-4">
          <Breadcrumb items={[{ label: "Pessoas e acesso", href: listHref(q, f) }, { label: personLabel(opened) }]} />
          <PersonDetail
            person={opened}
            isSelf={opened.id === actor.id}
            canManage={canManage}
            canResetPassword={!!credentials?.enabled && canManage && !!opened.passwordHash}
            roleOptions={roleOptions}
            events={personEvents.entries}
            targets={personEvents.targets}
          />
        </div>
      ) : (
        <>
          {view === "people" && (
            <form action="/admin/people" className="flex flex-wrap items-center gap-3">
              {f !== "all" && <input type="hidden" name="f" value={f} />}
              <Input name="q" defaultValue={q} placeholder="Buscar nome, e-mail ou time" aria-label="Buscar pessoas" className="max-w-sm" />
            </form>
          )}

          <FilterChips
            label="Filtrar pessoas e acesso"
            items={[
              { label: `Todos (${users.length})`, href: listHref(q, "all"), active: view === "people" && f === "all" },
              { label: `Ativos (${activeCount})`, href: listHref(q, "active"), active: view === "people" && f === "active" },
              { label: `Suspensos (${suspendedCount})`, href: listHref(q, "suspended"), active: view === "people" && f === "suspended" },
              { label: `Solicitações de acesso (${requests.length})`, href: listHref("", "all", "requests"), active: view === "requests", tour: "people-requests" },
              { label: "Histórico", href: listHref("", "all", "history"), active: view === "history", tour: "people-history" },
            ]}
          />

          {view === "requests" && <PendingRequestsPanel requests={requests} canGrantAdmin={actor.role === "OWNER"} />}
          {view === "history" && history && (
            <DecisionHistory
              entries={history.entries}
              targets={history.targets}
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
