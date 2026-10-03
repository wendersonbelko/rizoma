"use server";
import { redirect } from "next/navigation";
import { consumeInvite } from "@/lib/local-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function acceptInvite(_: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const token = String(form.get("token") ?? "");
  if (!rateLimit(`invite:${token.slice(0, 12)}`, 10, 15 * 60_000)) return { error: "Muitas tentativas. Aguarde alguns minutos." };
  const password = String(form.get("password") ?? "");
  if (password !== form.get("confirm")) return { error: "As senhas não conferem." };
  const r = await consumeInvite(token, password, String(form.get("name") ?? "") || undefined);
  if (!r.ok) return { error: r.error };
  redirect("/login?ok=senha");
}
