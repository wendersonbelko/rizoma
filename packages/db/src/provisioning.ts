import { Client } from "pg";
import { prisma } from "./index";

/** Campos que a tela "Banco de dados" do assistente aceita, além de uma URL pronta. */
export type DatabaseFields = { host: string; port: number; database: string; user: string; password: string; ssl: boolean };

/** Monta uma connection string do Postgres a partir dos campos separados. */
export function buildPostgresUrl(f: DatabaseFields): string {
  const auth = `${encodeURIComponent(f.user)}:${encodeURIComponent(f.password)}`;
  return `postgresql://${auth}@${f.host}:${f.port}/${encodeURIComponent(f.database)}?schema=public${f.ssl ? "&sslmode=require" : ""}`;
}

/** Nunca devolve a senha para a tela: só host, porta e nome do banco. */
export function maskConnectionUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}/${u.pathname.replace(/^\//, "") || "?"}`;
  } catch {
    return "conexão configurada";
  }
}

const CONNECT_TIMEOUT_MS = 8000;

/**
 * RN-91: testa uma connection string candidata sem afetar o cliente Prisma já em uso —
 * é a única forma de validar o banco que a pessoa está digitando antes de reiniciar o servidor.
 */
export async function testDatabaseConnection(url: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "URL de conexão inválida." };
  }
  if (!/^postgres(ql)?:$/.test(parsed.protocol)) return { ok: false, error: "Só conexões postgresql:// são aceitas por enquanto." };

  const client = new Client({ connectionString: url, connectionTimeoutMillis: CONNECT_TIMEOUT_MS });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: /password authentication failed/i.test(msg) ? "Usuário ou senha incorretos." : /does not exist/i.test(msg) ? "O banco informado não existe." : /ECONNREFUSED|ETIMEDOUT/i.test(msg) ? "Não consegui conectar nesse host e porta." : msg };
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * RN-91: lista as migrations já aplicadas no banco atual (tabela própria do `prisma migrate deploy`).
 * Lê do banco já conectado pelo app — nunca da candidata que a pessoa está testando.
 */
export async function listAppliedMigrations(): Promise<{ name: string; finishedAt: string | null; ok: boolean }[]> {
  try {
    const rows = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null; logs: string | null }[]>`
      SELECT migration_name, finished_at, rolled_back_at, logs FROM "_prisma_migrations" ORDER BY started_at ASC`;
    return rows.map((r) => ({ name: r.migration_name, finishedAt: r.finished_at?.toISOString() ?? null, ok: !r.rolled_back_at && !!r.finished_at }));
  } catch {
    return [];
  }
}
