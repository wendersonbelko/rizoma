import { randomBytes } from "node:crypto";
import { afterAll, beforeEach, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Defina TEST_DATABASE_URL para rodar os testes de integração.");
if (/prod/i.test(url)) throw new Error("TEST_DATABASE_URL parece apontar para produção. Abortando.");
process.env.DATABASE_URL = url;
process.env.ENCRYPTION_KEY ??= randomBytes(32).toString("base64");
process.env.AUTH_URL ??= "http://hub.test";

// Next fora de um request: navegação vira erro inspecionável e cache vira no-op.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); },
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "10.0.0.1" }),
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
}));

const { prisma } = await import("@api-hub/db");

const TABLES = [
  "AuditLog", "ServiceToken", "ApiSpec", "ServiceDependency", "RepositoryLink", "ServiceRepository", "Repository",
  "ServiceEnvVar", "ServiceResource", "ResourceEndpoint", "ExternalResource", "ServiceDoc", "Environment",
  "Service", "TeamMember", "Team", "AccessRequest", "UserInvite", "VerificationToken", "Account", "User",
  "AuthProvider", "RolePermission", "SourceIntegration", "Installation",
];

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`);
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await prisma.$disconnect();
});
