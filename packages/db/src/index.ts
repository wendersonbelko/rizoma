import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// O client do Prisma é CommonJS. `export *` faz o Turbopack avisar em todo request
// e derruba o hot reload ("unexpected export *"). Os nomes usados pelo app vão explícitos.
export { Prisma } from "@prisma/client";
export type { AuthProvider, LinkKind, Role } from "@prisma/client";

export * from "./provisioning";
