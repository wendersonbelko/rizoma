/**
 * Completa um hub já instalado sem apagar o que existe.
 *
 *   pnpm demo:fill
 *
 * Cria o que falta (pessoa, time, serviço, integração) e não reescreve descrição
 * de serviço nem senha de quem não está na lista. Recusa NODE_ENV=production.
 *
 * O hub desta instalação já nomeia times `time-de-*` e APIs `*-api`. O script
 * procura esses slugs antes de criar `pedidos` ou `plataforma`, para não duplicar
 * o catálogo da tela.
 *
 * A senha de demonstração contém a palavra "senha" e a RN-104 a recusaria num
 * formulário. O hash é gravado direto para o login por e-mail funcionar.
 */
import { hashPassword } from "@api-hub/core";
import { prisma } from "../src/index";

const DEMO_PASSWORD = "Senha@Segura10";

type HubRole = "ADMIN" | "MAINTAINER" | "VIEWER";
type Seat = "LEAD" | "MEMBER";

type Person = { email: string; name: string; role: HubRole; team: string; seat: Seat };
type TeamSpec = { slug: string; name: string; description: string; aliases: string[] };
type ServiceSpec = {
  slug: string;
  aliases: string[];
  name: string;
  description: string;
  kind: "API" | "FRONTEND" | "WORKER";
  team: string;
  tags: string[];
};

const TEAMS: TeamSpec[] = [
  { slug: "plataforma", name: "Plataforma", description: "Infraestrutura, usuários e serviços compartilhados.", aliases: ["time-de-plataforma", "plataforma"] },
  { slug: "pedidos", name: "Pedidos", description: "Checkout e ciclo de vida do pedido.", aliases: ["time-de-pedidos", "pedidos"] },
  { slug: "pagamentos", name: "Pagamentos", description: "Cobrança, cartão e Pix.", aliases: ["time-de-pagamentos", "pagamentos"] },
  { slug: "logistica", name: "Logística", description: "Estoque, frete e entrega.", aliases: ["time-de-logistica", "logistica"] },
  { slug: "catalogo", name: "Catálogo", description: "Produtos exibidos na loja.", aliases: ["time-de-catalogo", "catalogo"] },
  { slug: "usuarios", name: "Usuários", description: "Cadastro, autenticação e perfis.", aliases: ["time-de-usuarios", "usuarios"] },
];

const PEOPLE: Person[] = [
  { email: "marina.costa@belko.com.br", name: "Marina Costa", role: "ADMIN", team: "plataforma", seat: "LEAD" },
  { email: "ricardo.mendes@belko.com.br", name: "Ricardo Mendes", role: "ADMIN", team: "plataforma", seat: "MEMBER" },
  { email: "helena.duarte@belko.com.br", name: "Helena Duarte", role: "MAINTAINER", team: "pedidos", seat: "LEAD" },
  { email: "tiago.ferreira@belko.com.br", name: "Tiago Ferreira", role: "MAINTAINER", team: "pedidos", seat: "MEMBER" },
  { email: "sofia.almeida@belko.com.br", name: "Sofia Almeida", role: "MAINTAINER", team: "pedidos", seat: "LEAD" },
  { email: "bianca.oliveira@belko.com.br", name: "Bianca Oliveira", role: "MAINTAINER", team: "pagamentos", seat: "LEAD" },
  { email: "andre.barbosa@belko.com.br", name: "André Barbosa", role: "MAINTAINER", team: "pagamentos", seat: "MEMBER" },
  { email: "juliana.pires@belko.com.br", name: "Juliana Pires", role: "VIEWER", team: "pagamentos", seat: "MEMBER" },
  { email: "camila.rocha@belko.com.br", name: "Camila Rocha", role: "MAINTAINER", team: "logistica", seat: "LEAD" },
  { email: "felipe.nogueira@belko.com.br", name: "Felipe Nogueira", role: "MAINTAINER", team: "logistica", seat: "MEMBER" },
  { email: "larissa.pinto@belko.com.br", name: "Larissa Pinto", role: "MAINTAINER", team: "logistica", seat: "MEMBER" },
  { email: "diego.martins@belko.com.br", name: "Diego Martins", role: "MAINTAINER", team: "catalogo", seat: "LEAD" },
  { email: "patricia.gomes@belko.com.br", name: "Patrícia Gomes", role: "MAINTAINER", team: "catalogo", seat: "MEMBER" },
  { email: "renato.vieira@belko.com.br", name: "Renato Vieira", role: "MAINTAINER", team: "usuarios", seat: "LEAD" },
  { email: "gustavo.teixeira@belko.com.br", name: "Gustavo Teixeira", role: "MAINTAINER", team: "plataforma", seat: "MEMBER" },
  { email: "aline.cardoso@belko.com.br", name: "Aline Cardoso", role: "VIEWER", team: "pedidos", seat: "MEMBER" },
  { email: "marcos.lima@belko.com.br", name: "Marcos Lima", role: "VIEWER", team: "plataforma", seat: "MEMBER" },
];

const APIS: ServiceSpec[] = [
  { slug: "pedidos", aliases: ["pedidos-api", "pedidos"], name: "Pedidos API", description: "Criação e acompanhamento de pedidos do checkout.", kind: "API", team: "pedidos", tags: ["pedidos", "core"] },
  { slug: "pagamentos", aliases: ["pagamentos-api", "pagamentos"], name: "Pagamentos API", description: "Cobranças por cartão e Pix.", kind: "API", team: "pagamentos", tags: ["pagamentos"] },
  { slug: "estoque", aliases: ["estoque-api", "estoque"], name: "Estoque API", description: "Saldo e reservas por centro de distribuição.", kind: "API", team: "logistica", tags: ["estoque"] },
  { slug: "entregas", aliases: ["entregas-api", "entregas"], name: "Entregas API", description: "Rastreio e gestão de entregas.", kind: "API", team: "logistica", tags: ["entregas"] },
  { slug: "notificacoes", aliases: ["notificacoes-api", "notificacoes"], name: "Notificações API", description: "E-mail, SMS e push para clientes.", kind: "API", team: "plataforma", tags: ["notificacoes"] },
  { slug: "catalogo", aliases: ["catalogo-api", "catalogo"], name: "Catálogo API", description: "Cadastro e consulta de produtos.", kind: "API", team: "catalogo", tags: ["catalogo"] },
  { slug: "usuarios", aliases: ["usuarios-api", "usuarios"], name: "Usuários API", description: "Cadastro, autenticação e perfis.", kind: "API", team: "plataforma", tags: ["usuarios"] },
];

const SURFACES: ServiceSpec[] = [
  { slug: "loja-web", aliases: ["loja-web"], name: "Loja", description: "Vitrine e checkout no navegador.", kind: "FRONTEND", team: "pedidos", tags: ["loja", "frontend"] },
  { slug: "painel-operacao", aliases: ["painel-operacao"], name: "Painel de operação", description: "Acompanhamento de pedidos, estoque e entregas.", kind: "FRONTEND", team: "logistica", tags: ["operacao", "frontend"] },
  { slug: "app-entregador", aliases: ["app-entregador"], name: "App do entregador", description: "Rotas e confirmação de entrega no celular.", kind: "FRONTEND", team: "logistica", tags: ["entregas", "frontend"] },
  { slug: "worker-notificacoes", aliases: ["worker-notificacoes"], name: "Worker de notificações", description: "Consome a fila de pedidos e dispara o aviso ao cliente.", kind: "WORKER", team: "plataforma", tags: ["notificacoes", "worker"] },
  { slug: "worker-estoque", aliases: ["worker-estoque"], name: "Worker de estoque", description: "Baixa a reserva quando o pedido é confirmado.", kind: "WORKER", team: "logistica", tags: ["estoque", "worker"] },
];

const LOJA_DOC = `## Como a loja usa o restante

O CEP digitado no checkout é consultado na **ViaCEP** e, para a lista de estados, no **IBGE**. Nenhum dos dois pede chave.

Quando o pedido é criado, a loja publica o evento \`pedido.criado\` na fila **RabbitMQ**. O worker de notificações assina essa fila e grava o envio no PostgreSQL da loja.

## Regras

| Código | Regra |
|---|---|
| RN-L01 | CEP inválido não deixa seguir para o frete. |
| RN-L02 | O evento pode chegar duplicado. O worker ignora o \`pedidoId\` que já avisou. |
`;

function internalHost(envSlug: string, name: string) {
  return envSlug === "prod" ? `${name}.belko.internal` : `${name}.${envSlug}.belko.internal`;
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Não rode o preenchimento de demonstração em produção.");
  const inst = await prisma.installation.findUnique({ where: { id: "singleton" } });
  if (!inst?.installed) throw new Error("Conclua a instalação pelo assistente antes de preencher o catálogo.");

  const envs = await prisma.environment.findMany({ orderBy: { position: "asc" } });
  if (envs.length === 0) throw new Error("Nenhum ambiente configurado.");

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const userId = new Map<string, string>();
  for (const person of PEOPLE) {
    const email = person.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.role === "OWNER") {
      userId.set(email, existing.id);
      continue;
    }
    const data = {
      name: person.name,
      role: person.role,
      status: "ACTIVE" as const,
      accessGrant: "MANUAL_APPROVAL" as const,
      accessExpiresAt: null,
      passwordHash,
      failedLogins: 0,
      lockedUntil: null,
      statusReason: null,
      isOrgMember: false,
    };
    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data })
      : await prisma.user.create({ data: { email, ...data } });
    userId.set(email, user.id);
  }

  const teamId = new Map<string, string>();
  for (const spec of TEAMS) {
    let team = null as { id: string } | null;
    for (const slug of spec.aliases) {
      team = await prisma.team.findUnique({ where: { slug }, select: { id: true } });
      if (team) break;
    }
    if (!team) {
      team = await prisma.team.create({ data: { slug: spec.slug, name: spec.name, description: spec.description }, select: { id: true } });
    }
    teamId.set(spec.slug, team.id);
  }

  for (const person of PEOPLE) {
    const id = userId.get(person.email.toLowerCase());
    const team = teamId.get(person.team);
    if (!id || !team) continue;
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team, userId: id } },
      create: { teamId: team, userId: id, role: person.seat },
      update: {},
    });
  }

  const serviceId = new Map<string, string>();
  for (const spec of [...APIS, ...SURFACES]) {
    let service = null as { id: string } | null;
    for (const slug of spec.aliases) {
      service = await prisma.service.findUnique({ where: { slug }, select: { id: true } });
      if (service) break;
    }
    if (!service) {
      service = await prisma.service.create({
        data: {
          slug: spec.slug,
          name: spec.name,
          description: spec.description,
          kind: spec.kind,
          tags: spec.tags,
          lifecycle: "production",
          ownerTeamId: teamId.get(spec.team),
        },
        select: { id: true },
      });
    }
    serviceId.set(spec.slug, service.id);
  }

  const link = async (from: string, to: string, note: string) => {
    const fromServiceId = serviceId.get(from);
    const toServiceId = serviceId.get(to);
    if (!fromServiceId || !toServiceId || fromServiceId === toServiceId) return;
    await prisma.serviceDependency.upsert({
      where: { fromServiceId_toServiceId_kind: { fromServiceId, toServiceId, kind: "CONSUMES" } },
      create: { fromServiceId, toServiceId, kind: "CONSUMES", note },
      update: {},
    });
  };
  await link("loja-web", "catalogo", "Lista os produtos da vitrine.");
  await link("loja-web", "pedidos", "Cria o pedido no checkout.");
  await link("loja-web", "usuarios", "Identifica quem está comprando.");
  await link("painel-operacao", "pedidos", "Fila operacional do dia.");
  await link("painel-operacao", "estoque", "Saldo para separar o pedido.");
  await link("painel-operacao", "entregas", "Status da rota.");
  await link("app-entregador", "entregas", "Confirma a entrega no endereço.");
  await link("worker-notificacoes", "notificacoes", "Dispara o aviso ao cliente.");
  await link("worker-estoque", "estoque", "Baixa a reserva confirmada.");

  for (const spec of SURFACES.filter((s) => s.kind === "FRONTEND")) {
    const id = serviceId.get(spec.slug);
    if (!id) continue;
    const channel = await prisma.serviceChannel.upsert({
      where: { serviceId_protocol_name: { serviceId: id, protocol: "HTTP", name: "site" } },
      create: { serviceId: id, protocol: "HTTP", name: "site" },
      update: {},
    });
    for (const env of envs) {
      const value = `https://${internalHost(env.slug, spec.slug)}`;
      await prisma.channelAddress.upsert({
        where: { channelId_environmentId: { channelId: channel.id, environmentId: env.id } },
        create: { channelId: channel.id, environmentId: env.id, value },
        update: {},
      });
    }
  }

  const endpoint = (pathFor: (envSlug: string) => string) =>
    Object.fromEntries(envs.map((env) => [env.id, pathFor(env.slug)]));

  const resources = {
    viacep: await ensureResource({
      slug: "viacep", name: "ViaCEP", kind: "HTTP_API", provider: "ViaCEP",
      docsUrl: "https://viacep.com.br",
      description: "Consulta de CEP pública, sem chave. A loja usa no checkout.",
      endpoints: endpoint(() => "https://viacep.com.br/ws/{cep}/json/"),
    }),
    brasilapi: await ensureResource({
      slug: "brasilapi", name: "BrasilAPI", kind: "HTTP_API", provider: "BrasilAPI",
      docsUrl: "https://brasilapi.com.br",
      description: "CEP, feriados e bancos. API pública e gratuita.",
      endpoints: endpoint(() => "https://brasilapi.com.br/api"),
    }),
    openMeteo: await ensureResource({
      slug: "open-meteo", name: "Open-Meteo", kind: "HTTP_API", provider: "Open-Meteo",
      docsUrl: "https://open-meteo.com",
      description: "Previsão do tempo sem chave, para a rota de entrega.",
      endpoints: endpoint(() => "https://api.open-meteo.com/v1/forecast"),
    }),
    ibge: await ensureResource({
      slug: "ibge-localidades", name: "IBGE Localidades", kind: "HTTP_API", provider: "IBGE",
      docsUrl: "https://servicodados.ibge.gov.br/api/docs/localidades",
      description: "Estados e municípios oficiais. API pública.",
      endpoints: endpoint(() => "https://servicodados.ibge.gov.br/api/v1/localidades"),
    }),
    rabbit: await ensureResource({
      slug: "pedido-criado", name: "Fila pedido.criado", kind: "QUEUE", provider: "RabbitMQ",
      description: "Um evento por pedido criado. O worker de notificações consome.",
      endpoints: endpoint((slug) => `amqp://${internalHost(slug, "rabbitmq")}:5672/pedido.criado`),
    }),
    postgres: await ensureResource({
      slug: "postgres-loja", name: "PostgreSQL da loja", kind: "DATABASE", provider: "PostgreSQL",
      description: "Banco da loja. O endereço não traz usuário nem senha.",
      endpoints: endpoint((slug) => `${internalHost(slug, "loja-db")}:5432/loja`),
    }),
    redis: await ensureResource({
      slug: "redis-sessoes", name: "Redis de sessão", kind: "CACHE", provider: "Redis",
      description: "Sessão da loja. Sem senha no endereço.",
      endpoints: endpoint((slug) => `${internalHost(slug, "sessoes")}:6379`),
    }),
  };

  const bind = async (service: string, resourceId: string, relation: "CONSUMES" | "PUBLISHES" | "SUBSCRIBES" | "READS" | "WRITES", note?: string) => {
    const id = serviceId.get(service);
    if (!id) return;
    await prisma.serviceResource.upsert({
      where: { serviceId_resourceId_relation: { serviceId: id, resourceId, relation } },
      create: { serviceId: id, resourceId, relation, note },
      update: {},
    });
  };
  await bind("loja-web", resources.viacep, "CONSUMES", "CEP do endereço de entrega.");
  await bind("loja-web", resources.brasilapi, "CONSUMES", "Feriados e CEP de reserva.");
  await bind("loja-web", resources.ibge, "CONSUMES", "Lista de estados e municípios.");
  await bind("entregas", resources.openMeteo, "CONSUMES", "Previsão na rota do dia.");
  await bind("loja-web", resources.rabbit, "PUBLISHES", "Publica quando o checkout confirma o pedido.");
  await bind("pedidos", resources.rabbit, "PUBLISHES", "O mesmo evento sai da API de pedidos.");
  await bind("worker-notificacoes", resources.rabbit, "SUBSCRIBES", "Envia o aviso e marca o pedido como notificado.");
  await bind("worker-notificacoes", resources.postgres, "WRITES", "Registra o envio.");
  await bind("loja-web", resources.redis, "WRITES", "Guarda a sessão de quem está comprando.");

  const lojaId = serviceId.get("loja-web");
  const author = userId.get("sofia.almeida@belko.com.br");
  if (lojaId) {
    await prisma.serviceDoc.upsert({
      where: { serviceId_slug: { serviceId: lojaId, slug: "regras-de-negocio" } },
      create: { serviceId: lojaId, slug: "regras-de-negocio", title: "Regras de negócio", content: LOJA_DOC, position: 0, updatedById: author },
      update: {},
    });
  }

  console.log(`Preenchimento concluído: ${PEOPLE.length} pessoas @belko.com.br, ${SURFACES.length} frontends e workers, 7 integrações. O que já existia foi mantido.`);
}

async function ensureResource(input: {
  slug: string;
  name: string;
  kind: "HTTP_API" | "QUEUE" | "DATABASE" | "CACHE";
  provider: string;
  docsUrl?: string;
  description: string;
  endpoints: Record<string, string>;
}) {
  const existing = await prisma.externalResource.findUnique({ where: { slug: input.slug }, select: { id: true } });
  const resource = existing ?? await prisma.externalResource.create({
    data: { slug: input.slug, name: input.name, kind: input.kind, provider: input.provider, docsUrl: input.docsUrl, description: input.description },
    select: { id: true },
  });
  for (const [environmentId, value] of Object.entries(input.endpoints)) {
    await prisma.resourceEndpoint.upsert({
      where: { resourceId_environmentId: { resourceId: resource.id, environmentId } },
      create: { resourceId: resource.id, environmentId, value },
      update: {},
    });
  }
  return resource.id;
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); }).finally(() => prisma.$disconnect());
