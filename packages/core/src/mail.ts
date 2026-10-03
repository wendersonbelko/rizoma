import { z } from "zod";

/** SMTP preenchido no assistente e em Configurações. A senha não entra neste esquema quando já está salva. */
export const mailSettingsSchema = z.object({
  host: z.string().trim().min(1, "Informe o servidor SMTP.").max(200),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().trim().max(200).optional(),
  password: z.string().max(500).optional(),
  fromAddress: z.email("Remetente inválido.").transform((e) => e.toLowerCase()),
  publicBaseUrl: z.string().trim().url("Endereço público inválido.").refine((u) => /^https?:\/\//.test(u), "Use http ou https."),
});

export type MailSettingsInput = z.infer<typeof mailSettingsSchema>;

export function normalizePublicBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}
