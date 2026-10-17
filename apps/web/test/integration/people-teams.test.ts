import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@api-hub/db";
import { can } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { asCurrent, install, makeUser } from "./helpers";

let current: CurrentUser | null = null;
vi.mock("@/lib/guards", () => ({
  requireUser: async () => { if (!current) throw new Error("NEXT_REDIRECT:/login"); return current; },
  requirePermission: async (p: Parameters<typeof can>[1]) => {
    if (!current) throw new Error("NEXT_REDIRECT:/login");
    if (!can(current, p)) throw new Error("NEXT_NOT_FOUND");
    return current;
  },
}));

const teams = await import("@/app/(hub)/admin/teams/actions");
const people = await import("@/app/(hub)/admin/people/actions");

const form = (data: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
};

beforeEach(async () => {
  current = null;
  await install();
  current = await asCurrent((await makeUser("dona", { role: "OWNER" })).id);
});

describe("times", () => {
  it("cria o time e devolve o erro de endereço repetido no campo certo", async () => {
    const ok = await teams.createTeam({ ok: false }, form({ name: "Pagamentos", slug: "pagamentos" }));
    expect(ok.ok).toBe(true);
    const again = await teams.createTeam({ ok: false }, form({ name: "Pagamentos 2", slug: "pagamentos" }));
    expect(again.ok).toBe(false);
    expect(again.errors?.slug).toMatch(/endereço/);
    const short = await teams.createTeam({ ok: false }, form({ name: "P", slug: "p" }));
    expect(short.errors?.name).toMatch(/pelo menos 2/);
  });

  it("adicionar membro: pessoa sem acesso ativo vira erro do campo; com acesso grava o nome na auditoria", async () => {
    const team = await prisma.team.create({ data: { slug: "pagamentos", name: "Pagamentos" } });
    const ana = await makeUser("ana", { name: "Ana Souza" });

    const missing = await teams.addMember({ ok: false }, form({ teamId: team.id, login: "@ninguem", role: "MEMBER" }));
    expect(missing.ok).toBe(false);
    expect(missing.errors?.login).toMatch(/ninguem/);

    const added = await teams.addMember({ ok: false }, form({ teamId: team.id, login: "@ANA", role: "LEAD" }));
    expect(added.ok).toBe(true);
    expect(await prisma.teamMember.findFirstOrThrow({ where: { teamId: team.id, userId: ana.id } })).toMatchObject({ role: "LEAD" });
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "team.member_added" } });
    expect(log.metadata).toMatchObject({ login: "ana", name: "Ana Souza" });
  });
});

describe("pessoas", () => {
  it("trocar papel devolve a recusa em português, sem código de papel", async () => {
    const admin = await makeUser("adm", { role: "ADMIN" });
    const outro = await makeUser("outro", { role: "ADMIN" });
    current = await asCurrent(admin.id);
    const refused = await people.changeRole({ ok: false }, form({ userId: outro.id, role: "VIEWER" }));
    expect(refused.ok).toBe(false);
    expect(refused.message).toBeTruthy();
    expect(refused.message).not.toMatch(/OWNER|ADMIN|MAINTAINER|VIEWER/);
  });

  it("o proprietário troca o papel e a ação registra a auditoria", async () => {
    const leitor = await makeUser("leitor");
    const result = await people.changeRole({ ok: false }, form({ userId: leitor.id, role: "MAINTAINER" }));
    expect(result).toMatchObject({ ok: true });
    expect(result.message).toMatch(/Mantenedor/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: leitor.id } })).role).toBe("MAINTAINER");
    expect(await prisma.auditLog.count({ where: { action: "user.role_changed" } })).toBe(1);
  });

  it("suspender a si mesmo devolve o aviso; suspender outra pessoa funciona e reativar devolve o acesso", async () => {
    const eu = current!;
    const self = await people.setSuspended(form({ userId: eu.id, suspend: "1" }));
    expect(self).toMatchObject({ ok: false });
    expect(self.message).toMatch(/próprio acesso/);

    const alvo = await makeUser("alvo");
    expect(await people.setSuspended(form({ userId: alvo.id, suspend: "1" }))).toMatchObject({ ok: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: alvo.id } })).status).toBe("SUSPENDED");
    expect(await people.setSuspended(form({ userId: alvo.id, suspend: "0" }))).toMatchObject({ ok: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: alvo.id } })).status).toBe("ACTIVE");
  });

  it("convite com e-mail inválido devolve o erro no campo", async () => {
    await prisma.authProvider.create({ data: { type: "CREDENTIALS", enabled: true } });
    const bad = await people.inviteUser({ ok: false }, form({ email: "isso-nao-e-email", role: "VIEWER" }));
    expect(bad.ok).toBe(false);
    expect(bad.errors?.email).toMatch(/e-mail válido/);
  });
});
