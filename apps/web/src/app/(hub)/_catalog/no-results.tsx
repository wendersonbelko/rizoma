import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui";

/** Nenhum serviço bate com a busca/tag atual — diferente de catálogo vazio (ver EmptyCatalog). */
export function NoResults() {
  return (
    <EmptyState
      tour="catalog-list"
      title="Nenhum serviço corresponde à busca"
      description="Tente outro termo ou remova o filtro de tag."
      action={<LinkButton href="/" tone="quiet">Limpar filtros</LinkButton>}
    />
  );
}
