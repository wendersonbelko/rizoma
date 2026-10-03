---
description: Como rodar o Rizoma em produção com Docker Compose, o que cada serviço faz, o .env de produção, comandos do dia a dia, banco gerenciado, execução sem Compose e o endurecimento já incluso.
---

# Produção com Docker

Esta página mostra como colocar o Rizoma no ar num servidor com Docker Compose, do `.env` de produção até os comandos do dia a dia. Ela serve a quem administra o servidor. O HTTPS fica na página seguinte, [HTTPS com proxy reverso](/instalacao/proxy-https), e é obrigatório para uma instalação de verdade.

## Antes de começar

- Um servidor com Docker Engine e Compose v2. Veja [Requisitos](/instalacao/requisitos).
- Um domínio apontando para o servidor, por exemplo `apihub.suaempresa.com`.
- Acesso para gerar as chaves (`node scripts/generate-keys.mjs`) em qualquer máquina com Node 22.
- Leitura rápida de [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).

## Como o Compose é montado

O `docker-compose.yml` da raiz define quatro serviços:

```mermaid
flowchart LR
  PG[("postgres")] -->|"saudável"| MIG["migrate"]
  MIG -->|"terminou com sucesso"| WEB["web"]
  PROXY["Proxy HTTPS"] -->|"127.0.0.1:3000"| WEB
  WEB --> PG
```

| Serviço | O que é | Profile | Detalhes |
|---|---|---|---|
| `postgres` | PostgreSQL 16 (`postgres:16-alpine`) | nenhum (sempre sobe) | Usuário e banco `apihub`. Porta publicada só em `127.0.0.1:5432`. Dados no volume `pgdata`. Healthcheck com `pg_isready`. |
| `mailpit` | Caixa SMTP local (`axllent/mailpit`) | nenhum (sempre sobe) | SMTP em `127.0.0.1:1025` e interface em `127.0.0.1:8025`. Serve para testes. O SMTP de verdade continua sendo o que você salva em **Configurações → E-mail**. Dentro do container `web`, o host desse Mailpit é `mailpit`. |
| `migrate` | Imagem do estágio `migrate` do Dockerfile | `app` | Roda `pnpm db:deploy` (as migrações do Prisma) e **termina**. É também a imagem para comandos administrativos. |
| `web` | Imagem do estágio `runner` (o app Next.js) | `app` | Porta `3000`. Só inicia depois que o `migrate` termina com sucesso. `restart: unless-stopped`. |

O `migrate` e o `web` recebem o `.env` (`env_file`) e **o Compose sobrescreve a `DATABASE_URL`** dos dois, apontando para o container `postgres`, com a senha vinda de `POSTGRES_PASSWORD`. Ou seja: o valor de `DATABASE_URL` que está no `.env` não vale no Compose padrão. Para usar outro banco, veja [Usar um PostgreSQL gerenciado](#usar-um-postgresql-gerenciado).

O `--profile app` é o que liga o `migrate` e o `web`. Sem ele, o Compose sobe o `postgres` e o `mailpit` (é o que o `pnpm db:up` faz no desenvolvimento).

## Passo a passo

### 1. Baixe o código no servidor

```bash
git clone https://github.com/wendersonbelko/rizoma.git
cd rizoma
```

### 2. Crie o `.env` de produção

```bash
cp .env.example .env
chmod 600 .env
```

Edite o `.env`. Um exemplo mínimo para produção:

```bash
# Senha do PostgreSQL do Compose. Use só letras e números (entra numa URL).
POSTGRES_PASSWORD=cole-aqui-o-resultado-de-openssl-rand-hex-24

# Geradas com: node scripts/generate-keys.mjs
ENCRYPTION_KEY="cole-aqui"
AUTH_SECRET="cole-aqui"

# URL pública do hub: https, sem barra no final
AUTH_URL="https://apihub.suaempresa.com"
AUTH_TRUST_HOST="true"

```

Gere os valores:

```bash
node scripts/generate-keys.mjs   # ENCRYPTION_KEY e AUTH_SECRET
openssl rand -hex 24             # POSTGRES_PASSWORD
```

::: warning Uma senha de banco sem símbolos
O Compose monta a `DATABASE_URL` com a senha dentro da URL. Caracteres como `@`, `:`, `/` e `#` quebram a URL. Use letras e números (a saída de `openssl rand -hex` serve).
:::

::: danger Guarde as chaves
Anote a `ENCRYPTION_KEY` e a `AUTH_SECRET` fora do servidor (um cofre de senhas, por exemplo). Sem a `ENCRYPTION_KEY`, os segredos guardados no banco (variáveis, credenciais dos provedores de login e tokens de repositório) não podem ser lidos, e um backup do banco perde o valor. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).
:::

### 3. Suba tudo

```bash
docker compose --profile app up -d --build
```

O `--build` constrói a imagem a partir do código (a primeira vez leva alguns minutos). O Compose sobe o PostgreSQL, espera ficar saudável, roda o `migrate` e só então inicia o `web`.

### 4. Confira

```bash
docker compose --profile app ps
curl -fsS http://127.0.0.1:3000/api/health
```

O `web` deve aparecer como `healthy` (o healthcheck da imagem consulta `GET /api/health` a cada 30 segundos) e o `curl` deve responder `{"ok":true}`. O `migrate` aparece como encerrado (`Exited (0)`), e isso é o esperado.

### 5. Coloque atrás de HTTPS e conclua o assistente

Configure o proxy em [HTTPS com proxy reverso](/instalacao/proxy-https), crie os aplicativos de login em [Provedores de login](/instalacao/provedores-de-login) e abra o hub para concluir o [Assistente de instalação](/instalacao/assistente).

::: warning A porta 3000 do `web` escuta em todas as interfaces
O compose publica `"3000:3000"`, e isso expõe o app direto na rede do servidor, sem HTTPS. Com um proxy no mesmo servidor, publique só no loopback. A forma mais simples é trocar a linha no `docker-compose.yml` para `"127.0.0.1:3000:3000"`. Para não alterar o arquivo do repositório, crie um `docker-compose.override.yml` (o Compose o lê automaticamente; o `!override` exige o Compose 2.24 ou superior):

```yaml
services:
  web:
    ports: !override
      - "127.0.0.1:3000:3000"
```
:::

## Operação do dia a dia

### Ver logs

```bash
docker compose --profile app logs -f web       # app, em tempo real
docker compose --profile app logs migrate      # resultado da última migração
docker compose --profile app logs postgres
```

### Reiniciar, parar e religar

```bash
docker compose --profile app restart web
docker compose --profile app stop
docker compose --profile app up -d
docker compose --profile app down              # remove os containers, mantém o volume pgdata
```

Depois de editar o `.env`, recrie o `web` para ele ler os novos valores:

```bash
docker compose --profile app up -d --force-recreate web
```

::: danger Nunca use `down -v` em produção
O `-v` apaga o volume `pgdata`, ou seja, **todo o banco**. Use só em instalações de avaliação.
:::

### Rodar comandos administrativos

A imagem `migrate` contém o código do repositório e as dependências. Por isso, é nela que você roda comandos como a recuperação de OWNER:

```bash
docker compose --profile app run --rm migrate pnpm admin:recover --login fulano@suaempresa.com
```

Não use `-T`: o comando pede uma confirmação `sim/não` e precisa de um terminal interativo. Detalhes em [Recuperação de OWNER](/admin/recuperacao-de-owner). Para reaplicar as migrações manualmente:

```bash
docker compose --profile app run --rm migrate pnpm db:deploy
```

### Trocar a senha do PostgreSQL depois de instalado

O `POSTGRES_PASSWORD` só vale **na primeira criação do volume**. Mudar o valor no `.env` depois não altera a senha do banco que já existe, e o app deixa de conectar. Para trocar de verdade, altere a senha no banco e depois no `.env`:

```bash
docker compose exec postgres psql -U apihub -d apihub -c "ALTER USER apihub PASSWORD 'nova-senha-so-com-letras-e-numeros'"
# edite POSTGRES_PASSWORD no .env e recrie o app
docker compose --profile app up -d --force-recreate migrate web
```

## Usar um PostgreSQL gerenciado

Para usar RDS, Cloud SQL, Azure Database ou outro PostgreSQL 16+ em vez do container, você precisa que o `web` e o `migrate` usem a **sua** `DATABASE_URL`. Como o `docker-compose.yml` padrão a sobrescreve, o caminho mais claro é ter um arquivo próprio, sem o serviço `postgres`.

### 1. Ponha a URL do seu banco no `.env`

```bash
DATABASE_URL="postgresql://usuario:senha@meu-banco.exemplo.com:5432/apihub?schema=public&sslmode=require"
```

Se a senha tiver caracteres especiais, codifique-os em URL (por exemplo, `@` vira `%40`). O usuário precisa poder criar tabelas no schema `public`. O `POSTGRES_PASSWORD` deixa de ser usado.

### 2. Crie um compose sem o `postgres`

Copie o `docker-compose.yml` para `docker-compose.managed.yml` (na mesma pasta, por causa do `context: .`) e deixe assim:

```yaml
services:
  migrate:
    profiles: [app]
    build: { context: ., target: migrate }
    env_file: .env          # a DATABASE_URL vem daqui

  web:
    profiles: [app]
    build: { context: ., target: runner }
    env_file: .env
    ports: ["127.0.0.1:3000:3000"]
    depends_on:
      migrate: { condition: service_completed_successfully }
    restart: unless-stopped
    read_only: true
    tmpfs: [/tmp, /app/apps/web/.next/cache]
    security_opt: ["no-new-privileges:true"]
```

Repare no que mudou: sumiram o serviço `postgres`, o volume `pgdata`, o `depends_on` do `migrate` e as duas linhas `DATABASE_URL:` de `environment`.

### 3. Suba com esse arquivo

```bash
docker compose -f docker-compose.managed.yml --profile app up -d --build
```

Use sempre o `-f docker-compose.managed.yml` nos comandos seguintes (`logs`, `ps`, `run --rm migrate ...`).

::: tip Cuidados com o banco gerenciado
- Prefira a conexão **direta**. Um pooler em modo de transação (como o PgBouncer) pode atrapalhar as migrações do Prisma.
- Habilite os backups e a janela de manutenção no provedor. O backup do banco continua sendo sua responsabilidade: veja [Atualização e backup](/instalacao/atualizacao-e-backup).
- O banco precisa aceitar conexões do servidor do hub, e só dele.
:::

## Rodar a imagem sem Compose

O `Dockerfile` tem dois alvos úteis:

```bash
docker build -t api-hub .                          # o app (alvo padrão, "runner")
docker build -t api-hub-migrate --target migrate . # migrações e comandos administrativos
```

Crie um arquivo de variáveis **sem aspas**. O `docker run --env-file` não remove aspas, então `ENCRYPTION_KEY="abc"` chegaria ao app com as aspas incluídas e falharia:

```bash
# .env.docker
DATABASE_URL=postgresql://usuario:senha@meu-banco.exemplo.com:5432/apihub?schema=public
ENCRYPTION_KEY=cole-aqui
AUTH_SECRET=cole-aqui
AUTH_URL=https://apihub.suaempresa.com
AUTH_TRUST_HOST=true
```

Aplique as migrações e depois inicie o app:

```bash
docker run --rm --env-file .env.docker api-hub-migrate

docker run -d --name api-hub \
  --env-file .env.docker \
  -p 127.0.0.1:3000:3000 \
  --read-only --tmpfs /tmp --tmpfs /app/apps/web/.next/cache \
  --security-opt no-new-privileges:true \
  --restart unless-stopped \
  api-hub
```

Os containers precisam alcançar o banco pela rede. O healthcheck já vem embutido na imagem, e o `docker ps` mostra o estado `healthy`.

## Endurecimento já incluso

| Proteção | Onde está |
|---|---|
| App roda como **usuário sem privilégios** (`app`), não como root | Dockerfile, estágio `runner` |
| Imagem final **enxuta**: Node 22 (`bookworm-slim`) e a saída `standalone` do Next.js, sem dependências de desenvolvimento nem pnpm | Dockerfile, build em vários estágios |
| Sistema de arquivos **somente leitura** (`read_only`), com `tmpfs` só para `/tmp` e para o cache do Next | `docker-compose.yml` |
| `no-new-privileges`: o processo não ganha privilégios extras | `docker-compose.yml` |
| PostgreSQL publicado só em `127.0.0.1` | `docker-compose.yml` |
| **Healthcheck** em `GET /api/health` | Dockerfile |
| **Sem segredos na imagem**: o `.env` fica fora do contexto de build (`.dockerignore`) e o build usa valores fictícios. Os valores reais entram só na execução | Dockerfile e `.dockerignore` |
| Cabeçalhos de segurança (CSP, HSTS, `X-Frame-Options`, `noindex`) | Aplicação |

O que continua com você: o proxy com HTTPS, o firewall, a guarda do `.env` e das chaves, o backup e a atualização periódica da imagem (reconstrua de tempos em tempos com `docker compose --profile app build --pull` para receber correções da imagem base).

::: info Sobre a variável `NEXT_PUBLIC_DOCS_URL`
Variáveis com prefixo `NEXT_PUBLIC_` são gravadas no código **na hora do build**. O Dockerfile não repassa essa variável ao build, então definir `NEXT_PUBLIC_DOCS_URL` no `.env` não muda os links "Como configurar o CI" da imagem. Se você hospeda esta documentação em outro endereço e quer esses links apontando para lá, altere o Dockerfile e o compose para repassá-la como argumento de build.
:::

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| O `web` não sobe e o `migrate` aparece com erro | A migração falhou | `docker compose --profile app logs migrate` |
| `password authentication failed` no `migrate` ou no `web` | `POSTGRES_PASSWORD` mudou depois de criado o volume | Veja [Trocar a senha do PostgreSQL](#trocar-a-senha-do-postgresql-depois-de-instalado) |
| O hub abre, mas o login volta com erro de redirecionamento | `AUTH_URL` diferente da URL pública, ou proxy sem os cabeçalhos `X-Forwarded-*` | Confira o `AUTH_URL` e o [proxy](/instalacao/proxy-https) |
| Mudei o `.env` e nada mudou | O container ainda usa os valores antigos | `docker compose --profile app up -d --force-recreate web` |
| `web` reinicia sem parar | Erro na inicialização | `docker compose --profile app logs web` |
| Erros de permissão de escrita | O sistema de arquivos é somente leitura | O app só escreve em `/tmp` e no cache do Next. Não monte outros diretórios de escrita |

Mais em [Solução de problemas](/referencia/solucao-de-problemas).

## Próximos passos

- [HTTPS com proxy reverso](/instalacao/proxy-https): o próximo passo obrigatório.
- [Assistente de instalação](/instalacao/assistente): conclua a instalação.
- [Atualização e backup](/instalacao/atualizacao-e-backup): configure o backup antes de liberar o hub.
