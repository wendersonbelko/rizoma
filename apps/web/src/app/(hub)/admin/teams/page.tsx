import { prisma } from "@api-hub/db";
import { redirect } from "next/navigation";
import { SECONDARY_PAGE_SIZE, paginate, personLabel, readPageRequest, type QueryParams } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui";
import { TeamCreateForm } from "./create-form";
import { TeamSection } from "./team-section";
import { TeamsTable, rowHref, teamListHref } from "./teams-table";

const text = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Até três nomes na lista; o resto vira "+N" (o time aberto mostra todo mundo). */
function peopleSummary(members: { user: { name: string | null; githubLogin: string | null; email: string | null } }[]) {
  const names = members.slice(0, 3).map((m) => personLabel(m.user));
  const more = members.length - names.length;
  return `${names.join(", ")}${more > 0 ? ` +${more}` : ""}`;
}

export default async function TeamsPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  await requirePermission("team:manage");
  const sp = await searchParams;
  const q = text(sp.q).trim();
  const filterAlias: Record<string, string> = { com: "with", sem: "without", todos: "all" };
  const rawF = text(sp.f);
  const f = filterAlias[rawF] ?? (rawF === "with" || rawF === "without" ? rawF : "all");
  const openSlug = text(sp.team) || text(sp.time);
  if (sp.time || rawF in filterAlias) {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key === "time" || key === "team" || key === "f" || key === "q") continue;
      const v = Array.isArray(value) ? value[0] : value;
      if (v) p.set(key, v);
    }
    if (q) p.set("q", q);
    if (f !== "all") p.set("f", f);
    if (openSlug) p.set("team", openSlug);
    const s = p.toString();
    redirect(s ? `/admin/teams?${s}` : "/admin/teams");
  }

  const all = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { members: { include: { user: true } }, services: { select: { name: true } } },
  });
  const needle = q.toLocaleLowerCase("pt-BR");
  const filtered = all.filter((t) => {
    if (f === "with" && t.members.length === 0) return false;
    if (f === "without" && t.members.length > 0) return false;
    if (!needle) return true;
    const people = t.members.map((m) => `${m.user.name ?? ""} ${m.user.githubLogin ?? ""} ${m.user.email ?? ""}`).join(" ");
    const blob = `${t.name} ${t.slug} ${t.services.map((s) => s.name).join(" ")} ${people}`.toLocaleLowerCase("pt-BR");
    return blob.includes(needle);
  });
  const { items: teams, info } = paginate(filtered, readPageRequest(sp, { defaultSize: SECONDARY_PAGE_SIZE }));
  const opened = filtered.find((t) => t.slug === openSlug);
  const withMembers = all.filter((t) => t.members.length > 0).length;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Times</h1>
          <p className="text-sm text-muted">Quem mantém cada serviço. Abra um time para ver e mudar as pessoas.</p>
        </div>
        <TeamCreateForm />
      </div>

      {opened ? (
        <div className="space-y-4">
          <Breadcrumb items={[{ label: "Times", href: teamListHref(q, f) }, { label: opened.name }]} />
          <TeamSection team={opened} params={sp} />
        </div>
      ) : (
        <>
          <form action="/admin/teams" className="flex flex-wrap items-center gap-3">
            {f !== "all" && <input type="hidden" name="f" value={f} />}
            <Input name="q" defaultValue={q} placeholder="Buscar time, serviço ou pessoa" aria-label="Buscar times" className="max-w-sm" />
          </form>

          <FilterChips
            label="Filtrar times"
            tour="teams-filters"
            items={[
              { label: `Todos (${all.length})`, href: teamListHref(q, "all"), active: f === "all" },
              { label: `Com membros (${withMembers})`, href: teamListHref(q, "with"), active: f === "with" },
              { label: `Sem membros (${all.length - withMembers})`, href: teamListHref(q, "without"), active: f === "without" },
            ]}
          />

          {teams.length === 0 ? (
            <EmptyState title="Nenhum time com esse filtro" description={all.length === 0 ? "Use Novo time para criar o primeiro." : "Tente outro texto ou o filtro Todos."} />
          ) : (
            <TeamsTable
              rows={teams.map((t) => ({
                slug: t.slug,
                name: t.name,
                services: t.services.map((s) => s.name).join(", "),
                people: peopleSummary(t.members),
                members: t.members.length,
                href: rowHref(q, f, t.slug),
              }))}
              pagination={<Pagination info={info} noun={["time", "times"]} params={sp} />}
            />
          )}
        </>
      )}
    </div>
  );
}
