"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { Button, Field, Input, Notice, Select } from "@/components/ui";
import { addRepository } from "../actions";
import { OptionalDetails } from "./optional-details";
import { useRegistryForm } from "./use-registry-form";

const PROVIDER_LABEL: Record<string, string> = { GITHUB: "GitHub", GITLAB: "GitLab", BITBUCKET: "Bitbucket", GENERIC: "Outro" };

/**
 * Provedores disponíveis vêm de Configurações → Conexões; "Outro" sempre existe (só URL). O aviso de GitHub sem token
 * veio do assistente antigo de serviço (que deixou de existir): sem token o servidor não confirma o repositório.
 */
export function RepositoryForm({ providers, githubToken, canConfigureSources }: {
  providers: string[];
  githubToken: "integration" | "personal" | null;
  canConfigureSources: boolean;
}) {
  // O que a instalação já configurou vem primeiro (é o que mais se usa); GitHub sempre aparece, porque o token pessoal também serve.
  const options = [...new Set([...providers.filter((p) => p !== "GENERIC"), "GITHUB", "GENERIC"])];
  const [provider, setProvider] = useState(options[0]!);
  const { state, pending, submit, reject, clearError } = useRegistryForm(addRepository);
  useCloseOnSuccess(state, pending);
  const errors = state.ok ? {} : state.fieldErrors ?? {};
  const githubBlocked = provider === "GITHUB" && !githubToken;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found: Record<string, string> = {};
    if (!String(data.get("fullName") ?? "").trim()) found.fullName = "Informe o repositório no formato grupo/repositório, por exemplo empresa/pedidos-api.";
    if (provider === "GENERIC" && !String(data.get("url") ?? "").trim()) found.url = "Informe a URL do repositório, começando por https://.";
    if (Object.keys(found).length) return reject(found);
    submit(data);
  }

  const showMessage = state.message && !state.ok && Object.values(errors).every((v) => !v);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Onde está *">
        <Select name="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
          {options.map((p) => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
        </Select>
      </Field>

      <Field
        label={provider === "GENERIC" ? "Nome (grupo/repositório) *" : "Repositório *"}
        hint={provider === "GITLAB" ? "Aceita subgrupos: grupo/subgrupo/projeto." : "No formato grupo/repositório."}
        error={errors.fullName}
      >
        <Input
          name="fullName"
          placeholder={provider === "GITLAB" ? "backend/pagamentos/pix-api" : "empresa/pedidos-api"}
          aria-invalid={!!errors.fullName}
          autoComplete="off"
          spellCheck={false}
          onChange={() => clearError("fullName")}
        />
      </Field>

      {provider === "GENERIC" && (
        <Field label="URL do repositório *" error={errors.url}>
          <Input name="url" type="url" placeholder="https://git.empresa.com/pedidos" aria-invalid={!!errors.url} onChange={() => clearError("url")} />
        </Field>
      )}

      {githubBlocked && (
        <Notice tone="wait" title="O GitHub não tem token configurado">
          Sem token, o hub não consegue confirmar que o repositório existe.{" "}
          {canConfigureSources ? (
            <Link href="/admin/settings?s=connections" className="text-accent underline">Configurar em Configurações → Conexões</Link>
          ) : (
            "Peça a quem administra o hub para configurar o token, ou entre com a sua conta do GitHub."
          )}{" "}
          Você também pode escolher “Outro” e informar a URL.
        </Notice>
      )}
      {provider === "GITHUB" && githubToken === "personal" && (
        <p className="text-sm text-muted">Usando o seu token pessoal do GitHub: só aparecem repositórios a que a sua conta tem acesso.</p>
      )}

      {provider === "GENERIC" && (
        <OptionalDetails summary="branch padrão">
          <Field label="Branch padrão" hint="Se ficar vazio, usamos main.">
            <Input name="defaultBranch" placeholder="main" />
          </Field>
        </OptionalDetails>
      )}

      <ModalActions message={showMessage ? <span className="text-danger">{state.message}</span> : undefined}>
        <Button disabled={pending || githubBlocked}>{pending ? "Adicionando…" : "Adicionar repositório"}</Button>
      </ModalActions>
    </form>
  );
}
