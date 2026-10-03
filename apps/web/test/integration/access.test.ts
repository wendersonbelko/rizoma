import { describe, expect, it } from "vitest";
import { prisma } from "@api-hub/db";
import { evaluateAccess } from "@/lib/access";
import { install, makeUser } from "./helpers";

describe("política de acesso com banco real", () => {
  it("membro da org entra direto como VIEWER, sem pedido", async () => {
    await install();
    const u = await makeUser("ana", { status: "PENDING" });

    expect(await evaluateAccess(u.id, "member")).toEqual({ ok: true });
    const after = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(after).toMatchObject({ status: "ACTIVE", role: "VIEWER", accessGrant: "ORG_MEMBERSHIP", isOrgMember: true });
    expect(await prisma.accessRequest.count()).toBe(0);
  });

  it("pessoa de fora fica pendente com um único pedido, mesmo entrando várias vezes", async () => {
    await install({ autoApproveOrgMembers: true, outsiderPolicy: "REQUEST_APPROVAL" });
    const u = await makeUser("bia", { status: "PENDING" });

    await evaluateAccess(u.id, "not_member");
    await evaluateAccess(u.id, "not_member");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).status).toBe("PENDING");
    expect(await prisma.accessRequest.count({ where: { userId: u.id, status: "PENDING" } })).toBe(1);
  });

  it("quem sai da org é suspenso e volta sozinho quando retorna", async () => {
    await install();
    const u = await makeUser("caio", { accessGrant: "ORG_MEMBERSHIP" });
    expect(await evaluateAccess(u.id, "not_member")).toEqual({ ok: false });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).toMatchObject({ status: "SUSPENDED", statusReason: "ORG_MEMBERSHIP_LOST" });
    expect(await evaluateAccess(u.id, "member")).toEqual({ ok: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).status).toBe("ACTIVE");
  });

  it("token revogado pede novo login sem mexer no status", async () => {
    await install();
    const u = await makeUser("davi", { accessGrant: "ORG_MEMBERSHIP" });

    expect(await evaluateAccess(u.id, "token_invalid")).toEqual({ ok: false, reason: "reauth" });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).status).toBe("ACTIVE");
  });

  it("política BLOCK barra quem é de fora e invalida o JWT (tokenVersion)", async () => {
    await install({ outsiderPolicy: "BLOCK" });
    const u = await makeUser("edu", { status: "PENDING" });

    expect(await evaluateAccess(u.id, "not_member")).toEqual({ ok: false, reason: "not_member" });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).tokenVersion).toBe(1);
  });

  it("janela de recuperação transforma o login em OWNER e fecha em seguida", async () => {
    await install({ recoveryIdentifier: "fer", recoveryExpiresAt: new Date(Date.now() + 600_000), outsiderPolicy: "BLOCK" });
    const u = await makeUser("fer", { status: "PENDING" });

    expect(await evaluateAccess(u.id, "not_member")).toEqual({ ok: true });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).toMatchObject({ role: "OWNER", status: "ACTIVE" });
    const inst = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
    expect(inst.recoveryIdentifier).toBeNull();
    expect(await prisma.auditLog.count({ where: { action: "owner.recovered" } })).toBe(1);
  });

  it("janela de recuperação vencida não vale", async () => {
    await install({ recoveryIdentifier: "gil", recoveryExpiresAt: new Date(Date.now() - 1000) });
    const u = await makeUser("gil", { status: "PENDING" });

    await evaluateAccess(u.id, "not_member");
    expect(await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).toMatchObject({ role: "VIEWER", status: "PENDING" });
  });

  it("recuperação também funciona por e-mail", async () => {
    await install({ recoveryIdentifier: "helena@fora.com", recoveryExpiresAt: new Date(Date.now() + 600_000) });
    const u = await prisma.user.create({ data: { email: "helena@fora.com", name: "Helena", status: "PENDING" } });
    expect(await evaluateAccess(u.id, "not_member")).toEqual({ ok: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).role).toBe("OWNER");
  });
});
