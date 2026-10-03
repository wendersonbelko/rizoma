"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { syncGithubTeam, type GithubSyncState } from "./actions";

const initial: GithubSyncState = { message: "", pending: [] };

export function GithubSyncForm({ teamId, githubTeamSlug }: { teamId: string; githubTeamSlug: string | null }) {
  const [state, action, pending] = useActionState(syncGithubTeam, initial);
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Time no GitHub" hint="Slug do time. Quem já tem conta no hub entra como membro. Sem o token de leitura, a mensagem diz para configurar Repositórios.">
          <Input name="githubTeamSlug" defaultValue={githubTeamSlug ?? ""} placeholder="backend" />
        </Field>
        <input type="hidden" name="teamId" value={teamId} />
        <Button tone="quiet" disabled={pending}>{pending ? "Sincronizando…" : "Sincronizar com o GitHub"}</Button>
      </div>
      {state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
      {state.pending.length > 0 && (
        <p className="text-sm">
          Sem conta no hub: {state.pending.map((login) => `@${login}`).join(", ")}.{" "}
          <Link href="/admin/people" className="text-accent">Convidar em Pessoas e acesso</Link>
        </p>
      )}
    </form>
  );
}
