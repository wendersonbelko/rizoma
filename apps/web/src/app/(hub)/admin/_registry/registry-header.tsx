import type { ReactNode } from "react";

/**
 * Cabeçalho das páginas de cadastro (achado N1 da auditoria de UX de 02/10/2026): o título é o nome do
 * item do menu, com uma frase do que a tela guarda e o botão que cria. `tour` chega como texto literal
 * da página, para o teste de tours achar o id.
 */
export function RegistryHeader({ title, description, action, tour }: { title: string; description: ReactNode; action?: ReactNode; tour?: string }) {
  return (
    <header data-tour={tour} className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
