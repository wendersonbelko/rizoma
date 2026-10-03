import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { CellTitle, DataTable, TBody, THead, Td, Th, Tr } from "@/components/table";
import { Badge } from "@/components/ui";

type Repository = { id: string; fullName: string; url: string; provider: string; defaultBranch: string; description: string | null };

const PROVIDER_LABEL: Record<string, string> = { GITHUB: "GitHub", GITLAB: "GitLab", BITBUCKET: "Bitbucket", GENERIC: "Outro" };

/** Repositórios de código já cadastrados. */
export function RepositoriesTable({ rows, pagination }: { rows: Repository[]; pagination?: ReactNode }) {
  if (rows.length === 0) return <EmptyState title="Nenhum repositório cadastrado" description="Cadastre o primeiro acima para poder ligá-lo aos serviços." />;
  return (
    <DataTable caption="Repositórios cadastrados" minWidth={560} pagination={pagination}>
      <THead>
        <Th>Repositório</Th>
        <Th>Onde está</Th>
        <Th hideBelow="md">Branch padrão</Th>
      </THead>
      <TBody>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td><CellTitle title={r.fullName} href={r.url} meta={r.description ?? undefined} /></Td>
            <Td><Badge>{PROVIDER_LABEL[r.provider] ?? r.provider}</Badge></Td>
            <Td hideBelow="md" mono>{r.defaultBranch}</Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}
