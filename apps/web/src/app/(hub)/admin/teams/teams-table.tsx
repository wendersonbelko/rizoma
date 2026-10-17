import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { CellTitle, DataTable, TBody, THead, Td, Th, Tr } from "@/components/table";

type Row = {
  slug: string;
  name: string;
  services: string;
  people: string;
  members: number;
  href: string;
};

/**
 * Lista compacta dos times. Os membros ficam no painel do time aberto, não repetidos aqui; a coluna
 * "Pessoas" mostra só os primeiros nomes. Cabeçalho fixo na rolagem da página, sem barra interna (achado D5).
 */
export function TeamsTable({ rows, pagination }: { rows: Row[]; pagination?: ReactNode }) {
  return (
    <DataTable tour="teams-first" caption="Times" minWidth={720} stickyHeader pagination={pagination}>
      <THead sticky>
        <Th>Time</Th>
        <Th hideBelow="md">Serviços</Th>
        <Th>Pessoas</Th>
        <Th align="right">Membros</Th>
      </THead>
      <TBody>
        {rows.map((t) => (
          <Tr key={t.slug}>
            <Td>
              <CellTitle title={t.name} href={t.href} />
            </Td>
            <Td muted hideBelow="md">{t.services || "Nenhum serviço"}</Td>
            <Td muted>{t.people || "—"}</Td>
            <Td align="right">{t.members === 0 ? <Badge>0</Badge> : <Badge tone="accent">{t.members}</Badge>}</Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}

export function teamListHref(q: string, f: string, team = "") {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (f !== "all") p.set("f", f);
  if (team) p.set("team", team);
  const s = p.toString();
  return s ? `/admin/teams?${s}` : "/admin/teams";
}

/** O link da linha abre a lista daquele time no lugar da tabela. */
export function rowHref(q: string, f: string, slug: string) {
  return teamListHref(q, f, slug);
}
