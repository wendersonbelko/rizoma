"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button, Field, Select } from "@/components/ui";
import { uploadSpec } from "@/app/(hub)/services/[slug]/actions";
import type { Env } from "./types";

/** Passo 4 (opcional) do wizard: importar a spec inicial da API recém-cadastrada. */
export function SpecStep({ serviceId, envs, canPublish, onBack, onFinish }: {
  serviceId: string; envs: Env[]; canPublish: boolean; onBack: () => void; onFinish: () => void;
}) {
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [pending, startTransition] = useTransition();
  const defaultEnv = (envs.find((e) => e.isProduction) ?? envs[0])?.id ?? "";
  const [tab, setTab] = useState<"file" | "paste">("file");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("serviceId", serviceId);
    const file = fd.get("file");
    const hasFile = file instanceof File && file.size > 0;
    if (!hasFile && !String(fd.get("content") ?? "").trim()) return setMessage({ ok: false, text: "Escolha um arquivo .json/.yaml ou cole o conteúdo." });
    if (hasFile && file.size > 5 * 1024 * 1024) return setMessage({ ok: false, text: "Arquivo maior que 5 MB." });
    if (!hasFile) fd.delete("file");
    startTransition(async () => {
      try {
        const r = await uploadSpec({ ok: false }, fd);
        setMessage({ ok: r.ok, text: r.message ?? "" });
        if (r.ok) onFinish();
      } catch {
        setMessage({ ok: false, text: "Não foi possível importar a spec." });
      }
    });
  }

  if (!canPublish || envs.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          {!canPublish
            ? "Você não tem permissão para importar specs; quem mantém o serviço pode fazer isso depois na página dele."
            : "Nenhum ambiente configurado ainda (Configurações → Ambientes)."}
        </p>
        <div className="flex gap-3"><Button type="button" tone="quiet" onClick={onBack}>Voltar</Button><Button type="button" onClick={onFinish}>Concluir</Button></div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-muted">Importe a spec OpenAPI/Swagger atual. Depois, o CI pode publicar novas versões com um token.</p>
      <Field label="Ambiente">
        <Select name="environmentId" defaultValue={defaultEnv} className="max-w-xs">
          {envs.map((e) => <option key={e.id} value={e.id}>{e.name}{e.isProduction ? " (produção)" : ""}</option>)}
        </Select>
      </Field>

      <div>
        <div className="flex gap-1 text-sm" role="tablist">
          {(["file", "paste"] as const).map((t) => (
            <button
              key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`rounded-control px-3 py-1.5 ${tab === t ? "bg-paper font-semibold text-ink" : "text-muted hover:text-ink"}`}
            >
              {t === "file" ? "Enviar arquivo" : "Colar conteúdo"}
            </button>
          ))}
        </div>
        <div className="mt-2 rounded-control border border-line bg-field p-3">
          {tab === "file" ? (
            <Field label="Arquivo OpenAPI/Swagger" hint="JSON ou YAML, até 5 MB. OpenAPI 3.0, 3.1 ou Swagger 2.0.">
              <input type="file" name="file" accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml" className="block w-full text-sm file:mr-3 file:rounded-control file:border file:border-line file:bg-sheet file:px-3 file:py-1.5" />
            </Field>
          ) : (
            <Field label="Conteúdo da spec">
              <textarea name="content" rows={5} className="w-full rounded-control border border-line bg-sheet p-2 font-mono text-[12px]" placeholder='{"openapi": "3.1.0", ...}' />
            </Field>
          )}
        </div>
      </div>

      {message && <p className={`text-sm ${message.ok ? "text-accent" : "text-danger"}`} role="status">{message.text}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" tone="quiet" onClick={onBack}>Voltar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Importando…" : "Importar e concluir"}</Button>
        <Button type="button" tone="quiet" onClick={onFinish}>Pular e concluir</Button>
      </div>
    </form>
  );
}
