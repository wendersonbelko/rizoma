---
description: Todos os comandos pnpm do monorepo do Rizoma, com argumentos, variáveis e os equivalentes com Docker.
---

# Comandos (CLI)

Esta página lista os comandos do monorepo: os da raiz, os de cada pacote e os equivalentes com Docker. É para quem instala, opera ou contribui com o Rizoma. Os comandos pressupõem Node 22 ou mais novo e pnpm 10 (versão fixada em `packageManager`).

## Regra geral

Rode os comandos da **raiz** do repositório. Os scripts da raiz chamam o Turborepo ou repassam para o pacote certo com `pnpm --filter`. Para rodar um script de um pacote específico, use `pnpm --filter <nome-do-pacote> <script>`.

| Pacote | Nome | O que é |
|---|---|---|
| `apps/web` | `@api-hub/web` | O app Next.js (telas, rotas de API, assistente) |
| `packages/core` | `@api-hub/core` | Regras de negócio puras |
| `packages/db` | `@api-hub/db` | Schema Prisma, migrações, client e scripts |
| `docs` | `@api-hub/docs` | Este site (VitePress) |

## Comandos da raiz

| Comando | O que faz |
|---|---|
| `pnpm dev` | Gera o client do Prisma e sobe o app em modo desenvolvimento em `http://localhost:3000` |
| `pnpm build` | Gera o client do Prisma e compila o app Next.js (`output: standalone`) |
| `pnpm typecheck` | Checagem de tipos (`tsc --noEmit`) em todos os pacotes |
| `pnpm test` | Testes unitários (`core` e `web`), sem banco de dados |
| `pnpm test:integration` | Testes de integração contra um PostgreSQL real. **Trunca o banco** |
| `pnpm lint` | ESLint em todo o repositório (`eslint.config.mjs`) |
| `pnpm db:up` | Sobe o PostgreSQL e o Mailpit do `docker-compose.yml` |
| `pnpm mail:dev` | Grava o SMTP do Mailpit local, só se ainda não houver envio |
| `pnpm db:migrate` | `prisma migrate dev`: cria e aplica migrações (desenvolvimento) |
| `pnpm db:deploy` | `prisma migrate deploy`: aplica as migrações existentes (produção e CI) |
| `pnpm setup:keys` | Imprime `ENCRYPTION_KEY` e `AUTH_SECRET` novos |
| `pnpm admin:recover` | Recupera o acesso de OWNER. Roda no servidor |
| `pnpm demo:seed` | Popula um hub vazio com dados de demonstração |
| `pnpm demo:fill` | Completa o hub atual com pessoas, frontends, workers e integrações, sem apagar o que já existe |
| `pnpm docs:dev` | Site de documentação em modo desenvolvimento |
| `pnpm docs:build` | Gera o site de documentação estático |
| `pnpm docs:preview` | Serve localmente o site já gerado |

::: tip Testes unitários por pacote
Os testes unitários também rodam por pacote, sem o Turborepo:

```bash
pnpm --filter @api-hub/core test
pnpm --filter @api-hub/web test
```
:::

## Desenvolvimento

### pnpm dev

Sobe o app Next.js com recarga automática. Antes, o Turborepo roda `prisma generate` no pacote de banco. Lê o arquivo `apps/web/.env`, e a porta padrão é a 3000. O banco precisa estar de pé e migrado (`pnpm db:up` e `pnpm db:deploy`).

```bash
pnpm dev
```

### pnpm build

Compila o app para produção (`apps/web/.next`, com saída `standalone`). É o que o Dockerfile executa. Não precisa de um banco acessível, mas o `AUTH_SECRET` e o `DATABASE_URL` precisam existir (a imagem Docker usa valores fictícios só para o build).

### pnpm typecheck

Roda `tsc --noEmit` em `apps/web`, `packages/core` e `packages/db`. O CI executa este comando em todo push e pull request.

### pnpm setup:keys

Imprime duas linhas prontas para colar no `.env`:

```text
ENCRYPTION_KEY="qX1...=="
AUTH_SECRET="k3J...-_"
```

- `ENCRYPTION_KEY`: 32 bytes aleatórios em base64. Cifra os segredos guardados no banco (AES-256-GCM).
- `AUTH_SECRET`: 32 bytes aleatórios em base64url. Usado pelo Auth.js para assinar e cifrar as sessões.

Gere uma vez, guarde num cofre de segredos e **não troque a `ENCRYPTION_KEY` depois**: os segredos já cifrados ficam ilegíveis (veja [Solução de problemas](/referencia/solucao-de-problemas)). O comando não grava nada em disco.

## Banco de dados

### pnpm db:up

Equivale a `docker compose up -d postgres mailpit`. Sobe o PostgreSQL 16 com o volume `pgdata`, publicado só em `127.0.0.1:5432`. A senha vem de `POSTGRES_PASSWORD` (padrão `apihub`). Sobe também o Mailpit (`axllent/mailpit`), com SMTP em `127.0.0.1:1025` e a caixa em `http://localhost:8025`.

### pnpm mail:dev

Grava o SMTP de desenvolvimento quando a instalação ainda não tem envio: servidor `127.0.0.1`, porta `1025`, TLS desligado, sem usuário, remetente `noreply@example.com`, endereço público `http://localhost:3000`. Recusa `NODE_ENV=production` e não sobrescreve um SMTP já salvo. Os e-mails aparecem em `http://localhost:8025`. No container do perfil `app`, o host do SMTP é `mailpit`, não `127.0.0.1`.

### pnpm db:migrate

Roda `prisma migrate dev` no pacote `@api-hub/db`. Serve para **quem altera o `schema.prisma`**: compara o schema com o banco, cria uma migração nova em `packages/db/prisma/migrations` e a aplica. Pergunta o nome da migração. Se o banco de desenvolvimento divergir do histórico, o Prisma pode propor recriar o schema: nunca aceite isso num banco com dados que você quer manter. Veja [Mudar o banco (migração)](/contribuindo/guias/migracao-de-banco).

### pnpm db:deploy

Roda `prisma migrate deploy`: aplica as migrações que já estão no repositório, sem criar novas e sem perguntar nada. É o comando seguro para produção, para o CI e para quem só quer subir o ambiente.

Precisa de `DATABASE_URL`. O Prisma lê o arquivo `packages/db/.env` (ou a variável do ambiente, que tem prioridade).

### Comandos do pacote de banco

Estes não têm atalho na raiz. Rode com `pnpm --filter @api-hub/db`:

| Comando | O que faz |
|---|---|
| `pnpm --filter @api-hub/db studio` | Abre o Prisma Studio, uma interface web para navegar nas tabelas |
| `pnpm --filter @api-hub/db generate` | Gera o client do Prisma a partir do schema |
| `pnpm --filter @api-hub/db migrate:dev` | O mesmo que `pnpm db:migrate` |
| `pnpm --filter @api-hub/db migrate:deploy` | O mesmo que `pnpm db:deploy` |
| `pnpm --filter @api-hub/db typecheck` | Checagem de tipos do pacote |

## pnpm admin:recover

Devolve o acesso de OWNER quando ninguém mais consegue entrar. Precisa de acesso de linha de comando ao servidor: é essa a prova de autorização, porque o projeto não tem token central.

```bash
pnpm admin:recover --login <usuario-do-github | e-mail> [--reset-password]
```

| Argumento | Descrição |
|---|---|
| `--login` | Obrigatório. Usuário do GitHub (letras minúsculas, números e hífen) ou e-mail |
| `--reset-password` | Opcional. Também gera um link de nova senha (1 hora, uso único). Só funciona com e-mail e com conta existente |

Variáveis usadas: `DATABASE_URL` (para conectar) e `AUTH_URL` (para montar o link de redefinição).

O comando pede confirmação antes de agir:

```text
Tornar fulano@suaempresa.com OWNER da instalação "Acme"? (sim/não)
```

Só a resposta `sim` continua. O resultado depende da pessoa:

| Situação | Resultado |
|---|---|
| A pessoa já entrou no hub antes | Vira OWNER ativo na hora. Bloqueio por tentativas de senha é limpo. Com `--reset-password`, imprime o link de nova senha |
| A pessoa nunca entrou | Abre uma janela de 60 minutos: o **primeiro login dela** nesse prazo vira OWNER, mesmo sem vínculo comprovado ou com a política de bloqueio |
| `--reset-password` para quem não tem conta | Erro (código de saída 1): sem conta, use o comando sem `--reset-password` |

O hub ainda precisa estar instalado; senão o comando avisa para usar o assistente em `/setup`. Tudo fica na [auditoria](/admin/auditoria) (`owner.recovery_opened`, `owner.recovered`, `user.password_reset_link`). A janela aberta pode ser cancelada em **Configurações → Ambientes e sessões** (bloco **Sessões e recuperação**). Guia completo em [Recuperação de OWNER](/admin/recuperacao-de-owner).

```bash
# Desenvolvimento ou servidor com Node
pnpm admin:recover --login fulano@suaempresa.com --reset-password

# Docker
docker compose --profile app run --rm migrate pnpm admin:recover --login fulano@suaempresa.com
```

## pnpm demo:seed

Popula o hub com dados de demonstração: serviços com specs reais em vários ambientes, repositórios, integrações externas, variáveis, páginas de regras de negócio, times, pessoas e solicitações de acesso pendentes.

```bash
pnpm demo:seed --me seu-usuario-ou-email
```

| Argumento | Descrição |
|---|---|
| `--me` | Opcional. Usuário do GitHub ou e-mail de uma pessoa que **já entrou** no hub: ela vira líder do time Pagamentos. Se a pessoa não existir, o argumento é ignorado |

Condições para rodar (o comando recusa e explica se alguma falhar):

- `NODE_ENV` diferente de `production`.
- O hub já foi instalado pelo assistente.
- Não existe nenhum serviço cadastrado.
- `ENCRYPTION_KEY` definida, porque os segredos de exemplo são cifrados como os reais.

As pessoas criadas na demonstração não têm senha nem conta vinculada e não conseguem entrar. Veja a receita [Hub com dados de demonstração](/receitas/dados-de-demonstracao).

## pnpm demo:fill

Completa um hub **já instalado** que pode já ter serviços. Não apaga linhas e não troca a descrição de um serviço que já existe. Recusa `NODE_ENV=production`.

```bash
pnpm demo:fill
```

O que entra, se ainda não estiver lá:

- 17 pessoas `nome.sobrenome@belko.com.br`, ativas, com a senha de demonstração `Senha@Segura10`. Elas entram pelo login de e-mail. A senha fica só neste comando.
- Times das áreas (ou os times `time-de-*` que o hub já tiver, sem criar uma cópia).
- Frontends Loja, Painel de operação e App do entregador, e os workers de notificações e de estoque.
- As APIs Pedidos, Pagamentos, Estoque, Entregas, Notificações, Catálogo e Usuários, só se o slug ainda não existir.
- Integrações ViaCEP, BrasilAPI, Open-Meteo, IBGE, fila RabbitMQ `pedido.criado`, PostgreSQL da loja e Redis de sessão. Os endereços internos não trazem senha.

Quem já é OWNER não tem a senha trocada. Rodar de novo não duplica.

## Testes

### pnpm test

Roda os testes unitários com o Vitest, sem banco:

- `packages/core/test`: regras de negócio (permissões, política de acesso, spec, grafo, menu, paginação, texto, temas).
- `apps/web/test/unit`: o guarda do design system e a cobertura dos tours.

### pnpm test:integration

Roda os testes de integração de `apps/web/test/integration` (acesso, admin, funcionalidades, publicação de specs) contra um PostgreSQL de verdade. Exige a variável `TEST_DATABASE_URL`.

::: danger Este comando apaga os dados
Antes de cada teste, todas as tabelas do banco apontado por `TEST_DATABASE_URL` são truncadas. O comando recusa URLs que contenham "prod", mas **nunca aponte para um banco com dados que você quer manter**.
:::

O banco de testes precisa ter as migrações aplicadas. Um roteiro completo com o PostgreSQL do compose:

::: code-group
```bash [bash]
pnpm db:up
docker compose exec postgres createdb -U apihub apihub_test

export TEST_DATABASE_URL="postgresql://apihub:apihub@localhost:5432/apihub_test"
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:deploy
pnpm test:integration
```

```powershell [PowerShell]
pnpm db:up
docker compose exec postgres createdb -U apihub apihub_test

$env:TEST_DATABASE_URL = "postgresql://apihub:apihub@localhost:5432/apihub_test"
$env:DATABASE_URL = $env:TEST_DATABASE_URL
pnpm db:deploy
pnpm test:integration
```
:::

Mais em [Testes](/contribuindo/testes).

## Documentação

| Comando | O que faz |
|---|---|
| `pnpm docs:dev` | Servidor de desenvolvimento do VitePress, com recarga |
| `pnpm docs:build` | Gera o site em `docs/.vitepress/dist` |
| `pnpm docs:preview` | Serve o site gerado, para conferir antes de publicar |

Variáveis do build:

| Variável | Padrão | Uso |
|---|---|---|
| `DOCS_REPO` | `wendersonbelko/rizoma` | Repositório no GitHub (`dono/nome`). Define o link do GitHub, o "Editar esta página" e o caminho do site |
| `DOCS_BASE` | `/<nome-do-repositorio>/` | Caminho base do site. Use `/` para domínio próprio |

O endereço local inclui o caminho base (por padrão, `/api-hub/`). O workflow `.github/workflows/docs.yml` publica o site no GitHub Pages a cada push na `main` que altere `docs/`. Veja [Esta documentação](/contribuindo/documentacao).

## Variáveis de ambiente usadas pelos comandos

| Variável | Quem usa |
|---|---|
| `DATABASE_URL` | `pnpm dev`, `pnpm db:*`, `pnpm admin:recover`, `pnpm demo:seed`, `pnpm mail:dev` |
| `ENCRYPTION_KEY` | `pnpm dev` e o app em produção; `pnpm demo:seed` |
| `AUTH_SECRET`, `AUTH_URL` | O app; `AUTH_URL` também no link de nova senha do `admin:recover` |
| `TEST_DATABASE_URL` | `pnpm test:integration` |
| `POSTGRES_PASSWORD` | `docker compose` (padrão `apihub`) |
| `DOCS_REPO`, `DOCS_BASE` | `pnpm docs:build` |

A lista completa, com descrição de cada uma, está em [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).

::: info Onde ficam os arquivos .env
O Next.js lê o `.env` da pasta do app (`apps/web/.env`) e o Prisma lê o da pasta do pacote (`packages/db/.env`). Por isso o fluxo de desenvolvimento copia o `.env` da raiz para os dois lugares. Veja [Desenvolvimento local](/instalacao/desenvolvimento-local).
:::

## Equivalentes com Docker

O `docker-compose.yml` tem os serviços `postgres` e `mailpit` (sempre) e, no perfil `app`, os serviços `migrate` (roda `pnpm db:deploy` e termina) e `web` (o app, na porta 3000).

| Objetivo | Comando |
|---|---|
| Subir banco e Mailpit (como `pnpm db:up`) | `docker compose up -d postgres mailpit` |
| Subir tudo em produção | `docker compose --profile app up -d --build` |
| Aplicar migrações (como `pnpm db:deploy`) | `docker compose --profile app run --rm migrate` |
| Recuperar OWNER | `docker compose --profile app run --rm migrate pnpm admin:recover --login fulano@suaempresa.com` |
| Ver os logs do app | `docker compose logs -f web` |
| Ver o estado dos serviços | `docker compose ps` |
| Parar tudo | `docker compose --profile app down` |
| Abrir um `psql` no banco | `docker compose exec postgres psql -U apihub -d apihub` |

O serviço `migrate` usa o mesmo `.env` do app e sobrescreve `DATABASE_URL` para apontar para o contêiner `postgres`. O `demo:seed` foi pensado para ambientes de desenvolvimento, não para o perfil de produção.

Detalhes de produção em [Produção com Docker](/instalacao/docker) e de atualização em [Atualização e backup](/instalacao/atualizacao-e-backup).

## Veja também

- [Desenvolvimento local](/instalacao/desenvolvimento-local)
- [Produção com Docker](/instalacao/docker)
- [Recuperação de OWNER](/admin/recuperacao-de-owner)
- [Preparar o ambiente (contribuir)](/contribuindo/ambiente)
