"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { syncNow } from "../actions";
import { Feedback, initialResult } from "./feedback";

/** Dispara uma sincronização manual da spec a partir da origem configurada (repositório/URL). */
export function SyncButton({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState(syncNow, initialResult);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      <Button tone="quiet" disabled={pending}>{pending ? "Sincronizando…" : "Sincronizar agora"}</Button>
      <Feedback state={state} />
    </form>
  );
}
