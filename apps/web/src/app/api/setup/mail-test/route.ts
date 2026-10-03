import { headers } from "next/headers";
import { mailSettingsSchema } from "@api-hub/core";
import { getInstallation } from "@/lib/install";
import { probeMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

/** Teste de SMTP durante o assistente, antes de gravar. Não persiste a senha. */
export async function POST(req: Request) {
  const inst = await getInstallation();
  if (inst.installed) return Response.json({ error: "O hub já está instalado. Teste em Configurações." }, { status: 409 });
  if (!(await sameOrigin())) return Response.json({ error: "Origem da requisição inválida." }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { settings?: unknown; to?: string } | null;
  const parsed = mailSettingsSchema.safeParse(body?.settings);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  const to = body?.to?.trim();
  const result = await probeMail(parsed.data, to || undefined);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}

async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const site = h.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const referer = h.get("referer");
  const origin = h.get("origin") ?? (referer ? safeOrigin(referer) : null);
  if (!origin) return site === "same-origin";
  const allowed = new Set([h.get("host"), h.get("x-forwarded-host"), process.env.AUTH_URL ? safeHost(process.env.AUTH_URL) : null].filter(Boolean));
  try { return allowed.has(new URL(origin).host); } catch { return false; }
}
function safeOrigin(url: string): string | null { try { return new URL(url).origin; } catch { return null; } }
function safeHost(url: string): string | null { try { return new URL(url).host; } catch { return null; } }
