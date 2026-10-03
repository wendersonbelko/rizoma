import { Input } from "@/components/ui";

/** Campo de busca do catálogo, com ícone — responsabilidade única: essa única entrada de busca. */
export function CatalogSearchForm({ defaultValue, pageSize }: { defaultValue: string; pageSize?: string }) {
  return (
    <form className="mb-4 max-w-md">
      {/* Uma nova busca volta para a página 1, mas mantém o "Por página" escolhido. */}
      {pageSize && <input type="hidden" name="size" value={pageSize} />}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted" aria-hidden>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <Input data-tour="catalog-search" name="q" defaultValue={defaultValue} placeholder="Buscar por nome, slug, descrição ou endpoint" className="pl-9" />
      </div>
    </form>
  );
}
