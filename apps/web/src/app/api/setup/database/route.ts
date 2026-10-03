import { prisma, buildPostgresUrl, listAppliedMigrations, maskConnectionUrl, testDatabaseConnection } from "@api-hub/db";
import { databaseInputSchema, DATABASE_ENGINES, SUPPORTED_DATABASE_ENGINES } from "@api-hub/core";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const json = (status: number, body: unknown) => Response.json(body, { status });

function connectionStringFrom(data: { mode: "url"; url: string } | { mode: "fields"; host: string; port: number; database: string; user: string; password: string; ssl: boolean }) {
  return data.mode === "url" ? data.url : buildPostgresUrl(data);
}

/**
 * RN-91: status da etapa "Banco de dados". Só existe enquanto o hub não está instalado —
 * uma vez instalado, essa conversa é assunto de infraestrutura, não da tela.
 */
export async function GET() {
  let reachable = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    reachable = false;
  }
  if (reachable) {
    const installed = await prisma.installation.findUnique({ where: { id: "singleton" }, select: { installed: true } }).catch(() => null);
    if (installed?.installed) return json(404, { error: "Não encontrado." });
  }
  return json(200, {
    reachable,
    engines: DATABASE_ENGINES.map((id) => ({ id, supported: SUPPORTED_DATABASE_ENGINES.includes(id) })),
    current: reachable && process.env.DATABASE_URL ? maskConnectionUrl(process.env.DATABASE_URL) : null,
    migrations: reachable ? await listAppliedMigrations() : [],
  });
}

/** Testa uma conexão candidata. Não persiste nada — o app só troca de banco reiniciando com um novo DATABASE_URL. */
export async function POST(req: Request) {
  if (!rateLimit("setup:database-test", 20, 5 * 60_000)) return json(429, { error: "Muitas tentativas. Aguarde alguns minutos." });

  const body = await req.json().catch(() => null);
  const engine = typeof body?.engine === "string" ? body.engine : "postgresql";
  if (!SUPPORTED_DATABASE_ENGINES.includes(engine as never)) {
    return json(400, { error: "Esse banco ainda não é suportado. Por enquanto, use PostgreSQL." });
  }
  const parsed = databaseInputSchema.safeParse(body);
  if (!parsed.success) return json(422, { error: parsed.error.issues[0]?.message ?? "Dados inválidos." });

  const url = connectionStringFrom(parsed.data);
  const result = await testDatabaseConnection(url);
  if (!result.ok) return json(200, { ok: false, error: result.error });
  return json(200, { ok: true, envSnippet: `DATABASE_URL="${url}"` });
}
