import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@api-hub/db";
import { can, decryptSecret } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { asCurrent, install, makeUser } from "./helpers";

// Quem está "logado" em cada teste. As ações usam o requirePermission real de permissões (can).
let current: CurrentUser | null = null;
vi.mock("@/lib/guards", () => ({
  requireUser: async () => { if (!current) throw new Error("NEXT_REDIRECT:/login"); return current; },
  requirePermission: async (p: Parameters<typeof can>[1]) => {
    if (!current) throw new Error("NEXT_REDIRECT:/login");
    if (!can(current, p)) throw new Error("NEXT_NOT_FOUND");
    return current;
  },
}));

const { decideAccessRequest } = await import("@/app/(hub)/admin/people/actions");
const { updateService, setArchived } = await import("@/app/(hub)/services/[slug]/edit/actions");
const { getGithubToken, sealToken } = await import("@/lib/github-token");

const form = (data: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
};

beforeEach(() => { current = null; });

describe("aprovação de acesso", () => {
  it("aprova pessoa externa com prazo e registra auditoria", async () => {
    await install();
    current = await asCurrent((await makeUser("admin", { role: "ADMIN" })).id);
    const guest = await makeUser("consultor", { status: "PENDING" });
    const req = await prisma.accessRequest.create({ data: { userId: guest.id, expiresAt: new Date(Date.now() + 86_400_000) } });

    await decideAccessRequest(form({ requestId: req.id, decision: "approve", role: "VIEWER", expiresInDays: "30" }));

    const after = await prisma.user.findUniqueOrThrow({ where: { id: guest.id } });
    expect(after).toMatchObject({ status: "ACTIVE", role: "VIEWER", accessGrant: "MANUAL_APPROVAL" });
    const days = (after.accessExpiresAt!.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(await prisma.auditLog.count({ where: { action: "access.approved", actorId: current.id } })).toBe(1);
  });

  it("ADMIN não concede ADMIN e ninguém decide o próprio pedido", async () => {
    await install();
    const admin = await makeUser("admin", { role: "ADMIN" });
    current = await asCurrent(admin.id);
    const guest = await makeUser("x", { status: "PENDING" });
    const req = await prisma.accessRequest.create({ data: { userId: guest.id, expiresAt: new Date(Date.now() + 86_400_000) } });
    await expect(decideAccessRequest(form({ requestId: req.id, decision: "approve", role: "ADMIN" }))).rejects.toThrow(/Proprietário/);

    const own = await prisma.accessRequest.create({ data: { userId: admin.id, expiresAt: new Date(Date.now() + 86_400_000) } });
    await expect(decideAccessRequest(form({ requestId: own.id, decision: "approve" }))).rejects.toThrow(/própria solicitação/);
  });

  it("VIEWER não chega na ação", async () => {
    await install();
    current = await asCurrent((await makeUser("leitor")).id);
    await expect(decideAccessRequest(form({ requestId: "x", decision: "approve" }))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("edição e arquivamento de serviços", () => {
  async function scenario() {
    await install();
    const [pagamentos, logistica] = await Promise.all([
      prisma.team.create({ data: { slug: "pagamentos", name: "Pagamentos" } }),
      prisma.team.create({ data: { slug: "logistica", name: "Logística" } }),
    ]);
    const dev = await makeUser("dev", { role: "MAINTAINER" });
    await prisma.teamMember.create({ data: { teamId: pagamentos.id, userId: dev.id } });
    const svc = await prisma.service.create({ data: { slug: "cobranca", name: "Cobrança", ownerTeamId: pagamentos.id } });
    return { pagamentos, logistica, dev, svc };
  }
  const base = (svc: { id: string }, over: Record<string, string> = {}) =>
    form({ id: svc.id, slug: "cobranca", name: "Cobrança", visibility: "ORG", lifecycle: "production", tags: "", ...over });

  it("MAINTAINER edita serviço do próprio time", async () => {
    const { dev, svc, pagamentos } = await scenario();
    current = await asCurrent(dev.id);
    const r = await updateService({ ok: false }, base(svc, { name: "Cobrança v2", ownerTeamId: pagamentos.id, tags: "Financeiro, core" }));
    expect(r.ok).toBe(true);
    expect(await prisma.service.findUniqueOrThrow({ where: { id: svc.id } })).toMatchObject({ name: "Cobrança v2", tags: ["financeiro", "core"] });
    expect(await prisma.auditLog.count({ where: { action: "service.updated" } })).toBe(1);
  });

  it("MAINTAINER não passa o serviço para outro time", async () => {
    const { dev, svc, logistica } = await scenario();
    current = await asCurrent(dev.id);
    const r = await updateService({ ok: false }, base(svc, { ownerTeamId: logistica.id }));
    expect(r).toMatchObject({ ok: false });
  });

  it("slug congela depois da primeira spec", async () => {
    const { svc } = await scenario();
    current = await asCurrent((await makeUser("chefe", { role: "ADMIN" })).id);
    await prisma.apiSpec.create({ data: { serviceId: svc.id, environmentId: "env_prod", version: "1", format: "openapi-3.1", content: "{}", checksum: "c", sizeBytes: 2, source: "CI_PUSH" } });
    const r = await updateService({ ok: false }, base(svc, { slug: "cobranca-nova" }));
    expect(r.message).toMatch(/slug/);
  });

  it("arquivar revoga os tokens; MAINTAINER não arquiva", async () => {
    const { dev, svc } = await scenario();
    await prisma.serviceToken.create({ data: { serviceId: svc.id, name: "ci", prefix: "ahub_x", hash: "h1", createdById: dev.id } });

    current = await asCurrent(dev.id);
    await expect(setArchived(form({ id: svc.id, archive: "1" }))).rejects.toThrow("NEXT_NOT_FOUND");

    current = await asCurrent((await makeUser("chefe", { role: "ADMIN" })).id);
    await expect(setArchived(form({ id: svc.id, archive: "1" }))).rejects.toThrow("NEXT_REDIRECT:/admin/services");
    expect((await prisma.service.findUniqueOrThrow({ where: { id: svc.id } })).archivedAt).not.toBeNull();
    expect(await prisma.serviceToken.count({ where: { serviceId: svc.id, revokedAt: null } })).toBe(0);
  });
});

describe("token do GitHub em repouso", () => {
  it("cifra tokens antigos na primeira leitura e nunca guarda texto puro", async () => {
    const u = await makeUser("ana");
    await prisma.account.create({ data: { userId: u.id, type: "oauth", provider: "github", providerAccountId: "1", access_token: "gho_legado" } });

    expect(await getGithubToken(u.id)).toBe("gho_legado");
    const stored = (await prisma.account.findFirstOrThrow({ where: { userId: u.id } })).access_token!;
    expect(stored.startsWith("v1.")).toBe(true);
    expect(decryptSecret(stored)).toBe("gho_legado");
    expect(await getGithubToken(u.id)).toBe("gho_legado");
    expect(sealToken(stored)).toBe(stored);
  });
});
