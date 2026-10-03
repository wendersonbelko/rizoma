import { Markdown } from "@/components/markdown";
import { RowActionButton, RowActionLink, RowActions, Td, Tr } from "@/components/table";
import { Badge } from "@/components/ui";
import { deleteEnvVar } from "../actions";
import { RevealButton } from "../forms/reveal-button";
import type { HrefFor } from "../types";

type EnvVar = { id: string; key: string; value: string | null; isSecret: boolean; description: string | null };

/** Uma linha da tabela de variáveis de ambiente. */
export function EnvVarRow({ envVar, canEdit, canReveal, hrefFor }: { envVar: EnvVar; canEdit: boolean; canReveal: boolean; hrefFor: HrefFor }) {
  return (
    <Tr>
      <Td>
        <span className="inline-flex flex-wrap items-center gap-2 font-mono text-[13px]">
          {envVar.key}
          {envVar.isSecret && <Badge tone="wait">segredo</Badge>}
        </span>
      </Td>
      <Td mono className="max-w-[320px]">
        {envVar.isSecret ? (canReveal ? <RevealButton id={envVar.id} /> : <span className="text-muted">••••••</span>) : envVar.value || <span className="font-sans text-muted">(vazio)</span>}
      </Td>
      <Td muted hideBelow="md">{envVar.description ? <Markdown compact>{envVar.description}</Markdown> : "—"}</Td>
      <Td align="right">
        {canEdit && (
          <RowActions>
            <RowActionLink href={hrefFor({ var: envVar.key })}>Editar</RowActionLink>
            <form action={deleteEnvVar}><input type="hidden" name="id" value={envVar.id} /><RowActionButton tone="danger">Excluir</RowActionButton></form>
          </RowActions>
        )}
      </Td>
    </Tr>
  );
}
