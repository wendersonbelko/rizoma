"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { DangerAction } from "@/components/danger-zone";
import { FormModal, ModalActions } from "@/components/form-modal";
import { passwordResetLink, setSuspended } from "./actions";
import { LinkBox } from "./link-box";

/**
 * Seção "Segurança" da pessoa (achados F3 e F4 da auditoria de UX de 02/10/2026): o link de nova senha
 * e a suspensão num grupo só, com pesos diferentes. A suspensão é a ação destrutiva padrão
 * (DangerAction); reativar não é destrutivo e vira um botão comum.
 */
export function PersonSecurity({ userId, suspended, canResetPassword }: { userId: string; suspended: boolean; canResetPassword: boolean }) {
  return (
    <div className="space-y-4">
      {canResetPassword && (
        <Row title="Link de nova senha" description="Gera um link de uso único, válido por 1 hora, para a pessoa criar outra senha. Ao usar, as sessões dela são encerradas.">
          <FormModal label="Gerar link de nova senha" title="Link de nova senha" size="sm">
            <ResetLinkForm userId={userId} />
          </FormModal>
        </Row>
      )}
      {suspended ? (
        <Row title="Acesso suspenso" description="A pessoa não consegue entrar. Reativar devolve o acesso com o papel que ela tinha.">
          <ReactivateButton userId={userId} />
        </Row>
      ) : (
        <DangerAction
          title="Suspender acesso"
          description="A pessoa perde o acesso agora e as sessões abertas dela são encerradas. Você pode reativar depois."
          actionLabel="Suspender acesso"
          action={setSuspended}
          fields={{ userId, suspend: "1" }}
        />
      )}
    </div>
  );
}

function Row({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="min-w-0 max-w-prose">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** Dentro do FormModal: o link fica à vista depois de gerado, porque não aparece de novo. */
function ResetLinkForm({ userId }: { userId: string }) {
  const [state, dispatch, pending] = useActionState(passwordResetLink, { ok: false });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="userId" value={userId} />
      {state.ok ? (
        <LinkBox ok message={state.message} url={state.url} />
      ) : (
        <p className="text-sm text-muted">Você recebe o link aqui para enviar à pessoa. Se o e-mail do hub estiver configurado, ele também sai por e-mail.</p>
      )}
      <ModalActions
        cancelLabel={state.ok ? "Fechar" : "Cancelar"}
        message={!state.ok && state.message ? <span className="text-danger">{state.message}</span> : undefined}
      >
        {!state.ok && <Button disabled={pending}>{pending ? "Gerando…" : "Gerar link"}</Button>}
      </ModalActions>
    </form>
  );
}

function ReactivateButton({ userId }: { userId: string }) {
  const [state, dispatch, pending] = useActionState(async (_: { ok: boolean; message?: string }, data: FormData) => setSuspended(data), { ok: false });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="suspend" value="0" />
      <Button tone="quiet" disabled={pending}>{pending ? "Reativando…" : "Reativar acesso"}</Button>
      {state.message && !state.ok && <p role="alert" className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
