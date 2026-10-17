import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui";

/** Nenhum serviço bate com a busca ou os filtros atuais — diferente de catálogo vazio (ver EmptyCatalog). */
export function NoResults({ clearHref }: { clearHref: string }) {
  return (
    <EmptyState
      tour="catalog-list"
      title="Nenhum serviço corresponde aos filtros"
      description="Tente outro termo ou tire algum filtro."
      action={<LinkButton href={clearHref} tone="quiet">Limpar filtros</LinkButton>}
    />
  );
}
