"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChipInput } from "@/components/chip-input";
import { Button, Field, Input, Select } from "@/components/ui";
import { NameSlugFields } from "@/components/name-slug-fields";
import { createService, type ActionResult } from "./actions";
import { initialWizardState, validateStep1, validateStep2, wizardReducer } from "./wizard/state";
import { STEPS, type Env, type Opt, type StepId } from "./wizard/types";
import { WizardSteps } from "./wizard/wizard-steps";
import { RepoStep } from "./wizard/repo-step";
import { SpecStep } from "./wizard/spec-step";

const initial: ActionResult = { ok: false };

/**
 * Wizard de 4 passos para "Novo serviço" (achado da revisão de UX de 28/09/2026, Seção 3):
 * hoje criar um serviço completo — dados, time, repositório e spec — exigia transitar por
 * várias telas sem contexto do que falta. Os passos 1-2 formam um único formulário (sem ida
 * ao servidor entre eles); ao avançar do 2 o serviço é criado de verdade, e os passos 3-4
 * (opcionais, em wizard/repo-step.tsx e wizard/spec-step.tsx) operam sobre esse serviço já
 * existente. Este arquivo só orquestra: o estado mora em wizard/state.ts e cada passo é
 * responsabilidade de um componente à parte.
 */
export function ServiceWizard(props: {
  teams: Opt[];
  /** true quando a pessoa não tem service:edit_any (RN-22): precisa escolher um time. */
  requireTeam: boolean;
  repositories: Opt[];
  providers: string[];
  githubToken: "integration" | "personal" | null;
  canConfigureSources: boolean;
  envs: Env[];
  canPublishSpec: boolean;
}) {
  const router = useRouter();
  const [s, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // a11y: ao trocar de passo, o foco vai para o título do passo.
  useEffect(() => {
    headingRef.current?.focus();
  }, [s.step]);

  function focusField(name: string) {
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus());
  }

  function advanceFrom1() {
    const errs = validateStep1(new FormData(formRef.current!));
    if (Object.keys(errs).length) {
      dispatch({ type: "errors", errors: errs, step: 1 });
      focusField(Object.keys(errs)[0]!);
      return;
    }
    dispatch({ type: "complete", step: 1, outcome: "done" });
  }

  function createNow() {
    if (s.created || pending) return; // nunca recria
    const fd = new FormData(formRef.current!);
    const e1 = validateStep1(fd);
    if (Object.keys(e1).length) {
      dispatch({ type: "errors", errors: e1, step: 1 });
      focusField(Object.keys(e1)[0]!);
      return;
    }
    const e2 = validateStep2(fd, props.requireTeam);
    if (Object.keys(e2).length) {
      dispatch({ type: "errors", errors: e2, step: 2 });
      focusField("ownerTeamId");
      return;
    }
    startTransition(async () => {
      try {
        const r = await createService(initial, fd);
        if (r.ok && r.id && r.slug) {
          dispatch({ type: "created", service: { id: r.id, slug: r.slug, name: String(fd.get("name")) } });
          return;
        }
        const fe = r.fieldErrors ?? {};
        dispatch({ type: "errors", errors: fe as Record<string, string>, message: r.message, step: fe.name || fe.slug ? 1 : 2 });
      } catch {
        dispatch({ type: "errors", errors: {}, message: "Não foi possível criar o serviço. Tente de novo." });
      }
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (s.step === 1) advanceFrom1();
    else if (s.step === 2) createNow();
  }

  const canGoto = (id: StepId) => id === 1 || (id === 2 && (!!s.outcomes[1] || !!s.created)) || (id >= 3 && !!s.created);
  const finish = () => s.created && router.push(`/services/${s.created.slug}`);
  const clear = (f: string) => s.errors[f] && dispatch({ type: "clearError", field: f });

  return (
    <div className="space-y-6">
      <WizardSteps current={s.step} outcomes={s.outcomes} canGoto={canGoto} onGoto={(id) => dispatch({ type: "goto", step: id })} />

      {s.created && (
        <p className="text-sm text-muted" role="status">
          ✓ Serviço <strong className="text-ink">{s.created.name}</strong> criado.{" "}
          <Link href={`/services/${s.created.slug}`} className="text-accent">Ir para o serviço</Link> (os próximos passos são opcionais).
        </p>
      )}

      <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">
        Passo {s.step} de 4 · {STEPS[s.step - 1]!.label}
        {STEPS[s.step - 1]!.optional && <span className="font-normal text-muted"> (opcional)</span>}
      </h3>

      {/* Passos 1 e 2: um formulário só, sempre montado (NameSlugFields guarda estado interno). */}
      <form ref={formRef} onSubmit={onSubmit} noValidate className={s.step <= 2 ? "space-y-4" : "hidden"}>
        {s.created && (
          <p className="rounded-control border border-line bg-paper p-3 text-sm text-muted">
            O serviço já foi criado; estes dados são só para consulta.{" "}
            <Link href={`/services/${s.created.slug}/edit`} className="text-accent">Editar serviço</Link>
          </p>
        )}
        <fieldset disabled={!!s.created} className="contents">
          <div className={s.step === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
            <NameSlugFields
              errors={s.errors}
              slugHint="Aparece na URL: {/services/{slug}}. Gerado a partir do nome; pode editar."
              onEdit={clear}
            />
            <Field label="Descrição" error={s.errors.description}><Input name="description" onChange={() => clear("description")} /></Field>
            <Field label="Tags" hint="Digite uma tag e clique em +. Até 10." error={s.errors.tags}>
              <ChipInput name="tags" max={10} normalize={(v) => v.toLowerCase().slice(0, 30)} placeholder="checkout" addLabel="Adicionar tag" onChange={() => clear("tags")} />
            </Field>
            <Field label="Tipo" hint="API publica contrato HTTP. Frontend e worker entram no mapa pelas ligações, sem spec obrigatória.">
              <Select name="kind" defaultValue="API">
                <option value="API">API</option>
                <option value="FRONTEND">Frontend</option>
                <option value="WORKER">Worker</option>
              </Select>
            </Field>
          </div>
          <div className={s.step === 2 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
            <Field label="Time responsável" error={s.errors.ownerTeamId} hint="Escolha um dos seus times: quem não é responsável pelo serviço não pode gerenciá-lo.">
              <Select name="ownerTeamId" defaultValue="" aria-invalid={!!s.errors.ownerTeamId} onChange={() => clear("ownerTeamId")}>
                <option value="">{props.requireTeam ? "Escolha…" : "Sem time"}</option>
                {props.teams.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Quem pode ver" hint="“Só o time” esconde o serviço do catálogo e do mapa para quem está fora dele.">
              <Select name="visibility" defaultValue="ORG"><option value="ORG">Toda a empresa</option><option value="TEAM">Só o time responsável</option></Select>
            </Field>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          {s.step === 2 && !s.created && <Button type="button" tone="quiet" onClick={() => dispatch({ type: "goto", step: 1 })}>Voltar</Button>}
          {s.created ? (
            <Button type="button" onClick={() => dispatch({ type: "goto", step: 3 })}>Continuar</Button>
          ) : s.step === 1 ? (
            <Button type="submit">Avançar</Button>
          ) : (
            <Button type="submit" disabled={pending}>{pending ? "Criando…" : "Criar serviço e continuar"}</Button>
          )}
          {s.message && <p className="text-sm text-danger" role="alert">{s.message}</p>}
        </div>
      </form>

      {s.step === 3 && s.created && (
        <RepoStep
          serviceId={s.created.id}
          repositories={props.repositories}
          providers={props.providers}
          githubToken={props.githubToken}
          canConfigureSources={props.canConfigureSources}
          onBack={() => dispatch({ type: "goto", step: 2 })}
          onDone={(o) => dispatch({ type: "complete", step: 3, outcome: o })}
        />
      )}
      {s.step === 4 && s.created && (
        <SpecStep
          serviceId={s.created.id}
          envs={props.envs}
          canPublish={props.canPublishSpec}
          onBack={() => dispatch({ type: "goto", step: 3 })}
          onFinish={finish}
        />
      )}
    </div>
  );
}
