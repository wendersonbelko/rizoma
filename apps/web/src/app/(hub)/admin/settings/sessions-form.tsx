"use client";

import { Field, Input, Panel } from "@/components/ui";
import { FormModal } from "@/components/form-modal";
import { endAllSessions, recheckAll } from "./actions";
import { Form } from "./form-primitives";

export function SessionsForm() {
  return (
    <div className="space-y-4">
      <Panel title="Conferir vínculos">
        <Form action={async () => recheckAll()} submit="Conferir vínculos de todos" tone="quiet">
          <p className="text-sm text-muted">Cada pessoa tem o vínculo conferido no próximo acesso, sem precisar sair.</p>
        </Form>
      </Panel>
      <Panel title="Encerrar sessões">
        <p className="text-sm text-muted">Use depois de um incidente ou troca de credenciais. Todos, menos você, precisam entrar de novo.</p>
        <div className="mt-4">
          <FormModal label="Encerrar todas as sessões" title="Encerrar todas as sessões" tone="danger">
            <Form action={endAllSessions} submit="Encerrar todas as sessões" tone="danger">
              <Field label="Digite ENCERRAR para confirmar"><Input name="confirm" autoComplete="off" className="max-w-48" /></Field>
            </Form>
          </FormModal>
        </div>
      </Panel>
    </div>
  );
}
