import nodemailer from "nodemailer";
import { prisma } from "@api-hub/db";
import { decryptSecret, encryptSecret, mailSettingsSchema, normalizePublicBaseUrl, type MailSettingsInput } from "@api-hub/core";

export type MailScreen = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromAddress: string;
  publicBaseUrl: string;
  hasPassword: boolean;
};

function transport(input: MailSettingsInput) {
  return nodemailer.createTransport({
    host: input.host,
    port: input.port,
    secure: input.secure,
    auth: input.user ? { user: input.user, pass: input.password ?? "" } : undefined,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  });
}

/** Abre o SMTP e, se `to` vier preenchido, manda um e-mail de prova. Não grava nada. */
export async function probeMail(input: MailSettingsInput, to?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = mailSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const tx = transport({ ...parsed.data, password: input.password });
  try {
    await tx.verify();
    if (to) {
      await tx.sendMail({
        from: parsed.data.fromAddress,
        to,
        subject: "Teste do Rizoma",
        text: "Este é um e-mail de prova. O servidor SMTP desta instalação está aceitando mensagens.",
      });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Não foi possível falar com o SMTP: ${(e as Error).message}` };
  } finally {
    tx.close();
  }
}

export async function mailForScreen(): Promise<MailScreen | null> {
  const row = await prisma.mailSettings.findUnique({ where: { id: "singleton" } });
  if (!row) return null;
  return {
    host: row.host, port: row.port, secure: row.secure, user: row.user ?? "",
    fromAddress: row.fromAddress, publicBaseUrl: row.publicBaseUrl, hasPassword: !!row.passwordEnc,
  };
}

/** Senha em branco mantém a que já está cifrada. A conexão é testada antes de gravar. */
export async function saveMailSettings(input: MailSettingsInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = mailSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const current = await prisma.mailSettings.findUnique({ where: { id: "singleton" } });
  const typed = parsed.data.password?.trim() ?? "";
  const password = typed || (current?.passwordEnc ? decryptSecret(current.passwordEnc) : "");
  if (parsed.data.user && !password) return { ok: false, error: "Informe a senha do SMTP." };
  const probe = await probeMail({ ...parsed.data, password });
  if (!probe.ok) return probe;
  const data = {
    host: parsed.data.host,
    port: parsed.data.port,
    secure: parsed.data.secure,
    user: parsed.data.user || null,
    ...(password ? { passwordEnc: encryptSecret(password) } : { passwordEnc: null }),
    fromAddress: parsed.data.fromAddress,
    publicBaseUrl: normalizePublicBaseUrl(parsed.data.publicBaseUrl),
  };
  await prisma.mailSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...data }, update: data });
  return { ok: true };
}

export async function clearMailSettings() {
  await prisma.mailSettings.deleteMany({ where: { id: "singleton" } });
}

export async function sendHubMail(
  to: string, subject: string, text: string,
): Promise<{ ok: true } | { ok: false; skipped: true } | { ok: false; error: string }> {
  const row = await prisma.mailSettings.findUnique({ where: { id: "singleton" } });
  if (!row) return { ok: false, skipped: true as const };
  const tx = transport({
    host: row.host, port: row.port, secure: row.secure, user: row.user ?? undefined,
    password: row.passwordEnc ? decryptSecret(row.passwordEnc) : undefined,
    fromAddress: row.fromAddress, publicBaseUrl: row.publicBaseUrl,
  });
  try {
    await tx.sendMail({ from: row.fromAddress, to, subject, text });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  } finally {
    tx.close();
  }
}

export async function linkBaseUrl(): Promise<string> {
  const row = await prisma.mailSettings.findUnique({ where: { id: "singleton" }, select: { publicBaseUrl: true } });
  return (row?.publicBaseUrl ?? process.env.AUTH_URL ?? "").replace(/\/+$/, "");
}
