"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { syncRepositoryNow } from "../actions";
import { Feedback, initialResult } from "./feedback";

/** Lê a branch padrão e preenche o que o serviço ainda não tem. */
export function RepoSyncButton({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState(syncRepositoryNow, initialResult);
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      <Button tone="quiet" disabled={pending}>{pending ? "Sincronizando…" : "Sincronizar repositório"}</Button>
      <Feedback state={state} />
    </form>
  );
}
