import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { CellTitle, DataTable, RowActionButton, RowActions, SrOnly, TBody, THead, Td, Th, Tr } from "@/components/table";
import { Badge } from "@/components/ui";
import { revokeToken } from "./actions";

type Token = { id: string; name: string; prefix: string; expiresAt: Date | null; lastUsedAt: Date | null; service: { name: string } };

const soon = (d: Date | null) => !!d && d.getTime() - Date.now() < 14 * 86_400_000;

/** Tokens de publicação ativos. */
export function TokensTable({ rows, pagination }: { rows: Token[]; pagination?: ReactNode }) {
  if (rows.length === 0) return <EmptyState title="Nenhum token ativo" description="Gere um token acima e guarde-o como segredo no repositório do serviço." />;
  return (
    <DataTable caption="Tokens de publicação ativos" minWidth={680} pagination={pagination}>
      <THead>
        <Th>Token</Th>
        <Th>Prefixo</Th>
        <Th>Expira</Th>
        <Th hideBelow="md">Último uso</Th>
        <Th align="right"><SrOnly>Ações</SrOnly></Th>
      </THead>
      <TBody>
        {rows.map((t) => (
          <Tr key={t.id}>
            <Td><CellTitle title={t.name} meta={t.service.name} /></Td>
            <Td mono>{t.prefix}…</Td>
            <Td nowrap>
              {t.expiresAt ? (
                soon(t.expiresAt) ? <Badge tone="wait">{t.expiresAt.toLocaleDateString("pt-BR")}</Badge> : t.expiresAt.toLocaleDateString("pt-BR")
              ) : <span className="text-muted">nunca</span>}
            </Td>
            <Td hideBelow="md" muted nowrap>{t.lastUsedAt?.toLocaleDateString("pt-BR") ?? "nunca"}</Td>
            <Td align="right">
              <RowActions>
                <form action={revokeToken}><input type="hidden" name="id" value={t.id} /><RowActionButton tone="danger">Revogar</RowActionButton></form>
              </RowActions>
            </Td>
          </Tr>
        ))}
      </TBody>
    </DataTable>
  );
}
