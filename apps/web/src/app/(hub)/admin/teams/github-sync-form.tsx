"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { ModalActions } from "@/components/form-modal";
import { syncGithubTeam, type GithubSyncState } from "./actions";

const initial: GithubSyncState = { message: "", pending: [] };

/** Dentro do FormModal de "Sincronizar com o GitHub". O resultado fica à vista no modal, por isso o botão de saída vira "Fechar". */
export function GithubSyncForm({ teamId, githubTeamSlug }: { teamId: string; githubTeamSlug: string | null }) {
  const [state, action, pending] = useActionState(syncGithubTeam, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="teamId" value={teamId} />
      <Field label="Time no GitHub" hint="O identificador do time na organização, como aparece no endereço dele no GitHub. Quem já tem conta no hub entra como membro.">
        <Input name="githubTeamSlug" defaultValue={githubTeamSlug ?? ""} placeholder="backend" autoComplete="off" />
      </Field>
      {state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
      {state.pending.length > 0 && (
        <p className="text-sm">
          Sem conta no hub: {state.pending.map((login) => `@${login}`).join(", ")}.{" "}
          <Link href="/admin/people#invite" className="text-accent underline-offset-2 hover:underline">Convidar em Pessoas e acesso</Link>
        </p>
      )}
      <ModalActions cancelLabel={state.message ? "Fechar" : "Cancelar"}>
        <Button disabled={pending}>{pending ? "Sincronizando…" : "Sincronizar com o GitHub"}</Button>
      </ModalActions>
    </form>
  );
}
