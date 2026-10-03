import { EmptyState } from "@/components/empty-state";

/** Estado vazio da tabela de variáveis. */
export function EmptyEnvVars({ envName, canEdit }: { envName: string; canEdit: boolean }) {
  return (
    <EmptyState
      title={`Nenhuma variável em ${envName}`}
      description={canEdit ? "Variáveis de ambiente ficam aqui, separadas por ambiente. Use Nova variável para cadastrar a primeira." : "Variáveis de ambiente ficam aqui, separadas por ambiente."}
    />
  );
}
