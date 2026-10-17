"use client";

import { Panel } from "@/components/ui";
import { recheckAll } from "./actions";
import { ActionForm } from "./form-primitives";

/** Força a conferência de quem ainda é da empresa (RN-75). Não apaga nada, então não é ação de perigo. */
export function RecheckPanel() {
  return (
    <Panel title="Conferir vínculos com a empresa">
      <ActionForm action={() => recheckAll()} submit="Conferir todas as pessoas" tone="quiet">
        <p className="text-sm text-muted">Use depois de mudar os domínios ou as organizações aceitas. Cada pessoa é conferida de novo no próximo acesso, sem precisar sair.</p>
      </ActionForm>
    </Panel>
  );
}
