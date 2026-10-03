/**
 * Dados de demonstração para explorar o hub localmente.
 *
 *   pnpm demo:seed                 → popula um hub já instalado e vazio
 *   pnpm demo:seed --me seu-login  → também coloca você (usuário do GitHub ou e-mail) como líder do time Pagamentos
 *
 * Nunca roda com NODE_ENV=production, e recusa se já existirem serviços cadastrados.
 * As pessoas criadas não têm senha nem conta vinculada: não conseguem entrar.
 * Precisa de ENCRYPTION_KEY (os segredos de exemplo são cifrados como os reais).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { encryptSecret, generateServiceToken, parseSpec } from "@api-hub/core";
import { prisma, type LinkKind } from "../src/index";

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const days = (n: number) => new Date(Date.now() - n * 86_400_000);

function avatar(name: string, hue: number) {
  const initials = name.split(/[\s-]/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 35% 38%)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="26" fill="#fff">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Não rode dados de demonstração em produção.");
  const inst = await prisma.installation.findUnique({ where: { id: "singleton" } });
  if (!inst?.installed) throw new Error("Conclua a instalação pelo assistente antes de popular a demonstração.");
  if ((await prisma.service.count()) > 0) throw new Error("Já existem serviços cadastrados. A demonstração só roda num hub vazio.");

  // Pessoas
  const people = [
    { login: "rafael-souza", name: "Rafael Souza", role: "ADMIN", hue: 200 },
    { login: "joana-lima", name: "Joana Lima", role: "MAINTAINER", hue: 150 },
    { login: "pedro-alves", name: "Pedro Alves", role: "MAINTAINER", hue: 30 },
    { login: "lucas-melo", name: "Lucas Melo", role: "VIEWER", hue: 280 },
    { login: "carla-nunes", name: "Carla Nunes", role: "VIEWER", hue: 340 },
  ] as const;
  const u: Record<string, string> = {};
  for (const p of people) {
    const user = await prisma.user.create({
      data: { githubLogin: p.login, email: `${p.login.replace("-", ".")}@acme.com.br`, name: p.name, image: avatar(p.name, p.hue), role: p.role, status: "ACTIVE", accessGrant: "ORG_MEMBERSHIP", isOrgMember: true, lastSeenAt: days(Math.random() * 5) },
    });
    u[p.login] = user.id;
  }
  const guest = await prisma.user.create({ data: { githubLogin: "ana-consultoria", name: "Ana Prado", image: avatar("Ana Prado", 60), status: "PENDING" } });
  await prisma.accessRequest.create({
    data: { userId: guest.id, reason: "Sou da consultoria que está integrando o app parceiro com a API de Pedidos. Preciso de acesso até dezembro.", expiresAt: new Date(Date.now() + 12 * 86_400_000), createdAt: days(2) },
  });
  const newbie = await prisma.user.create({ data: { githubLogin: "bruno-estagio", name: "Bruno Rocha", image: avatar("Bruno Rocha", 100), status: "PENDING", isOrgMember: true } });
  await prisma.accessRequest.create({ data: { userId: newbie.id, isOrgMember: true, expiresAt: new Date(Date.now() + 13 * 86_400_000), createdAt: days(1) } });

  // Times
  const team = async (slug: string, name: string, description: string, members: [string, "LEAD" | "MEMBER"][]) =>
    prisma.team.create({ data: { slug, name, description, members: { create: members.map(([id, role]) => ({ userId: id, role })) } } });
  const meId = arg("me")?.toLowerCase().replace(/^@/, "");
  const me = meId ? await prisma.user.findFirst({ where: { OR: [{ githubLogin: meId }, { email: meId }] } }) : null;
  const tPag = await team("pagamentos", "Pagamentos", "Checkout, cobrança e pedidos", [[u["joana-lima"]!, "LEAD"], [u["lucas-melo"]!, "MEMBER"], ...(me ? [[me.id, "LEAD"] as [string, "LEAD"]] : [])]);
  const tLog = await team("logistica", "Logística", "Estoque, frete e entrega", [[u["pedro-alves"]!, "LEAD"], [u["carla-nunes"]!, "MEMBER"]]);
  const tPla = await team("plataforma", "Plataforma", "Infraestrutura e serviços compartilhados", [[u["rafael-souza"]!, "LEAD"]]);

  // Serviços
  const svc = async (slug: string, name: string, description: string, ownerTeamId: string, tags: string[], lifecycle = "production") =>
    prisma.service.create({ data: { slug, name, description, ownerTeamId, tags, lifecycle, createdAt: days(40) } });
  const s = {
    pedidos: await svc("pedidos", "Pedidos", "Criação e acompanhamento de pedidos do checkout.", tPag.id, ["checkout", "core"]),
    pagamentos: await svc("pagamentos", "Pagamentos", "Cobranças por cartão e Pix, estornos e webhooks.", tPag.id, ["checkout", "financeiro"]),
    estoque: await svc("estoque", "Estoque", "Saldo por centro de distribuição e reservas.", tLog.id, ["logistica", "core"]),
    frete: await svc("frete", "Frete (legado)", "Cotação de frete. Será substituído pelo novo motor de entregas.", tLog.id, ["logistica"], "deprecated"),
    notificacoes: await svc("notificacoes", "Notificações", "E-mail, SMS e push para clientes.", tPla.id, ["plataforma"]),
  };

  // Repositórios
  const org = inst.allowedGithubOrgs[0] ?? "acme";
  const repo = (name: string, description: string) =>
    prisma.repository.create({ data: { fullName: `${org}/${name}`, url: `https://github.com/${org}/${name}`, description } });
  const r = {
    pedidos: await repo("pedidos-api", "API de pedidos"),
    pagamentos: await repo("pagamentos-api", "API de pagamentos"),
    estoque: await repo("estoque-api", "API de estoque"),
    notificacoes: await repo("notificacoes-worker", "Worker de notificações"),
    sdk: await repo("sdk-js", "SDK JavaScript dos serviços de checkout"),
    infra: await repo("infra-terraform", "Infraestrutura como código"),
  };
  await prisma.serviceRepository.createMany({
    data: [
      { serviceId: s.pedidos.id, repositoryId: r.pedidos.id, role: "SOURCE" },
      { serviceId: s.pedidos.id, repositoryId: r.sdk.id, role: "CLIENT_SDK" },
      { serviceId: s.pagamentos.id, repositoryId: r.pagamentos.id, role: "SOURCE" },
      { serviceId: s.pagamentos.id, repositoryId: r.sdk.id, role: "CLIENT_SDK" },
      { serviceId: s.estoque.id, repositoryId: r.estoque.id, role: "SOURCE" },
      { serviceId: s.notificacoes.id, repositoryId: r.notificacoes.id, role: "SOURCE" },
      { serviceId: s.notificacoes.id, repositoryId: r.infra.id, role: "INFRA" },
    ],
  });
  const repoLinks: [string, string, LinkKind][] = [
    [r.pedidos.id, r.sdk.id, "SHARES_LIBRARY"],
    [r.pagamentos.id, r.sdk.id, "SHARES_LIBRARY"],
    [r.estoque.id, r.infra.id, "DEPENDS_ON"],
  ];
  await prisma.repositoryLink.createMany({ data: repoLinks.map(([fromRepoId, toRepoId, kind]) => ({ fromRepoId, toRepoId, kind })) });
  await prisma.serviceDependency.create({ data: { fromServiceId: s.pedidos.id, toServiceId: s.notificacoes.id, kind: "PUBLISHES_TO", note: "Evento pedido.criado" } });

  // Ambientes: usa os configurados na instalação (padrão dev, hml, prod).
  const envs = await prisma.environment.findMany({ orderBy: { position: "asc" } });
  if (envs.length === 0) throw new Error("Nenhum ambiente configurado.");
  const envBy = (slug: string) => envs.find((e) => e.slug === slug) ?? envs[envs.length - 1]!;
  const prod = envs.find((e) => e.isProduction) ?? envs[envs.length - 1]!;

  // Specs: versões diferentes por ambiente mostram o que já foi promovido.
  const dir = path.join(__dirname, "demo-specs");
  const publish = async (serviceId: string, file: string, envSlug: string, createdAt: Date, version?: string) => {
    const env = envBy(envSlug);
    let raw = readFileSync(path.join(dir, file), "utf8");
    // Troca a versão em info (bloco "version: x" ou fluxo "{ ..., version: x }").
    if (version) raw = raw.replace(/((?:^|[{,])\s*version:\s*)[^\s,}]+/m, `$1${version}`);
    const spec = parseSpec(raw);
    await prisma.apiSpec.updateMany({ where: { serviceId, environmentId: env.id, isLatest: true }, data: { isLatest: false } });
    await prisma.apiSpec.create({
      data: {
        serviceId, environmentId: env.id, version: spec.version, format: spec.format, title: spec.title, content: spec.normalized, checksum: spec.checksum,
        sizeBytes: spec.sizeBytes, source: "CI_PUSH", branch: env.syncBranch ?? env.branchPatterns[0], commitSha: Math.random().toString(16).slice(2, 9), createdAt,
      },
    });
    for (const dep of spec.declaredDependencies) {
      const target = await prisma.service.findUnique({ where: { slug: dep } });
      if (target) {
        await prisma.serviceDependency.upsert({
          where: { fromServiceId_toServiceId_kind: { fromServiceId: serviceId, toServiceId: target.id, kind: "CONSUMES" } },
          create: { fromServiceId: serviceId, toServiceId: target.id, kind: "CONSUMES", detected: true },
          update: {},
        });
      }
    }
  };
  await publish(s.pedidos.id, "pedidos.yaml", "prod", days(20), "2.3.1");
  await publish(s.pedidos.id, "pedidos.yaml", "prod", days(3), "2.4.0");
  await publish(s.pedidos.id, "pedidos.yaml", "hml", days(2), "2.5.0-rc.1");
  await publish(s.pedidos.id, "pedidos.yaml", "dev", days(0.2), "2.5.0-dev.14");
  await publish(s.pagamentos.id, "pagamentos.yaml", "prod", days(6));
  await publish(s.pagamentos.id, "pagamentos.yaml", "hml", days(1), "1.8.0-rc.2");
  await publish(s.estoque.id, "estoque.yaml", "prod", days(9));
  await publish(s.estoque.id, "estoque.yaml", "dev", days(1), "3.1.0-dev.3");
  await publish(s.notificacoes.id, "notificacoes.yaml", "prod", days(15));
  await publish(s.frete.id, "frete.yaml", "prod", days(120));

  // Origens diferentes: estoque lido do repositório, notificações por URL.
  await prisma.service.update({ where: { id: s.estoque.id }, data: { specSource: "REPO_FILE", specRepositoryId: r.estoque.id, specPath: "docs/openapi.yaml", lastSyncAt: days(0.1) } });
  await prisma.service.update({ where: { id: s.notificacoes.id }, data: { specSource: "URL_PULL", pullUrl: "https://notificacoes.{env}.acme.internal/openapi.json", lastSyncAt: days(0.1) } });

  // Integrações externas, com endereço por ambiente.
  const ep = (values: Record<string, string>) => ({ create: Object.entries(values).map(([slug, value]) => ({ environmentId: envBy(slug).id, value })) });
  const x = {
    fila: await prisma.externalResource.create({ data: { slug: "pedidos-criados", name: "Fila pedidos-criados", kind: "QUEUE", provider: "AWS SQS",
      description: "Recebe um evento por pedido confirmado.\n\n```json\n{ \"pedidoId\": \"ped_123\", \"clienteId\": \"cli_9\", \"total\": 189.9 }\n```\n\n- Retenção de **4 dias**\n- Dead-letter depois de **5** tentativas: `pedidos-criados-dlq`",
      endpoints: ep({ dev: "https://sqs.sa-east-1.amazonaws.com/111111111111/dev-pedidos-criados", hml: "https://sqs.sa-east-1.amazonaws.com/222222222222/hml-pedidos-criados", prod: "https://sqs.sa-east-1.amazonaws.com/333333333333/pedidos-criados" }) } }),
    stripe: await prisma.externalResource.create({ data: { slug: "stripe", name: "Stripe", kind: "HTTP_API", provider: "Stripe", docsUrl: "https://docs.stripe.com/api",
      description: "Cartão de crédito. Conta **acme-br**. Limite de 100 req/s em produção.", endpoints: ep({ dev: "https://api.stripe.com (modo teste)", hml: "https://api.stripe.com (modo teste)", prod: "https://api.stripe.com" }) } }),
    pix: await prisma.externalResource.create({ data: { slug: "banco-pix", name: "API Pix do banco", kind: "HTTP_API", provider: "Banco parceiro",
      description: "Cobrança Pix com vencimento. Exige certificado mTLS (fica no cofre, não aqui).", endpoints: ep({ dev: "https://pix-sandbox.banco.com.br", hml: "https://pix-sandbox.banco.com.br", prod: "https://pix.banco.com.br" }) } }),
    webhook: await prisma.externalResource.create({ data: { slug: "webhook-parceiro", name: "Webhook do app parceiro", kind: "WEBHOOK", provider: "Parceiro XPTO",
      description: "Avisamos o parceiro quando o status do pedido muda. Assinatura HMAC no cabeçalho `X-Assinatura`.", endpoints: ep({ hml: "https://hml.parceiro.com/webhooks/acme", prod: "https://parceiro.com/webhooks/acme" }) } }),
    db: await prisma.externalResource.create({ data: { slug: "postgres-checkout", name: "PostgreSQL checkout", kind: "DATABASE", provider: "AWS RDS",
      endpoints: ep({ dev: "checkout-dev.cluster-xyz.sa-east-1.rds.amazonaws.com:5432", hml: "checkout-hml.cluster-xyz.sa-east-1.rds.amazonaws.com:5432", prod: "checkout.cluster-xyz.sa-east-1.rds.amazonaws.com:5432" }) } }),
    redis: await prisma.externalResource.create({ data: { slug: "redis-estoque", name: "Redis de reservas", kind: "CACHE", provider: "ElastiCache",
      endpoints: ep({ dev: "redis-dev.acme.internal:6379", prod: "reservas.xyz.cache.amazonaws.com:6379" }) } }),
    sendgrid: await prisma.externalResource.create({ data: { slug: "sendgrid", name: "SendGrid", kind: "EMAIL_SMS", provider: "Twilio SendGrid", docsUrl: "https://www.twilio.com/docs/sendgrid",
      endpoints: ep({ dev: "https://api.sendgrid.com (sandbox)", prod: "https://api.sendgrid.com" }) } }),
  };
  await prisma.serviceResource.createMany({
    data: [
      { serviceId: s.pedidos.id, resourceId: x.fila.id, relation: "PUBLISHES", note: "Publica depois que o pagamento é **aprovado**." },
      { serviceId: s.notificacoes.id, resourceId: x.fila.id, relation: "SUBSCRIBES", note: "Envia o e-mail de confirmação." },
      { serviceId: s.estoque.id, resourceId: x.fila.id, relation: "SUBSCRIBES", note: "Baixa a reserva e confirma a saída." },
      { serviceId: s.pagamentos.id, resourceId: x.stripe.id, relation: "CONSUMES" },
      { serviceId: s.pagamentos.id, resourceId: x.pix.id, relation: "CONSUMES" },
      { serviceId: s.pedidos.id, resourceId: x.webhook.id, relation: "SENDS_WEBHOOK", note: "Só para pedidos com `canal = parceiro`." },
      { serviceId: s.pedidos.id, resourceId: x.db.id, relation: "WRITES" },
      { serviceId: s.pagamentos.id, resourceId: x.db.id, relation: "WRITES" },
      { serviceId: s.estoque.id, resourceId: x.redis.id, relation: "WRITES" },
      { serviceId: s.notificacoes.id, resourceId: x.sendgrid.id, relation: "CONSUMES" },
    ],
  });

  // Variáveis de ambiente (segredos cifrados).
  const vars = async (serviceId: string, envSlug: string, list: [string, string, boolean, string?][]) =>
    prisma.serviceEnvVar.createMany({
      data: list.map(([key, value, secret, description]) => ({
        serviceId, environmentId: envBy(envSlug).id, key, isSecret: secret, description,
        value: secret ? null : value, valueEnc: secret ? encryptSecret(value) : null, updatedById: u["joana-lima"],
      })),
    });
  for (const [env, host, level] of [["dev", "dev", "debug"], ["hml", "hml", "info"], ["prod", "", "warn"]] as const) {
    const suffix = host ? `-${host}` : "";
    await vars(s.pedidos.id, env, [
      ["LOG_LEVEL", level, false, "`debug`, `info`, `warn` ou `error`."],
      ["PORT", "8080", false],
      ["DATABASE_URL", `postgresql://pedidos:${env}-s3nh4@checkout${suffix}.cluster-xyz.sa-east-1.rds.amazonaws.com:5432/pedidos`, true, "Conexão com o PostgreSQL do checkout."],
      ["SQS_PEDIDOS_CRIADOS_URL", `https://sqs.sa-east-1.amazonaws.com/${env === "prod" ? "333333333333" : env === "hml" ? "222222222222" : "111111111111"}/${host ? `${host}-` : ""}pedidos-criados`, false],
      ["PAGAMENTOS_BASE_URL", `https://pagamentos${host ? `.${host}` : ""}.acme.internal`, false],
      ["PARCEIRO_WEBHOOK_SECRET", `whsec_${env}_${Math.random().toString(36).slice(2, 14)}`, true, "Chave HMAC do webhook do parceiro."],
      ["FEATURE_CUPOM_V2", env === "prod" ? "false" : "true", false, "Novo motor de cupons."],
    ]);
  }
  await vars(s.pagamentos.id, "prod", [
    ["STRIPE_API_KEY", "sk_live_51H" + "x".repeat(20), true, "Chave secreta da conta **acme-br**."],
    ["PIX_CLIENT_ID", "acme-pix-prd", false],
    ["PIX_CLIENT_SECRET", "pix_" + Math.random().toString(36).slice(2), true],
    ["ESTORNO_LIMITE_DIAS", "90", false, "Depois disso, estorno só manual."],
  ]);

  // Regras de negócio em Markdown.
  await prisma.serviceDoc.create({ data: { serviceId: s.pedidos.id, slug: "regras-de-negocio", title: "Regras de negócio", position: 0, updatedById: u["joana-lima"], content: `## Como funciona

O checkout cria o pedido com status \`AGUARDANDO_PAGAMENTO\`. Quando **Pagamentos** confirma, o pedido vira \`CONFIRMADO\`
e um evento é publicado na fila **pedidos-criados**, que dispara a baixa de estoque e o e-mail ao cliente.

## Regras

| Código | Regra |
|---|---|
| RN-01 | Um pedido tem no máximo **50 itens** e valor mínimo de **R$ 10,00**. |
| RN-02 | Sem pagamento em **30 minutos**, o pedido é cancelado e a reserva de estoque é liberada. |
| RN-03 | Cupom só vale para o CPF que o resgatou; um cupom por pedido. |
| RN-04 | Cancelamento pelo cliente só até o status \`SEPARANDO\`. Depois, vira devolução. |
| RN-05 | Pedido de parceiro (\`canal = parceiro\`) avisa o parceiro por webhook a cada mudança de status. |

## Estados

\`\`\`
AGUARDANDO_PAGAMENTO → CONFIRMADO → SEPARANDO → ENVIADO → ENTREGUE
          ↓                 ↓
      CANCELADO          CANCELADO (com estorno)
\`\`\`

## Pontos de atenção

> O evento \`pedido.criado\` pode chegar **duplicado**. Quem consome precisa ser idempotente pelo \`pedidoId\`.

- O total é recalculado no servidor; o valor enviado pelo front é ignorado.
- Em produção, \`FEATURE_CUPOM_V2\` segue desligada até a migração dos cupons antigos.
- [ ] Remover o endpoint \`/v1/pedidos/legado\` depois de janeiro.
` } });
  await prisma.serviceDoc.create({ data: { serviceId: s.pedidos.id, slug: "glossario", title: "Glossário", position: 1, updatedById: u["joana-lima"], content: `## Termos

- **Pedido**: intenção de compra com itens, endereço e forma de pagamento.
- **Reserva**: bloqueio temporário de saldo no estoque, criado junto com o pedido.
- **Canal**: origem do pedido (\`site\`, \`app\`, \`parceiro\`).
` } });
  await prisma.serviceDoc.create({ data: { serviceId: s.pagamentos.id, slug: "regras-de-negocio", title: "Regras de negócio", position: 0, updatedById: u["joana-lima"], content: `## Como funciona

Cartão passa pela **Stripe**; Pix usa a API do banco parceiro com cobrança de vencimento de 30 minutos.

## Regras

- **RN-10** — Estorno total ou parcial até **90 dias** após a captura (\`ESTORNO_LIMITE_DIAS\`).
- **RN-11** — Parcelamento em até 12x; acima de 6x só para pedidos a partir de R$ 600.
- **RN-12** — Três recusas seguidas do mesmo cartão bloqueiam novas tentativas por 1 hora.

## Pontos de atenção

> Webhooks da Stripe podem chegar fora de ordem. Sempre compare o \`created\` do evento com o último processado.
` } });

  // Integração de repositório de exemplo (sem token: só para a tela).
  await prisma.sourceIntegration.upsert({ where: { type: "GITHUB" }, create: { type: "GITHUB" }, update: {} });

  // Tokens e auditoria
  for (const [serviceId, by] of [[s.pedidos.id, u["joana-lima"]!], [s.estoque.id, u["pedro-alves"]!]] as const) {
    const t = generateServiceToken();
    await prisma.serviceToken.create({ data: { serviceId, name: "github-actions", prefix: t.prefix, hash: t.hash, createdById: by, expiresAt: new Date(Date.now() + 80 * 86_400_000), lastUsedAt: days(3) } });
  }
  const log = (action: string, actorId: string | null, when: number, extra: object = {}) =>
    prisma.auditLog.create({ data: { action, actorId, createdAt: days(when), ip: actorId ? "10.20.1.14" : null, ...extra } });
  await log("team.created", u["rafael-souza"]!, 40, { targetType: "team", targetId: tPag.id });
  await log("service.created", u["joana-lima"]!, 40, { targetType: "service", targetId: s.pedidos.id });
  await log("token.created", u["joana-lima"]!, 39, { targetType: "service", targetId: s.pedidos.id, metadata: { prefix: "ahub_Xk2p9Q" } });
  await log("link.created", u["pedro-alves"]!, 30, { metadata: { type: "repository", kind: "DEPENDS_ON" } });
  await log("access.approved", u["rafael-souza"]!, 10, { targetType: "user", targetId: u["carla-nunes"], metadata: { role: "VIEWER", expiresInDays: 0 } });
  await log("spec.published", null, 3, { targetType: "service", targetId: s.pedidos.id, metadata: { version: "2.4.0", env: prod.slug, token: "ahub_Xk2p9Q" } });
  await log("envvar.revealed", u["joana-lima"]!, 2, { targetType: "service", targetId: s.pedidos.id, metadata: { key: "DATABASE_URL", env: "hml" } });
  await log("access.requested", guest.id, 2, { targetType: "user", targetId: guest.id });
  await log("service.updated", u["pedro-alves"]!, 1, { targetType: "service", targetId: s.frete.id, metadata: { lifecycle: { from: "production", to: "deprecated" } } });

  console.log("Demonstração criada: 5 serviços, 7 integrações externas, specs em vários ambientes, variáveis, regras de negócio, 3 times e 7 pessoas.");
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => prisma.$disconnect());
