import { describe, expect, it } from "vitest";
import { prisma } from "@api-hub/db";
import { generateServiceToken } from "@api-hub/core";
import { POST } from "@/app/api/v1/specs/route";
import { install, makeUser } from "./helpers";

const spec = (version: string, extra = "") => `openapi: 3.1.0\ninfo: { title: Pedidos, version: ${version} }\npaths: {}\n${extra}`;

async function setup() {
  await install();
  const owner = await makeUser("dono", { role: "OWNER" });
  const svc = await prisma.service.create({ data: { slug: "pedidos", name: "Pedidos" } });
  const t = generateServiceToken();
  const tok = await prisma.serviceToken.create({ data: { serviceId: svc.id, name: "ci", prefix: t.prefix, hash: t.hash, createdById: owner.id } });
  return { svc, token: t.token, tokenId: tok.id };
}

function publish(token: string, body: string, type = "application/yaml", query = "commitSha=abc1234&branch=main") {
  return POST(new Request(`http://hub.test/api/v1/specs?${query}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": type },
    body,
  }));
}

describe("publicação de spec pelo CI", () => {
  it("publica, ignora repetição e troca a versão atual", async () => {
    const { svc, token, tokenId } = await setup();

    const r1 = await publish(token, spec("1.0.0"));
    expect(r1.status).toBe(201);
    expect(await r1.json()).toMatchObject({ status: "published", version: "1.0.0" });

    const r2 = await publish(token, spec("1.0.0"));
    expect(await r2.json()).toMatchObject({ status: "unchanged" });

    await publish(token, spec("1.1.0"));
    const specs = await prisma.apiSpec.findMany({ where: { serviceId: svc.id }, orderBy: { createdAt: "asc" } });
    expect(specs.map((s) => [s.version, s.isLatest])).toEqual([["1.0.0", false], ["1.1.0", true]]);
    expect(specs[1]).toMatchObject({ commitSha: "abc1234", branch: "main", source: "CI_PUSH", environmentId: "env_prod" });
    expect((await prisma.serviceToken.findUniqueOrThrow({ where: { id: tokenId } })).lastUsedAt).not.toBeNull();
  });

  it("aceita JSON e cria dependências declaradas em x-api-hub", async () => {
    const { svc, token } = await setup();
    const estoque = await prisma.service.create({ data: { slug: "estoque", name: "Estoque" } });

    const res = await publish(token, JSON.stringify({
      spec: { openapi: "3.0.3", info: { title: "Pedidos", version: "2.0.0" }, paths: {}, "x-api-hub": { dependsOn: ["estoque", "fantasma"] } },
    }), "application/json");

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ unknownDependencies: ["fantasma"] });
    const dep = await prisma.serviceDependency.findFirstOrThrow({ where: { fromServiceId: svc.id } });
    expect(dep).toMatchObject({ toServiceId: estoque.id, kind: "CONSUMES", detected: true });
  });

  it("recusa token inválido, revogado ou de serviço arquivado", async () => {
    const { svc, token, tokenId } = await setup();
    expect((await publish("ahub_inexistente", spec("1.0.0"))).status).toBe(401);
    expect((await publish("sem-prefixo", spec("1.0.0"))).status).toBe(401);

    await prisma.service.update({ where: { id: svc.id }, data: { archivedAt: new Date() } });
    expect((await publish(token, spec("1.0.0"))).status).toBe(401);

    await prisma.service.update({ where: { id: svc.id }, data: { archivedAt: null } });
    await prisma.serviceToken.update({ where: { id: tokenId }, data: { revokedAt: new Date() } });
    expect((await publish(token, spec("1.0.0"))).status).toBe(401);
  });

  it("explica por que a spec é inválida", async () => {
    const { token } = await setup();
    const res = await publish(token, "info: { title: x }");
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/openapi/);
    expect(await prisma.apiSpec.count()).toBe(0);
  });

  it("escolhe o ambiente pela branch; cada ambiente tem sua versão atual", async () => {
    const { svc, token } = await setup();
    expect(await (await publish(token, spec("2.0.0"), "application/yaml", "branch=main")).json()).toMatchObject({ environment: "prod" });
    expect(await (await publish(token, spec("2.1.0-rc.1"), "application/yaml", "branch=release/2.1")).json()).toMatchObject({ environment: "hml" });
    expect(await (await publish(token, spec("2.1.0-dev.4"), "application/yaml", "branch=feature/pix/qr")).json()).toMatchObject({ environment: "dev" });
    // A mesma spec em outro ambiente é uma publicação nova, não "unchanged".
    expect(await (await publish(token, spec("2.0.0"), "application/yaml", "environment=hml")).json()).toMatchObject({ status: "published", environment: "hml" });

    const latest = await prisma.apiSpec.findMany({ where: { serviceId: svc.id, isLatest: true }, include: { environment: true } });
    expect(Object.fromEntries(latest.map((l) => [l.environment.slug, l.version]))).toEqual({ prod: "2.0.0", hml: "2.0.0", dev: "2.1.0-dev.4" });
  });

  it("branch sem ambiente é recusada com a lista de regras", async () => {
    const { token } = await setup();
    const res = await publish(token, spec("1.0.0"), "application/yaml", "branch=experimento");
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/experimento/);
    expect(body.environments).toHaveLength(3);
  });
});
