import { headers } from "next/headers";
import { prisma, type Prisma } from "@api-hub/db";

export async function audit(entry: {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  let ip: string | undefined;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
  } catch {
    // fora de um request (ex.: evento do Auth.js em background)
  }
  await prisma.auditLog.create({ data: { ...entry, actorId: entry.actorId ?? null, ip } });
}
