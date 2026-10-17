"use client";

import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { uploadSpec } from "../actions";
import { feedbackMessage, initialResult } from "./feedback";

const area = "w-full rounded-control border border-line-strong bg-field p-3 font-mono text-[13px] leading-relaxed outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15";

/** Publica a spec de um ambiente por arquivo ou texto colado. */
export function SpecUploadForm({ serviceId, environmentId, envName }: { serviceId: string; environmentId: string; envName: string }) {
  const [state, action, pending] = useActionState(uploadSpec, initialResult);
  useCloseOnSuccess(state, pending);
  const [tab, setTab] = useState<"file" | "paste">("file");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="environmentId" value={environmentId} />
      <div className="inline-flex gap-1 rounded-control border border-line bg-paper p-1" role="tablist" aria-label="Como enviar a spec">
        {(["file", "paste"] as const).map((t) => (
          <button
            key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`h-9 rounded-control px-3 text-sm ${tab === t ? "bg-sheet font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {t === "file" ? "Enviar arquivo" : "Colar conteúdo"}
          </button>
        ))}
      </div>
      <div className={tab === "file" ? "" : "hidden"}>
        <Field label={`Arquivo para ${envName}`} hint="JSON ou YAML, até 5 MB. OpenAPI 3.0, 3.1 ou Swagger 2.0.">
          <input type="file" name="file" accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml" className="block h-11 w-full rounded-control border border-dashed border-line-strong bg-field px-3 py-2 text-sm file:mr-3 file:rounded-control file:border file:border-line file:bg-sheet file:px-3 file:py-1 file:text-sm file:font-semibold" />
        </Field>
      </div>
      <div className={tab === "paste" ? "" : "hidden"}>
        <Field label={`Conteúdo para ${envName}`} hint="JSON ou YAML. Se os dois estiverem preenchidos, o arquivo vence.">
          <textarea name="content" rows={8} className={area} placeholder='{"openapi": "3.1.0", "info": { "title": "...", "version": "1.0.0" }, "paths": {}}' />
        </Field>
      </div>
      <ModalActions message={feedbackMessage(state)}>
        <Button disabled={pending}>{pending ? "Publicando…" : "Publicar spec"}</Button>
      </ModalActions>
    </form>
  );
}
