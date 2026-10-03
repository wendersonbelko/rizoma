import { vi } from "vitest";
import { prisma, type Prisma } from "@api-hub/db";
import type { CurrentUser } from "@/lib/guards";

import { buildMatrix } from "@api-hub/core";

export async function install(data: Partial<Prisma.InstallationCreateInput> = {}) {
  await prisma.environment.createMany({
    data: [
      { id: "env_dev", slug: "dev", name: "Desenvolvimento", branchPatterns: ["develop", "feature/**"], syncBranch: "develop", color: "#2f6fb0", position: 0 },
      { id: "env_hml", slug: "hml", name: "Homologação", branchPatterns: ["release/*", "homolog"], syncBranch: "homolog", color: "#a86a12", position: 1 },
      { id: "env_prod", slug: "prod", name: "Produção", branchPatterns: ["main"], syncBranch: "main", color: "#0f7a68", isProduction: true, position: 2 },
    ],
  });
  return prisma.installation.create({
    data: { installed: true, orgName: "Acme", orgSlug: "acme", allowedGithubOrgs: ["acme"], allowedEmailDomains: ["acme.com"], currentStep: "revisao", ...data },
  });
}

export async function makeUser(login: string, data: Partial<Prisma.UserCreateInput> = {}) {
  return prisma.user.create({ data: { githubLogin: login, name: login, status: "ACTIVE", role: "VIEWER", ...data } });
}

export async function asCurrent(userId: string): Promise<CurrentUser> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { teams: { select: { teamId: true } }, accounts: { select: { provider: true } } } });
  const matrix = buildMatrix(await prisma.rolePermission.findMany());
  return { ...u, teamIds: u.teams.map((t) => t.teamId), permissions: matrix[u.role] };
}

/**
 * Simula a API do GitHub: `members` são os tokens com vínculo ativo na org,
 * `revoked` são tokens que o GitHub rejeita (401).
 */
export function fakeGithub(opts: { members?: string[]; revoked?: string[] }) {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const auth = new Headers(init?.headers).get("authorization") ?? "";
    const token = auth.replace(/^Bearer /, "");
    if (url.includes("/user/memberships/orgs/")) {
      if (opts.revoked?.includes(token)) return new Response("{}", { status: 401 });
      if (opts.members?.includes(token)) return Response.json({ state: "active" });
      return new Response("{}", { status: 404 });
    }
    return new Response("{}", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
