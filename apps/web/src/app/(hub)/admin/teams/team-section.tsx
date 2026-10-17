import { SECONDARY_PAGE_SIZE, paginate, personLabel, readPageRequest, type QueryParams } from "@api-hub/core";
import { Pagination } from "@/components/pagination";
import { DataTable, SrOnly, TBody, THead, Th } from "@/components/table";
import { Section } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { AddMemberForm } from "./add-member-form";
import { MemberRow } from "./member-row";
import { GithubSyncForm } from "./github-sync-form";

type Member = {
  userId: string; role: "LEAD" | "MEMBER";
  user: { githubLogin: string | null; email: string | null; name: string | null; image: string | null };
};
type Team = { id: string; slug: string; name: string; githubTeamSlug: string | null; services: { name: string }[]; members: Member[] };

const label = (m: Member) => personLabel(m.user);
// Líderes primeiro, depois ordem alfabética — ordem estável para a paginação.
const byRoleThenName = (a: Member, b: Member) => (a.role === b.role ? label(a).localeCompare(label(b), "pt-BR") : a.role === "LEAD" ? -1 : 1);

/** Um time: título, serviços que ele mantém e a tabela de membros (com "adicionar" no cabeçalho). */
export function TeamSection({ team, params }: { team: Team; params: QueryParams }) {
  const services = team.services.map((s) => s.name).join(", ");
  // Cada time pagina os próprios membros, com parâmetros de URL só dele (?backend.page=2).
  const keys = { pageKey: `${team.slug}.page`, sizeKey: `${team.slug}.size` };
  const { items: members, info } = paginate([...team.members].sort(byRoleThenName), readPageRequest(params, { ...keys, defaultSize: SECONDARY_PAGE_SIZE }));

  return (
    <Section
      title={team.name}
      description={services ? `Mantém: ${services}` : "Ainda não mantém nenhum serviço."}
      action={
        <span className="flex flex-wrap items-center gap-2">
          <AddMemberForm teamId={team.id} />
          <FormModal label="Sincronizar com o GitHub" title={`Sincronizar ${team.name}`} size="sm">
            <GithubSyncForm teamId={team.id} githubTeamSlug={team.githubTeamSlug} />
          </FormModal>
        </span>
      }
    >
      {team.members.length === 0 ? (
        <p className="text-sm text-muted">Nenhum membro neste time.</p>
      ) : (
        <DataTable
          caption={`Membros do time ${team.name}`}
          minWidth={480}
          pagination={<Pagination info={info} noun={["membro", "membros"]} params={params} {...keys} />}
        >
          <THead>
            <Th>Pessoa</Th>
            <Th>Papel no time</Th>
            <Th align="right"><SrOnly>Ações</SrOnly></Th>
          </THead>
          <TBody>
            {members.map((m) => <MemberRow key={m.userId} teamId={team.id} userId={m.userId} role={m.role} person={m.user} />)}
          </TBody>
        </DataTable>
      )}
    </Section>
  );
}
