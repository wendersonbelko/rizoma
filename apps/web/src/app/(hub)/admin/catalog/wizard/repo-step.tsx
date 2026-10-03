"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { SERVICE_REPO_ROLE_LABEL, type ServiceRepoRole } from "@api-hub/core/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { addRepository, createLink, type ActionResult } from "../actions";
import { PROVIDER_LABEL, type Opt, type Outcome } from "./types";
import { RoleField } from "./role-field";

const initial: ActionResult = { ok: false };

/** Passo 3 do wizard: vincular um repositório já cadastrado ou cadastrar um novo. */
export function RepoStep({ serviceId, repositories, providers, githubToken, canConfigureSources, onBack, onDone }: {
  serviceId: string; repositories: Opt[]; providers: string[]; githubToken: "integration" | "personal" | null; canConfigureSources: boolean;
  onBack: () => void; onDone: (o: Outcome) => void;
}) {
  const options = [...new Set(["GITHUB", ...providers.filter((p) => p !== "GENERIC"), "GENERIC"])];
  const [mode, setMode] = useState<"existing" | "new">(repositories.length ? "existing" : "new");
  const [provider, setProvider] = useState(options[0]!);
  const [role, setRole] = useState<ServiceRepoRole>("SOURCE");
  const [linked, setLinked] = useState<string[]>([]);
  const [pendingRepo, setPendingRepo] = useState<{ id: string; label: string } | null>(null); // criado, vínculo falhou
  const [message, setMessage] = useState<string>();
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const githubBlocked = mode === "new" && provider === "GITHUB" && !githubToken;

  async function link(repositoryId: string, label: string) {
    const fd = new FormData();
    fd.set("type", "service-repository");
    fd.set("serviceId", serviceId);
    fd.set("repositoryId", repositoryId);
    fd.set("role", role);
    const r = await createLink(initial, fd);
    if (r.ok) {
      setLinked((l) => [...l, `${label} (${SERVICE_REPO_ROLE_LABEL[role]})`]);
      setPendingRepo(null);
      setMessage(undefined);
      setFormKey((k) => k + 1);
    } else {
      setMessage(r.message ?? "Não foi possível vincular.");
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        if (pendingRepo) return await link(pendingRepo.id, pendingRepo.label);
        if (mode === "existing") {
          const id = String(fd.get("repositoryId") ?? "");
          if (!id) return setMessage("Escolha um repositório.");
          return await link(id, repositories.find((r) => r.id === id)?.label ?? "Repositório");
        }
        const add = new FormData();
        add.set("provider", provider);
        add.set("fullName", String(fd.get("fullName") ?? ""));
        if (provider === "GENERIC") {
          add.set("url", String(fd.get("url") ?? ""));
          add.set("defaultBranch", String(fd.get("defaultBranch") || "main"));
        }
        const r = await addRepository(initial, add);
        if (!r.ok || !r.id || !r.slug) return setMessage(r.message ?? "Não foi possível cadastrar o repositório.");
        setPendingRepo({ id: r.id, label: r.slug });
        await link(r.id, r.slug);
      } catch {
        setMessage("Não foi possível vincular o repositório.");
      }
    });
  }

  return (
    <form key={formKey} onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-muted">Ligue o serviço ao repositório de código. Dá para fazer depois em "Vínculos".</p>
      {linked.length > 0 && <ul className="space-y-1 text-sm">{linked.map((l) => <li key={l} className="text-accent">✓ {l} vinculado</li>)}</ul>}

      <div className="flex flex-wrap gap-4 text-sm" role="radiogroup" aria-label="Origem do repositório">
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === "existing"} disabled={!repositories.length} onChange={() => { setMode("existing"); setPendingRepo(null); }} />
          Já cadastrado
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === "new"} onChange={() => { setMode("new"); setPendingRepo(null); }} />
          Cadastrar novo
        </label>
      </div>

      {mode === "existing" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Repositório">
            <Select name="repositoryId" defaultValue=""><option value="">Escolha…</option>{repositories.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</Select>
          </Field>
          <RoleField role={role} setRole={setRole} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)_200px]">
            <Field label="Onde está">
              <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                {options.map((p) => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
              </Select>
            </Field>
            <Field label={provider === "GENERIC" ? "Nome (grupo/repositório)" : "Repositório"} hint={provider === "GITLAB" ? "Aceita subgrupos: grupo/subgrupo/projeto." : undefined}>
              <Input name="fullName" placeholder={provider === "GITLAB" ? "backend/pagamentos/pix-api" : "empresa/pedidos-api"} />
            </Field>
            <RoleField role={role} setRole={setRole} />
          </div>
          {provider === "GENERIC" && (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <Field label="URL do repositório"><Input name="url" type="url" placeholder="https://git.empresa.com/pedidos" /></Field>
              <Field label="Branch padrão"><Input name="defaultBranch" defaultValue="main" /></Field>
            </div>
          )}
          {githubBlocked && (
            <div role="alert" className="rounded-control border border-wait bg-paper p-3 text-sm">
              <p className="font-semibold text-wait">O GitHub não tem token configurado.</p>
              <p className="mt-1 text-muted">
                Sem token, o hub não consegue confirmar que o repositório existe e o vínculo falharia com "Repositório não encontrado ou sem acesso".{" "}
                {canConfigureSources ? (
                  <Link href="/admin/settings?s=repositories" className="text-accent underline">Configurar em Configurações → Repositórios</Link>
                ) : (
                  "Peça a quem administra o hub para configurar o token, ou entre com sua conta do GitHub."
                )}{" "}
                Você também pode escolher "Outro" e informar a URL, ou pular esta etapa.
              </p>
            </div>
          )}
          {mode === "new" && provider === "GITHUB" && githubToken === "personal" && (
            <p className="text-sm text-muted">Usando o seu token pessoal do GitHub: só aparecem repositórios a que a sua conta tem acesso.</p>
          )}
        </>
      )}

      {message && <p className="text-sm text-danger" role="alert">{message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" tone="quiet" onClick={onBack}>Voltar</Button>
        <Button type="submit" disabled={pending || githubBlocked}>{pending ? "Vinculando…" : pendingRepo ? "Tentar vincular de novo" : linked.length ? "Vincular outro" : "Vincular"}</Button>
        {linked.length > 0 ? (
          <Button type="button" tone="quiet" onClick={() => onDone("done")}>Avançar</Button>
        ) : (
          <Button type="button" tone="quiet" onClick={() => onDone("skipped")}>Pular etapa</Button>
        )}
      </div>
    </form>
  );
}
