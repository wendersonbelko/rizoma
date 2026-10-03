import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@api-hub/db";
import { can, decryptSecret, hashPassword } from "@api-hub/core";
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

const svcActions = await import("@/app/(hub)/services/[slug]/actions");
const { savePermissions } = await import("@/app/(hub)/admin/permissions/actions");
const { saveAppearance } = await import("@/app/(hub)/admin/appearance/actions");
const { createInvite, consumeInvite, signup } = await import("@/lib/local-auth");
const { buildProviders } = await import("@/lib/auth-providers");
const { safeFetchText } = await import("@/lib/sources");

const form = (data: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
};

beforeEach(() => { current = null; });

async function team() {
  await install();
  const t = await prisma.team.create({ data: { slug: "pagamentos", name: "Pagamentos" } });
  const dev = await makeUser("dev", { role: "MAINTAINER" });
  await prisma.teamMember.create({ data: { teamId: t.id, userId: dev.id } });
  const svc = await prisma.service.create({ data: { slug: "cobranca", name: "Cobrança", ownerTeamId: t.id } });
  return { t, dev, svc };
}

describe("variáveis de ambiente", () => {
  it("segredo fica cifrado, só o time revela, e a auditoria não guarda valor", async () => {
    const { dev, svc } = await team();
    current = await asCurrent(dev.id);
    const r = await svcActions.saveEnvVar({ ok: false }, form({ serviceId: svc.id, environmentId: "env_prod", key: "db_password", value: "s3nh4-forte", isSecret: "on" }));
    expect(r.ok).toBe(true);
    const v = await prisma.serviceEnvVar.findFirstOrThrow();
    expect(v).toMatchObject({ key: "DB_PASSWORD", value: null, isSecret: true });
    expect(decryptSecret(v.valueEnc!)).toBe("s3nh4-forte");

    expect(await svcActions.revealEnvVar(v.id)).toMatchObject({ ok: true, value: "s3nh4-forte" });
    current = await asCurrent((await makeUser("outro", { role: "MAINTAINER" })).id);
    expect((await svcActions.revealEnvVar(v.id)).ok).toBe(false);

    const logs = await prisma.auditLog.findMany({ where: { action: { startsWith: "envvar." } } });
    expect(logs.map((l) => l.action).sort()).toEqual(["envvar.created", "envvar.revealed"]);
    expect(JSON.stringify(logs)).not.toContain("s3nh4-forte");
  });

  it("nome com cara de segredo exige confirmação para ficar aberto; segredo em branco mantém o valor", async () => {
    const { dev, svc } = await team();
    current = await asCurrent(dev.id);
    const aberto = await svcActions.saveEnvVar({ ok: false }, form({ serviceId: svc.id, environmentId: "env_dev", key: "API_TOKEN", value: "x" }));
    expect(aberto.ok).toBe(false);
    await svcActions.saveEnvVar({ ok: false }, form({ serviceId: svc.id, environmentId: "env_dev", key: "API_TOKEN", value: "tok-1", isSecret: "on" }));
    await svcActions.saveEnvVar({ ok: false }, form({ serviceId: svc.id, environmentId: "env_dev", key: "API_TOKEN", value: "", isSecret: "on", description: "novo texto" }));
    const v = await prisma.serviceEnvVar.findFirstOrThrow();
    expect(decryptSecret(v.valueEnc!)).toBe("tok-1");
    expect(v.description).toBe("novo texto");
  });

  it("copiar para outro ambiente leva as chaves e deixa segredos vazios", async () => {
    const { dev, svc } = await team();
    current = await asCurrent(dev.id);
    await svcActions.saveEnvVar({ ok: false }, form({ serviceId: svc.id, environmentId: "env_hml", key: "LOG_LEVEL", value: "info" }));
    await svcActions.saveEnvVar({ ok: false }, form({ serviceId: svc.id, environmentId: "env_hml", key: "DB_PASSWORD", value: "hml", isSecret: "on" }));
    await svcActions.copyEnvVars({ ok: false }, form({ serviceId: svc.id, fromEnvId: "env_hml", toEnvId: "env_prod" }));
    const prod = await prisma.serviceEnvVar.findMany({ where: { environmentId: "env_prod" }, orderBy: { key: "asc" } });
    expect(prod.map((p) => [p.key, p.value])).toEqual([["DB_PASSWORD", null], ["LOG_LEVEL", "info"]]);
    expect(prod[0]!.valueEnc).toBeNull();
  });
});

describe("matriz de permissões", () => {
  it("OWNER dá docs:edit ao VIEWER e isso passa a valer; permissão administrativa só para ADMIN", async () => {
    const { svc, t } = await team();
    const owner = await makeUser("dona", { role: "OWNER" });
    const leitor = await makeUser("leitor");
    await prisma.teamMember.create({ data: { teamId: t.id, userId: leitor.id } });

    current = await asCurrent(leitor.id);
    await expect(svcActions.saveDoc({ ok: false }, form({ serviceId: svc.id, title: "Regras", content: "# oi" }))).rejects.toThrow("NEXT_NOT_FOUND");

    current = await asCurrent(owner.id);
    const bad = await savePermissions({ ADMIN: ["catalog:read"], MAINTAINER: ["catalog:read"], VIEWER: ["catalog:read", "user:manage"] });
    expect(bad.ok).toBe(false);
    const ok = await savePermissions({ ADMIN: ["catalog:read", "roles:manage"], MAINTAINER: ["catalog:read"], VIEWER: ["catalog:read", "docs:edit"] });
    expect(ok.ok).toBe(true);

    current = await asCurrent(leitor.id);
    expect((await svcActions.saveDoc({ ok: false }, form({ serviceId: svc.id, title: "Regras de negócio", content: "## RN-01" }))).ok).toBe(true);
    expect(await prisma.serviceDoc.findFirstOrThrow()).toMatchObject({ slug: "regras-de-negocio", content: "## RN-01" });
    expect(await prisma.auditLog.count({ where: { action: "roles.updated" } })).toBe(1);
  });
});

describe("aparência", () => {
  it("salva título e tema, e recusa cores ilegíveis", async () => {
    await install();
    current = await asCurrent((await makeUser("adm", { role: "ADMIN" })).id);
    const ruim = await saveAppearance({ appName: "Portal de APIs", themeId: "oceano", palette: { accent: "#f0f0f0", "accent-ink": "#ffffff" } });
    expect(ruim.ok).toBe(false);
    expect(ruim.problems?.join()).toMatch(/botões/);

    const ok = await saveAppearance({ appName: "Portal de APIs", themeId: "oceano", palette: { accent: "#123a6b" } });
    expect(ok.ok).toBe(true);
    expect(await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } })).toMatchObject({ appName: "Portal de APIs", themeId: "oceano", themeOverrides: { accent: "#123a6b" } });
  });

  it("VIEWER não mexe na aparência", async () => {
    await install();
    current = await asCurrent((await makeUser("v")).id);
    await expect(saveAppearance({ appName: "X Y", themeId: "grafite", palette: {} })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("login por e-mail e senha", () => {
  async function authorize(email: string, password: string) {
    const [provider] = buildProviders([{ type: "CREDENTIALS", enabled: true, allowSignup: false } as never]);
    // @ts-expect-error provedor de credenciais expõe authorize nas options
    return provider.options.authorize({ email, password });
  }

  it("convite cria a conta ativa com o papel escolhido; link é de uso único", async () => {
    await install();
    const admin = await makeUser("adm", { role: "ADMIN" });
    const { url } = await createInvite({ email: "nova@parceiro.com", role: "MAINTAINER", kind: "INVITE", createdById: admin.id });
    const token = url.split("/").pop()!;
    expect((await consumeInvite(token, "curta")).ok).toBe(false);
    expect(await consumeInvite(token, "Cavalo-Bateria-2026", "Nova Pessoa")).toEqual({ ok: true });
    expect((await consumeInvite(token, "Grampo-Correto-2027")).ok).toBe(false);
    expect(await prisma.user.findUniqueOrThrow({ where: { email: "nova@parceiro.com" } })).toMatchObject({ status: "ACTIVE", role: "MAINTAINER", accessGrant: "MANUAL_APPROVAL", name: "Nova Pessoa" });
    expect(await prisma.userInvite.count({ where: { tokenHash: token } })).toBe(0); // só o hash é salvo
  });

  it("bloqueia depois de 5 senhas erradas", async () => {
    await install();
    await prisma.user.create({ data: { email: "ana@acme.com", passwordHash: await hashPassword("Senha-Correta-123"), status: "ACTIVE" } });
    for (let i = 0; i < 5; i++) await expect(authorize("ana@acme.com", "errada")).rejects.toThrow();
    await expect(authorize("ana@acme.com", "Senha-Correta-123")).rejects.toMatchObject({ code: "locked" });
    expect(await prisma.auditLog.count({ where: { action: "auth.locked" } })).toBe(1);
  });

  it("senha certa entra; conta suspensa não", async () => {
    await install();
    const u = await prisma.user.create({ data: { email: "bia@acme.com", passwordHash: await hashPassword("Senha-Correta-123"), status: "ACTIVE" } });
    expect(await authorize("BIA@acme.com", "Senha-Correta-123")).toMatchObject({ id: u.id });
    await prisma.user.update({ where: { id: u.id }, data: { status: "SUSPENDED" } });
    await expect(authorize("bia@acme.com", "Senha-Correta-123")).rejects.toMatchObject({ code: "suspended" });
  });

  it("cadastro aberto vira pedido pendente e não revela e-mail existente", async () => {
    await install();
    await prisma.authProvider.create({ data: { type: "CREDENTIALS", allowSignup: true } });
    expect(await signup({ name: "Caio", email: "caio@fora.com", password: "Tigre-Azul-Voando-1", reason: "Integração do parceiro" })).toEqual({ ok: true });
    expect(await signup({ name: "Caio 2", email: "caio@fora.com", password: "Tigre-Azul-Voando-2", reason: "Outra tentativa aqui" })).toEqual({ ok: true });
    expect(await prisma.user.count({ where: { email: "caio@fora.com" } })).toBe(1);
    expect(await prisma.accessRequest.findFirstOrThrow()).toMatchObject({ status: "PENDING", reason: "Integração do parceiro" });
  });
});

describe("origem da spec", () => {
  it("importação manual publica no ambiente escolhido", async () => {
    const { dev, svc } = await team();
    current = await asCurrent(dev.id);
    const r = await svcActions.uploadSpec({ ok: false }, form({ serviceId: svc.id, environmentId: "env_hml", content: '{"openapi":"3.1.0","info":{"title":"Cobrança","version":"0.9.0"},"paths":{}}' }));
    expect(r).toMatchObject({ ok: true });
    expect(await prisma.apiSpec.findFirstOrThrow()).toMatchObject({ environmentId: "env_hml", version: "0.9.0", source: "MANUAL_UPLOAD", isLatest: true });
  });

  it("leitura por URL recusa metadados de nuvem e loopback", async () => {
    await expect(safeFetchText("http://169.254.169.254/latest/meta-data")).rejects.toThrow(/link-local/);
    await expect(safeFetchText("http://localhost:3000/x")).rejects.toThrow(/localhost/);
    await expect(safeFetchText("file:///etc/passwd")).rejects.toThrow(/http/);
  });
});
