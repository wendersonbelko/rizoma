"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";

export type ReasonResult = { ok: boolean; message?: string };

/** RN-15: quem pede acesso pode explicar quem é e por que precisa, enquanto o pedido está aberto. */
export async function saveReason(_: ReasonResult, form: FormData): Promise<ReasonResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "Sessão expirada. Entre de novo." };
  const parsed = z.string().trim().min(10, "Escreva pelo menos 10 caracteres.").max(500, "Use até 500 caracteres.").safeParse(form.get("reason"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const request = await prisma.accessRequest.findFirst({
    where: { userId: session.user.id, status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!request) return { ok: false, message: "Não há pedido aberto. Saia e entre de novo para abrir outro." };

  await prisma.accessRequest.update({ where: { id: request.id }, data: { reason: parsed.data } });
  await audit({ actorId: session.user.id, action: "access.reason_updated", targetType: "user", targetId: session.user.id });
  revalidatePath("/pending");
  return { ok: true, message: "Justificativa enviada ao administrador." };
}
