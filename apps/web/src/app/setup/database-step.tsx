"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { DataTable, TBody, THead, Td, Th, Tr } from "@/components/table";

type Engine = { id: string; supported: boolean };
type Migration = { name: string; finishedAt: string | null; ok: boolean };
type Status = { reachable: boolean; engines: Engine[]; current: string | null; migrations: Migration[] };
type Fields = { host: string; port: string; database: string; user: string; password: string; ssl: boolean };

const ENGINE_LABEL: Record<string, string> = { postgresql: "PostgreSQL", mysql: "MySQL", sqlite: "SQLite", sqlserver: "SQL Server" };
const emptyFields: Fields = { host: "localhost", port: "5432", database: "apihub", user: "apihub", password: "", ssl: false };

/**
 * RN-91: a única forma de trocar de banco é reiniciar o servidor com um novo DATABASE_URL —
 * o processo já está de pé com a conexão atual, então nada aqui é aplicado ao vivo.
 * Esta etapa testa uma conexão candidata e gera o trecho pronto para colar no .env.
 */
export function DatabaseStep({ onRefresh }: { onRefresh: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [engine, setEngine] = useState("postgresql");
  const [mode, setMode] = useState<"fields" | "url">("fields");
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string; envSnippet?: string } | null>(null);

  // Só avança quando a pessoa confirma (botão "Continuar"/"Verificar novamente"), nunca sozinho:
  // clicar para conferir esta etapa não deve empurrar quem só queria olhar para a próxima.
  const load = useCallback(async () => {
    const s = (await fetch("/api/setup/database", { cache: "no-store" }).then((r) => r.json())) as Status;
    setStatus(s);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const test = async () => {
    setTesting(true);
    setResult(null);
    const payload =
      mode === "url" ? { engine, mode: "url", url } : { engine, mode: "fields", ...fields, port: Number(fields.port) || 5432 };
    const res = await fetch("/api/setup/database", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await res.json().catch(() => ({ ok: false, error: "Não foi possível testar." }));
    setResult(body);
    setTesting(false);
  };

  if (!status) return <p className="text-muted">Verificando o banco…</p>;

  if (status.reachable)
    return (
      <div className="space-y-5">
        <p className="flex flex-wrap items-center gap-2 text-sm"><Badge tone="accent">Conectado</Badge> <code className="font-mono">{status.current}</code></p>
        {status.migrations.length > 0 && (
          <DataTable caption="Migrations aplicadas no banco">
            <THead>
              <Th>Migration</Th>
              <Th>Aplicada em</Th>
            </THead>
            <TBody>
              {status.migrations.map((m) => (
                <Tr key={m.name}>
                  <Td mono><span className="inline-flex flex-wrap items-center gap-2">{m.name}{!m.ok && <Badge tone="danger">falhou</Badge>}</span></Td>
                  <Td muted nowrap>{m.finishedAt ? new Date(m.finishedAt).toLocaleString("pt-BR") : "—"}</Td>
                </Tr>
              ))}
            </TBody>
          </DataTable>
        )}
        <Button onClick={onRefresh}>Continuar</Button>
      </div>
    );

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-muted">
        O servidor ainda não enxerga um banco em <code className="font-mono">DATABASE_URL</code>. O <code className="font-mono">docker-compose.yml</code> já sobe um
        PostgreSQL pronto para uso; se preferir apontar para o seu próprio banco, teste a conexão abaixo e copie o trecho gerado para o seu <code className="font-mono">.env</code>.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {status.engines.map((e) => (
          <button key={e.id} type="button" disabled={!e.supported} onClick={() => setEngine(e.id)}
            className={`rounded-control border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${engine === e.id ? "border-accent bg-field" : "border-line"}`}>
            {ENGINE_LABEL[e.id] ?? e.id}
            {!e.supported && <span className="block text-xs text-muted">Em breve</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-1 text-sm" role="tablist">
        {(["fields", "url"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-control px-3 py-1 ${mode === m ? "bg-paper font-semibold" : "text-muted"}`}>
            {m === "fields" ? "Campos separados" : "URL completa"}
          </button>
        ))}
      </div>

      {mode === "fields" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Host"><Input value={fields.host} onChange={(e) => setFields({ ...fields, host: e.target.value })} /></Field>
          <Field label="Porta"><Input value={fields.port} onChange={(e) => setFields({ ...fields, port: e.target.value })} inputMode="numeric" /></Field>
          <Field label="Banco"><Input value={fields.database} onChange={(e) => setFields({ ...fields, database: e.target.value })} /></Field>
          <Field label="Usuário"><Input value={fields.user} onChange={(e) => setFields({ ...fields, user: e.target.value })} /></Field>
          <Field label="Senha"><Input type="password" value={fields.password} onChange={(e) => setFields({ ...fields, password: e.target.value })} autoComplete="off" /></Field>
          <label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.ssl} onChange={(e) => setFields({ ...fields, ssl: e.target.checked })} className="accent-accent" /> Exigir SSL</label>
        </div>
      ) : (
        <Field label="URL de conexão"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="postgresql://usuario:senha@host:5432/banco" autoComplete="off" /></Field>
      )}

      <div className="flex items-center gap-4">
        <Button tone="quiet" disabled={testing} onClick={test}>{testing ? "Testando…" : "Testar conexão"}</Button>
        <Button tone="quiet" onClick={load}>Verificar novamente</Button>
      </div>

      {result && (
        <div className={`space-y-2 text-sm ${result.ok ? "" : "text-danger"}`}>
          <p>{result.ok ? "Conexão OK." : result.error}</p>
          {result.envSnippet && (
            <div className="space-y-1">
              <p className="text-muted">Cole no <code className="font-mono">.env</code> do servidor e reinicie (ex.: <code className="font-mono">docker compose --profile app up -d --build</code>). Depois clique em “Verificar novamente”.</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-control border border-line bg-field px-2 py-1 font-mono text-[12px]">{result.envSnippet}</code>
                <button type="button" className="text-accent" onClick={() => navigator.clipboard?.writeText(result.envSnippet!)}>copiar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
