---
description: Passo a passo para rodar o Rizoma na sua máquina com pnpm, por que o .env precisa ser copiado para duas pastas, portas, Prisma Studio, reset do banco e erros comuns.
---

# Desenvolvimento local

Esta página mostra como rodar o Rizoma a partir do código-fonte, com recarga automática, usando o Docker apenas para o PostgreSQL. Ela serve a quem vai contribuir com código ou quer inspecionar o funcionamento por dentro. Para avaliar o produto sem mexer no código, o [Início rápido](/guia/inicio-rapido) é mais curto.

## Antes de começar

Você precisa de Node.js 22 ou superior, pnpm 10 (via Corepack), Docker com Compose v2 e Git. Confira as versões em [Requisitos](/instalacao/requisitos).

```bash
node -v && pnpm -v && docker compose version
```

## Passo a passo

### 1. Baixe o código e instale as dependências

```bash
git clone https://github.com/wendersonbelko/rizoma.git
cd rizoma
corepack enable
pnpm install
```

### 2. Crie o `.env` e gere as chaves

::: code-group

```bash [Linux / macOS / Git Bash]
cp .env.example .env
pnpm setup:keys
```

```powershell [PowerShell]
Copy-Item .env.example .env
pnpm setup:keys
```

:::

O `pnpm setup:keys` só **imprime** duas linhas (`ENCRYPTION_KEY` e `AUTH_SECRET`). Cole os valores no `.env` da raiz, nas variáveis de mesmo nome. O restante do `.env.example` já serve para desenvolvimento: o banco em `localhost:5432`, o usuário e a senha `apihub` e `AUTH_URL="http://localhost:3000"`.

### 3. Copie o `.env` para `apps/web` e `packages/db`

::: code-group

```bash [Linux / macOS / Git Bash]
cp .env apps/web/.env
cp .env packages/db/.env
```

```powershell [PowerShell]
Copy-Item .env apps/web/.env
Copy-Item .env packages/db/.env
```

:::

Cada processo lê o `.env` da **pasta em que roda**, e não o da raiz:

| Cópia | Quem lê | Por quê |
|---|---|---|
| `apps/web/.env` | O Next.js (`pnpm dev`) | O Next carrega os arquivos `.env` da pasta do app. |
| `packages/db/.env` | O Prisma (`pnpm db:deploy`, `pnpm db:migrate`, Prisma Studio) e os scripts (`pnpm admin:recover`, `pnpm demo:seed`) | O Prisma lê o `.env` da pasta do pacote onde o comando roda. |

A raiz continua sendo a "fonte": edite lá e copie de novo. Se você mudar uma variável e nada acontecer, quase sempre foi uma cópia esquecida ou o servidor que não foi reiniciado.

### 4. Suba o PostgreSQL e a caixa de e-mail

```bash
pnpm db:up
```

Esse atalho roda `docker compose up -d postgres mailpit`. O banco sobe em `127.0.0.1:5432` (só na sua máquina), com os dados no volume `pgdata`, então eles sobrevivem a reinícios. O Mailpit sobe junto: SMTP em `127.0.0.1:1025` e a caixa em `http://localhost:8025`.

Para o hub usar essa caixa, com a instalação já concluída e sem SMTP gravado:

```bash
pnpm mail:dev
```

Isso grava servidor `127.0.0.1`, porta `1025`, TLS desligado, sem usuário, remetente `noreply@example.com` e endereço público `http://localhost:3000`. Se já existir SMTP, o comando não mexe. No perfil `app` do Compose, o container do hub alcança o Mailpit pelo host `mailpit`, não por `127.0.0.1`.

### 5. Aplique as migrações

```bash
pnpm db:deploy
```

Isso aplica as migrações que já vêm no repositório, do mesmo jeito que em produção. Sem esse passo, o assistente reconhece o banco mas não consegue continuar.

::: info `db:deploy` ou `db:migrate`?
Use `pnpm db:deploy` para aplicar as migrações existentes. Use `pnpm db:migrate` (que roda `prisma migrate dev`) só quando você alterou o `schema.prisma` e precisa **criar** uma migração nova. Veja [Mudar o banco (migração)](/contribuindo/guias/migracao-de-banco).
:::

### 6. Inicie o app

```bash
pnpm dev
```

O `pnpm dev` roda o Turborepo, que gera o cliente do Prisma antes de iniciar o Next.js. Abra `http://localhost:3000` e siga o [assistente](/instalacao/assistente). O caminho mais curto é o login por **E-mail e senha**, que não exige criar aplicativo em provedor nenhum.

## Portas

| Porta | O que é | Como mudar |
|---|---|---|
| `3000` | Next.js (o hub) | Rode o Next com `-p`, por exemplo `pnpm --filter @api-hub/web exec next dev -p 3001`, e atualize o `AUTH_URL` nas três cópias do `.env` e as URLs de callback nos provedores. |
| `5432` | PostgreSQL do Compose, só em `127.0.0.1` | Edite a porta no `docker-compose.yml` e a porta na `DATABASE_URL`. |
| `1025` | SMTP do Mailpit, só em `127.0.0.1` | Edite a porta publicada no `docker-compose.yml` e o servidor em **Configurações → E-mail**. |
| `8025` | Caixa do Mailpit (`http://localhost:8025`) | Edite a porta publicada no `docker-compose.yml`. |
| `5555` | Prisma Studio, quando você o abre | Padrão do Prisma. |

## Prisma Studio

O Prisma Studio é uma interface web para olhar e editar as tabelas. Útil para depurar:

```bash
pnpm --filter @api-hub/db studio
```

Ele lê o `DATABASE_URL` de `packages/db/.env` e abre em `http://localhost:5555`.

## Zerar o banco

Para recomeçar do assistente, com o banco vazio:

```bash
docker compose down -v      # apaga os containers e o volume pgdata
pnpm db:up
pnpm db:deploy
```

::: danger Isso apaga todos os dados
`down -v` remove o volume `pgdata`. Se você aponta o `DATABASE_URL` para outro banco, o `docker compose down -v` não o afeta. Nesse caso, dá para zerar as tabelas com `pnpm --filter @api-hub/db exec prisma migrate reset`, que **apaga tudo** no banco apontado.
:::

## Testes e verificações

```bash
pnpm typecheck   # tipos em todo o monorepo
pnpm test        # testes unitários (core e web)
```

Os testes de integração rodam contra um PostgreSQL real e **truncam as tabelas**. Use um banco separado e nunca o de desenvolvimento com dados que você quer manter. Uma forma de preparar e rodar (no Bash):

```bash
docker compose exec postgres createdb -U apihub apihub_test
export DATABASE_URL="postgresql://apihub:apihub@localhost:5432/apihub_test"
export TEST_DATABASE_URL="$DATABASE_URL"
pnpm --filter @api-hub/db generate
pnpm db:deploy
pnpm test:integration
```

No PowerShell, troque cada `export VAR="..."` por `$env:VAR = "..."`. Mais detalhes em [Testes](/contribuindo/testes).

## Dicas

### Login com provedores externos

Em desenvolvimento, use o mesmo host em todo lugar: se o `AUTH_URL` é `http://localhost:3000`, abra o hub por `localhost` (não por `127.0.0.1`) e cadastre a URL de callback com `localhost`. Os principais provedores aceitam `http://localhost` como exceção à regra de HTTPS. A URL exata está em [Provedores de login](/instalacao/provedores-de-login).

### Windows e WSL

- O PowerShell e o Git Bash servem. Os comandos `cp` viram `Copy-Item` no PowerShell.
- O **WSL 2** costuma dar a melhor experiência: clone o repositório **dentro** do sistema de arquivos do Linux (por exemplo, em `~/api-hub`) e não em `/mnt/c/...`. O `pnpm install` e o hot reload ficam bem mais rápidos.
- Ative a integração do Docker Desktop com a sua distribuição WSL.
- Mantenha os arquivos de texto com quebra de linha LF. Se o Git converter para CRLF, scripts de shell podem falhar.
- Se o `corepack enable` reclamar de permissão, abra o terminal como administrador.
- Se a porta `5432` já está em uso por um PostgreSQL instalado no Windows, pare esse serviço ou mude a porta no `docker-compose.yml` e na `DATABASE_URL`.

## Erros comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `Can't reach database server at localhost:5432` | O banco não está de pé | Confirme que o Docker está rodando e execute `pnpm db:up` |
| `Environment variable not found: DATABASE_URL` | Falta o `.env` em `packages/db` | Copie o `.env` para `packages/db/.env` |
| `ENCRYPTION_KEY não definida.` | Falta o `.env` em `apps/web`, ou a chave está vazia | Cole a chave no `.env` da raiz e copie para `apps/web/.env` |
| Erro de `AUTH_SECRET` (`MissingSecret`) | `AUTH_SECRET` vazio ou `.env` não copiado | Cole o valor do `pnpm setup:keys` e copie o `.env` de novo |
| O assistente mostra "Conectado", mas não avança da etapa **Banco de dados** | As migrações não foram aplicadas | Rode `pnpm db:deploy` e clique em **Verificar novamente** |
| `@prisma/client did not initialize yet` | O cliente do Prisma não foi gerado | Rode `pnpm --filter @api-hub/db generate` |
| A porta `3000` já está em uso | Outro processo usa a porta | Pare o outro processo ou use `next dev -p` |
| O login do provedor volta com erro de URL de retorno (`redirect_uri_mismatch` ou parecido) | `AUTH_URL` diferente da URL aberta no navegador ou da callback cadastrada | Use o mesmo host em `AUTH_URL`, no navegador e no provedor |
| Mudei o `.env` e nada mudou | Cópia esquecida ou servidor não reiniciado | Copie para `apps/web` e `packages/db` e reinicie o `pnpm dev` |
| O login mostra "A instalação ainda não terminou" | O assistente não foi concluído | Só o administrador definido na etapa 8 consegue entrar até **Concluir instalação** |
| `ERR_PNPM_UNSUPPORTED_ENGINE` ou aviso de versão do pnpm | Node abaixo de 22 ou pnpm diferente do `packageManager` | Atualize o Node e rode `corepack enable` |

Mais casos em [Solução de problemas](/referencia/solucao-de-problemas).

## Próximos passos

- [Assistente de instalação](/instalacao/assistente): conclua a instalação do hub que você acabou de subir.
- [Início rápido](/guia/inicio-rapido): popule o hub com dados de demonstração.
- [Preparar o ambiente](/contribuindo/ambiente): o fluxo completo de quem contribui com código.
- [Estrutura do monorepo](/arquitetura/monorepo): onde fica cada coisa no código.
