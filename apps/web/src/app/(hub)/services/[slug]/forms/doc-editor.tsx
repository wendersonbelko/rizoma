"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { FormSteps } from "@/components/form-steps";
import { Markdown } from "@/components/markdown";
import { saveDoc } from "../actions";
import { Feedback, initialResult } from "./feedback";

const TEMPLATE = `## Como funciona

Explique o fluxo principal em poucas frases.

## Regras de negócio

- **RN-01** — ...
- **RN-02** — ...

## Pontos de atenção

> Coisas que costumam dar problema em produção.

## Glossário

| Termo | Significado |
|---|---|
| | |
`;

/** Editor de uma página de regras de negócio. Título e texto ficam em passos para o modal não rolar. */
export function DocEditor({ serviceId, slug, doc }: { serviceId: string; slug: string; doc?: { id: string; title: string; content: string } }) {
  const router = useRouter();
  const [content, setContent] = useState(doc?.content ?? TEMPLATE);
  const [view, setView] = useState<"edit" | "preview" | "split">("edit");
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [state, action, pending] = useActionState(saveDoc, initialResult);
  useEffect(() => {
    if (state.ok && state.value) router.push(`/services/${slug}?tab=rules&doc=${state.value}`);
  }, [state, router, slug]);

  return (
    <form action={action} className="@container space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      {doc && <input type="hidden" name="id" value={doc.id} />}
      <FormSteps labels={["Título", "Texto"]} current={step} />
      <div className={step === 0 ? undefined : "hidden"}>
        <Field label="Título da página"><Input name="title" defaultValue={doc?.title ?? "Regras de negócio"} required /></Field>
      </div>
      <div className={step === 1 ? "space-y-4" : "hidden"}>
      <div className="flex items-center gap-1 text-sm" role="tablist">
        {(["edit", "split", "preview"] as const).map((v) => (
          <button
            key={v} type="button" onClick={() => setView(v)}
            className={`rounded-control px-3 py-1 ${view === v ? "bg-paper font-semibold" : "text-muted"} ${v === "split" ? "hidden @lg:inline-block" : ""}`}
          >
            {v === "edit" ? "Escrever" : v === "split" ? "Lado a lado" : "Visualizar"}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-muted @2xl:inline">Markdown: **negrito**, listas, tabelas, `código`, &gt; citação, - [ ] tarefas</span>
      </div>
      {/* @lg (32rem/512px de largura do container, não da viewport) é o ponto em que sobra espaço
         para duas colunas legíveis — em telas de notebook (~930px), lg: de viewport nunca ativava
         aqui porque a sidebar e o padding do layout já consomem boa parte da largura (achado C1). */}
      <div className={`grid gap-4 ${view === "split" ? "@lg:grid-cols-2" : ""}`}>
        {view !== "preview" && (
          <textarea name="content" value={content} onChange={(e) => setContent(e.target.value)} spellCheck
            className="h-64 w-full rounded-control border border-line bg-field p-3 font-mono text-[13px] leading-relaxed" />
        )}
        {view === "preview" && <input type="hidden" name="content" value={content} />}
        {view !== "edit" && (
          <div className="h-64 overflow-auto rounded-control border border-line bg-field p-5">
            <Markdown>{content || "_Nada escrito ainda._"}</Markdown>
          </div>
        )}
      </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {step > 0 && <Button type="button" tone="quiet" onClick={() => { setStepError(""); setStep(0); }}>Voltar</Button>}
        {step === 0 ? (
          <Button type="button" onClick={(e) => {
            const form = e.currentTarget.form;
            const title = form ? new FormData(form).get("title") : "";
            if (!String(title ?? "").trim()) { setStepError("Dê um título à página."); return; }
            setStepError("");
            setStep(1);
          }}>Avançar</Button>
        ) : (
          <Button disabled={pending}>{pending ? "Salvando…" : "Salvar página"}</Button>
        )}
        <a href={`/services/${slug}?tab=rules`} className="text-sm text-muted">Cancelar</a>
        {stepError && <p role="alert" className="text-sm text-danger">{stepError}</p>}
        <Feedback state={state} />
      </div>
    </form>
  );
}
