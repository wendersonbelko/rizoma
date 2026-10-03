import { Button } from "@/components/ui";
import type { StoredConflict } from "@/lib/repo-state";
import { resolveRepoConflictAction } from "../actions";

const LABEL: Record<string, string> = {
  description: "Descrição",
  tags: "Tecnologias",
  readme: "README",
  spec: "Caminho da spec",
  hub: "hub.json",
  doc: "Documento",
};

function clip(text: string) {
  const clean = text.trim();
  if (!clean) return "—";
  return clean.length > 400 ? `${clean.slice(0, 400)}…` : clean;
}

/** Os dois lados têm conteúdo diferente. Só quem edita o serviço escolhe qual fica. */
export function RepoConflicts({ serviceId, conflicts, canEdit }: { serviceId: string; conflicts: StoredConflict[]; canEdit: boolean }) {
  if (conflicts.length === 0) return null;
  return (
    <div className="space-y-4">
      {conflicts.map((conflict) => (
        <article key={`${conflict.field}:${conflict.path}`} className="rounded-panel border border-line bg-sheet p-4">
          <h3 className="font-semibold">{LABEL[conflict.field] ?? conflict.field}{conflict.path ? ` · ${conflict.path}` : ""}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <pre className="overflow-auto whitespace-pre-wrap rounded-control bg-field p-3 text-xs text-ink">{clip(conflict.hub)}</pre>
            <pre className="overflow-auto whitespace-pre-wrap rounded-control bg-field p-3 text-xs text-ink">{clip(conflict.git)}</pre>
          </div>
          <p className="mt-2 text-xs text-muted">À esquerda, o hub. À direita, o Git.</p>
          {canEdit && (
            <form action={resolveRepoConflictAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="serviceId" value={serviceId} />
              <input type="hidden" name="field" value={conflict.field} />
              <input type="hidden" name="path" value={conflict.path} />
              <Button tone="quiet" name="side" value="hub">Ficar com o hub</Button>
              <Button name="side" value="git">Ficar com o Git</Button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
