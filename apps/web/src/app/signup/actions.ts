"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { signup } from "@/lib/local-auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email("E-mail inválido."),
  password: z.string().max(128),
  reason: z.string().trim().min(10, "Explique em pelo menos 10 caracteres por que precisa de acesso.").max(500),
});

export async function signupAction(_: { ok?: boolean; error?: string }, form: FormData): Promise<{ ok?: boolean; error?: string }> {
  const ip = (await headers()).get("x-forwarded-for") ?? "local";
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60_000)) return { error: "Muitos cadastros deste endereço. Tente mais tarde." };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (parsed.data.password !== form.get("confirm")) return { error: "As senhas não conferem." };
  const r = await signup(parsed.data);
  return r.ok ? { ok: true } : { error: r.error };
}
