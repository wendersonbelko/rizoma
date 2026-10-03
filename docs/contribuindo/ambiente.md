---
description: Como preparar o ambiente de desenvolvimento do Rizoma do zero, rodar o app, o Prisma Studio e os testes.
---

# Preparar o ambiente

Esta página leva você de um computador limpo a um Rizoma rodando em `http://localhost:3000`, com os testes passando. É para quem vai contribuir com código ou documentação. Se você só quer instalar o hub para usar, veja [Desenvolvimento local](/instalacao/desenvolvimento-local) e [Produção com Docker](/instalacao/docker).

## O que você precisa

| Ferramenta | Versão | Para quê |
|---|---|---|
| Node.js | 22 ou mais novo | Roda o app, os testes e o site de documentação. |
| pnpm | 10 (via corepack) | Gerenciador de pacotes do monorepo. A versão exata está no campo `packageManager` do `package.json`. |
| Docker | Docker Desktop ou Engine com Compose v2 | Sobe o PostgreSQL 16 do desenvolvimento. |
| Git | qualquer recente | Clonar, criar branches e enviar o PR. |

Você não precisa instalar o PostgreSQL: o `docker-compose.yml` do projeto já traz um.

## Passo a passo

### 1. Faça o fork e clone

Faça o fork de `wendersonbelko/rizoma` no GitHub e clone o seu fork:

```bash
git clone https://github.com/SEU-USUARIO/rizoma.git
cd rizoma
git remote add upstream https://github.com/wendersonbelko/rizoma.git
```

O remoto `upstream` deixa você atualizar o fork com `git fetch upstream` antes de abrir cada PR.

### 2. Ative o pnpm

O projeto fixa a versão do pnpm no `package.json`. O corepack, que já vem com o Node, baixa a versão certa:

```bash
corepack enable
pnpm -v   # deve mostrar 10.x
```

### 3. Instale as dependências

```bash
pnpm install
```

O comando instala os pacotes de `apps/web`, `packages/core`, `packages/db` e `docs`.

### 4. Crie os arquivos `.env`

O Next.js lê o `.env` da pasta do app e o Prisma lê o `.env` da pasta do pacote. Por isso o mesmo arquivo precisa existir em **três lugares**: na raiz, em `apps/web` e em `packages/db`.

::: code-group
```bash [bash / WSL / macOS / Linux]
cp .env.example .env
pnpm setup:keys            # imprime ENCRYPTION_KEY e AUTH_SECRET
# cole os dois valores no .env da raiz e só então copie:
cp .env apps/web/.env
cp .env packages/db/.env
```
```powershell [PowerShell]
Copy-Item .env.example .env
pnpm setup:keys            # imprime ENCRYPTION_KEY e AUTH_SECRET
# cole os dois valores no .env da raiz e só então copie:
Copy-Item .env apps/web/.env
Copy-Item .env packages/db/.env
```
:::

O `.env.example` já vem com `DATABASE_URL` apontando para o PostgreSQL do compose e `AUTH_URL="http://localhost:3000"`. As cópias não se sincronizam: se você editar um `.env`, repita a cópia. Os arquivos `.env` estão no `.gitignore`; nunca os envie num commit.

### 5. Suba o banco

```bash
pnpm db:up
```

O comando sobe só o serviço `postgres` do compose (porta `127.0.0.1:5432`, volume `pgdata`). Espere o healthcheck ficar saudável: `docker compose ps` mostra `healthy`.

### 6. Aplique as migrações

```bash
pnpm db:deploy
```

Aplica as migrações que já vêm no repositório (`packages/db/prisma/migrations`). Para criar uma migração nova, veja [Mudar o banco](/contribuindo/guias/migracao-de-banco).

### 7. Rode o app

```bash
pnpm dev
```

Abra `http://localhost:3000`. O `pnpm dev` gera o client do Prisma antes de subir o Next.js. Como o hub ainda não está instalado, você cai no [assistente de instalação](/instalacao/assistente).

::: tip O caminho mais curto no assistente
Na etapa **Formas de login**, marque **E-mail e senha**: você não precisa registrar um aplicativo OAuth para desenvolver. Na etapa **Primeiro administrador**, crie o login com e-mail e senha.
:::

### 8. Popule o hub (opcional)

Com a instalação concluída, crie dados de demonstração:

```bash
pnpm demo:seed --me seu-email@suaempresa.com
```

O comando cria serviços com specs reais, repositórios, integrações, times e pedidos de acesso. Só roda fora de produção e num hub sem serviços. Veja [Hub com dados de demonstração](/receitas/dados-de-demonstracao).

## Comandos do dia a dia

Todos rodam na raiz do repositório.

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe o app em modo desenvolvimento. |
| `pnpm typecheck` | Checa os tipos de todo o monorepo, inclusive os testes. |
| `pnpm test` | Testes unitários do `core` e do `web`, sem banco. |
| `pnpm test:integration` | Testes de integração contra PostgreSQL. Precisa de `TEST_DATABASE_URL`. |
| `pnpm build` | Build de produção do Next.js. |
| `pnpm db:up` | Sobe o PostgreSQL e o Mailpit do compose. |
| `pnpm db:migrate` | `prisma migrate dev`: cria e aplica migrações em desenvolvimento. |
| `pnpm db:deploy` | `prisma migrate deploy`: aplica as migrações existentes. |
| `pnpm --filter @api-hub/db generate` | Gera o client do Prisma (depois de mudar o schema ou de um `pnpm install` novo). |
| `pnpm --filter @api-hub/db studio` | Abre o Prisma Studio. |
| `pnpm docs:dev` | Site de documentação com recarga automática. |

::: warning O pnpm test da raiz
O `pnpm test` da raiz chama `turbo run test`. Se o comando reclamar que não encontra a tarefa `test` (ela precisa estar declarada no `turbo.json`), rode os pacotes direto: `pnpm --filter @api-hub/core test` e `pnpm --filter @api-hub/web test`. Veja o comando para um arquivo só em [Testes](/contribuindo/testes).
:::

## Prisma Studio

O Prisma Studio é uma interface web para olhar e editar as tabelas do banco. Ele lê o `packages/db/.env`:

```bash
pnpm --filter @api-hub/db studio
```

Abra o endereço que o comando mostrar (normalmente `http://localhost:5555`). Use para conferir o efeito de uma ação, por exemplo as linhas de `AuditLog` depois de salvar algo. Não edite dados à mão para "consertar" um comportamento: isso esconde bugs.

## Testes de integração e o banco separado

Os testes de integração rodam contra um PostgreSQL de verdade e **truncam todas as tabelas antes de cada teste**. Nunca aponte `TEST_DATABASE_URL` para o banco onde você guarda dados de desenvolvimento, e muito menos para produção. O teste se recusa a rodar se a URL contiver "prod".

Crie um banco só para os testes no mesmo PostgreSQL do compose e aplique as migrações nele:

::: code-group
```bash [bash / WSL / macOS / Linux]
docker compose exec postgres psql -U apihub -d apihub -c "CREATE DATABASE apihub_test"

export TEST_DATABASE_URL="postgresql://apihub:apihub@localhost:5432/apihub_test?schema=public"
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:deploy
pnpm test:integration
```
```powershell [PowerShell]
docker compose exec postgres psql -U apihub -d apihub -c "CREATE DATABASE apihub_test"

$env:TEST_DATABASE_URL = "postgresql://apihub:apihub@localhost:5432/apihub_test?schema=public"
$env:DATABASE_URL = $env:TEST_DATABASE_URL; pnpm db:deploy
Remove-Item Env:DATABASE_URL
pnpm test:integration
```
:::

O banco de teste é criado uma vez. Depois de puxar migrações novas da `main`, rode o `db:deploy` de novo contra ele. Mais sobre os testes em [Testes](/contribuindo/testes).

## Editor

O projeto não tem Prettier. O estilo é o dos arquivos vizinhos: dois espaços, aspas duplas e ponto e vírgula. O ESLint (`pnpm lint`, configuração na raiz em `eslint.config.mjs`) cobre o TypeScript e o JavaScript do monorepo. Ele roda no commit, junto com os testes unitários.

Dicas para o VS Code:

- Instale as extensões **Prisma** (formatação e realce do `schema.prisma`), **Tailwind CSS IntelliSense** (o projeto usa Tailwind 4), **ESLint** e **Vitest** (roda e depura testes pela barra lateral).
- Use a versão do TypeScript do projeto: no menu de comandos, **TypeScript: Select TypeScript Version** e **Use Workspace Version**.
- Desligue formatadores automáticos que reescrevem o arquivo inteiro ao salvar. Um diff gigante de espaços atrapalha a revisão.
- O alias `@/` aponta para `apps/web/src`, e os pacotes internos são importados como `@api-hub/core` e `@api-hub/db`. O editor resolve os dois pelo `tsconfig`.

## Windows e WSL

O projeto roda no Windows, mas o caminho mais suave é o WSL 2:

- Instale o Docker Desktop com a integração com o WSL ligada.
- Clone o repositório **dentro** do sistema de arquivos do WSL (por exemplo `~/projetos/api-hub`), não em `/mnt/c/...`. Instalar dependências e observar arquivos é muito mais rápido.
- Configure `git config core.autocrlf input` para não converter fins de linha nos commits.

No PowerShell puro os comandos funcionam com pequenas diferenças, como o `Copy-Item` no lugar do `cp` e a forma de definir variáveis de ambiente (`$env:NOME = "valor"`). Os blocos com abas acima mostram as duas formas.

## Problemas comuns

| Sintoma | Causa provável e solução |
|---|---|
| `Environment variable not found: DATABASE_URL` ao rodar um comando do Prisma | Falta o `.env` em `packages/db`. Copie o da raiz. |
| O app reclama de `ENCRYPTION_KEY` ou `AUTH_SECRET` | Você não colou os valores de `pnpm setup:keys` ou não copiou o `.env` para `apps/web` depois de editar. |
| Não consegue conectar ao banco (`P1001`) | O PostgreSQL ainda não subiu. Rode `pnpm db:up` e espere o `healthy` em `docker compose ps`. |
| A porta 5432 ou a 3000 já está em uso | Outro PostgreSQL ou app usa a porta. Pare-o ou mude a porta no `docker-compose.yml` (5432) ou rode o Next em outra porta. |
| Erros de tipo dizendo que faltam modelos do Prisma | Falta gerar o client: `pnpm --filter @api-hub/db generate`. |
| `Defina TEST_DATABASE_URL para rodar os testes de integração.` | Defina a variável, como mostrado acima. |
| Mudei o `.env` e nada mudou | Reinicie o `pnpm dev`. As variáveis são lidas na inicialização. |

Para outros problemas de instalação, veja [Solução de problemas](/referencia/solucao-de-problemas).

## Próximos passos

- [Padrões de código](/contribuindo/padroes-de-codigo)
- [Testes](/contribuindo/testes)
- [Estrutura do monorepo](/arquitetura/monorepo)
