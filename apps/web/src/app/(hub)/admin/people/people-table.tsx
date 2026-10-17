import type { ReactNode } from "react";
import { DataTable, TBody, THead, Th } from "@/components/table";
import { PersonRow } from "./person-row";

type Person = Parameters<typeof PersonRow>[0]["person"];

/** Tabela de pessoas. Cabeçalho fixo na rolagem da página, sem barra interna (achado D5 da auditoria de UX de 02/10/2026). */
export function PeopleTable({ people, actorId, hrefFor, pagination }: {
  people: Person[]; actorId: string; hrefFor: (id: string) => string; pagination?: ReactNode;
}) {
  return (
    <DataTable tour="people-list" caption="Pessoas com acesso" minWidth={640} stickyHeader pagination={pagination}>
      <THead sticky>
        <Th>Pessoa</Th>
        <Th>Status</Th>
        <Th hideBelow="md">Origem</Th>
        <Th>Papel</Th>
      </THead>
      <TBody>
        {people.map((p) => <PersonRow key={p.id} person={p} isSelf={p.id === actorId} href={hrefFor(p.id)} />)}
      </TBody>
    </DataTable>
  );
}
