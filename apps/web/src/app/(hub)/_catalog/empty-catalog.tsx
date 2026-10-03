import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui";

/** Catálogo sem nenhum serviço cadastrado ainda (achado da auditoria de UX: precisa de um CTA). */
export function EmptyCatalog({ canCreate }: { canCreate: boolean }) {
  return (
    <EmptyState
      tour="catalog-list"
      title="O catálogo ainda está vazio"
      description={
        canCreate
          ? "Cadastre um serviço para publicar a documentação da API, as regras de negócio e as integrações dele."
          : "Peça a um mantenedor ou administrador para cadastrar o primeiro serviço."
      }
      action={canCreate ? <LinkButton href="/admin/catalog#new-service">+ Cadastrar meu primeiro serviço</LinkButton> : undefined}
    />
  );
}
