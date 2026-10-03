---
description: Como atualizar o Rizoma sem surpresas, como fazer e testar backups com pg_dump, como restaurar, por que guardar a ENCRYPTION_KEY junto e como voltar atrás.
---

# Atualização e backup

Esta página mostra como atualizar o Rizoma para uma versão nova, como fazer backup do banco e das chaves, como restaurar e como voltar atrás se algo der errado. Ela serve a quem administra o servidor. Configure o backup **antes** de as pessoas começarem a usar o hub.

## Antes de começar

- O hub roda com Docker Compose, como em [Produção com Docker](/instalacao/docker). Os comandos abaixo assumem esse caso e a pasta do repositório (por exemplo, `/opt/api-hub`).
- Você tem acesso ao servidor e ao `.env` de produção.
- Você sabe onde estão guardadas a `ENCRYPTION_KEY` e a `AUTH_SECRET` fora do servidor.

## O que guardar no backup

| O que | Onde está | Por que importa |
|---|---|---|
| **O banco de dados** | Volume `pgdata` (ou o banco gerenciado) | Configuração, pessoas, times, serviços, variáveis, integrações, regras de negócio, auditoria e o histórico de specs |
| **`ENCRYPTION_KEY`** | `.env` | Sem ela, os segredos cifrados do backup são **inúteis** (veja abaixo) |
| **`AUTH_SECRET`** | `.env` | Pode ser trocada, mas guardá-la evita derrubar as sessões numa restauração |
| **O `.env` inteiro** | Servidor | Ponto de partida para reconstruir o ambiente |
| **Arquivos que você personalizou** | Servidor | `docker-compose.override.yml`, configuração do proxy e o cron de backup |

::: info O que dá para reconstruir e o que não dá
As specs publicadas pelo CI podem ser reenviadas no próximo deploy. Já as pessoas, os times, as variáveis e segredos, as integrações externas, as páginas de regras de negócio e a auditoria só existem no banco. É neles que o backup faz diferença.
:::

## Fazer backup

### Um backup manual

O serviço `postgres` do Compose usa o usuário e o banco `apihub`. O `pg_dump` já vem na imagem:

```bash
mkdir -p /backups
docker compose exec -T postgres pg_dump -U apihub -d apihub -Fc > /backups/apihub-$(date +%F-%H%M).dump
```

O formato `-Fc` (custom) é compacto e permite restaurar tudo ou só partes. O `-T` desliga o terminal interativo, necessário para redirecionar a saída. Confira que o arquivo não está vazio e que o `pg_restore` consegue lê-lo:

```bash
ls -lh /backups/apihub-*.dump
docker compose exec -T postgres pg_restore --list < /backups/apihub-2026-09-29-0300.dump | head
```

::: tip No Windows
O redirecionamento `>` do PowerShell pode corromper arquivos binários. Gere o arquivo dentro do container e copie-o:

```bash
docker compose exec -T postgres pg_dump -U apihub -d apihub -Fc -f /tmp/apihub.dump
docker compose cp postgres:/tmp/apihub.dump ./apihub.dump
```
:::

### Um backup diário automático

Um script simples, chamado pelo cron. Crie `/opt/api-hub/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/api-hub
STAMP=$(date +%F-%H%M)
docker compose exec -T postgres pg_dump -U apihub -d apihub -Fc > "/backups/apihub-$STAMP.dump"
find /backups -name 'apihub-*.dump' -mtime +14 -delete
```

E agende, por exemplo, para as 3h da manhã (`crontab -e`):

```bash
0 3 * * * /opt/api-hub/backup.sh
```

Depois, **copie os arquivos para fora do servidor** (um bucket, outro servidor, um backup da empresa). Um backup no mesmo disco do banco não protege contra a perda do disco.

### Com um banco gerenciado

Use os backups automáticos e a recuperação para um ponto no tempo do próprio provedor. Se preferir um `pg_dump` seu, rode-o de uma máquina que alcance o banco, **sem** o `?schema=public` da `DATABASE_URL` (o `pg_dump` não reconhece esse parâmetro):

```bash
pg_dump "postgresql://usuario:senha@meu-banco.exemplo.com:5432/apihub?sslmode=require" -Fc -f apihub.dump
```

### Frequência sugerida

Estes números são uma sugestão inicial, e não uma regra do produto:

| Item | Sugestão |
|---|---|
| Backup do banco | Diário, no mínimo. Mais vezes se muita gente edita variáveis e regras de negócio ao longo do dia |
| Antes de cada atualização | Sempre, manualmente |
| Retenção | 14 diários, mais alguns semanais e mensais |
| Cópia fora do servidor | Toda vez |
| Teste de restauração | Pelo menos a cada trimestre, e depois de qualquer mudança na forma de backup |

### Proteja os backups como protegeria o banco

O arquivo de backup contém e-mails, papéis, a auditoria e o conteúdo de variáveis que não são segredo. Os segredos vão **cifrados**, mas mesmo assim guarde os backups com acesso restrito e criptografia em repouso.

## Guardar as chaves junto (sem a `ENCRYPTION_KEY`, o backup perde o valor)

Os segredos do banco (variáveis marcadas como segredo, Client secrets dos provedores de login, tokens de repositório e cabeçalhos de leitura por URL) são cifrados com a `ENCRYPTION_KEY`, que **não** fica no banco. Um backup restaurado com outra chave traz esses dados ilegíveis, e o login por provedores deixa de funcionar. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).

Por isso:

1. Guarde a `ENCRYPTION_KEY` (e a `AUTH_SECRET`) num cofre de segredos ou gerenciador de senhas da empresa.
2. Guarde num lugar **diferente** do dos backups do banco, com controle de acesso próprio. Quem tem o dump **e** a chave consegue ler os segredos.
3. Garanta que quem faz a recuperação de desastre consegue chegar às **duas** coisas.
4. Registre a chave de novo sempre que gerar uma nova instalação.

## Atualizar o hub

### 1. Leia as notas de versão

Antes de atualizar, leia as notas da versão nova no repositório do projeto. Procure três coisas: migrações de banco, variáveis de ambiente novas e mudanças de comportamento. Para ver o que mudou no código:

```bash
git fetch --tags
git log --oneline HEAD..origin/main
git diff HEAD origin/main --stat -- .env.example docker-compose.yml Dockerfile packages/db/prisma/migrations
```

Se aparecerem migrações novas, o `migrate` vai aplicá-las. Se o `.env.example` ganhou variáveis, acrescente-as ao seu `.env`.

### 2. Faça um backup

```bash
docker compose exec -T postgres pg_dump -U apihub -d apihub -Fc > /backups/antes-da-atualizacao-$(date +%F-%H%M).dump
```

### 3. Baixe o código novo

```bash
git pull
```

Se você alterou o `docker-compose.yml` diretamente, o `git pull` pode gerar conflito. Prefira sempre um `docker-compose.override.yml` para as suas mudanças.

### 4. Reconstrua e suba

```bash
docker compose --profile app up -d --build
```

O Compose reconstrói a imagem e recria os containers na ordem certa: o **`migrate` aplica as migrações antes de o `web` subir**. O `web` só inicia depois que o `migrate` termina com sucesso. Se uma migração falhar, o `web` novo não sobe (o antigo continua até ser substituído): veja os logs com `docker compose --profile app logs migrate`.

Para receber correções da imagem base (Node e sistema), reconstrua com `--pull`:

```bash
docker compose --profile app build --pull
docker compose --profile app up -d
```

### 5. Confira

```bash
docker compose --profile app ps
curl -fsS https://apihub.suaempresa.com/api/health
```

Abra o hub, entre e navegue pelo catálogo e por uma página de serviço. As **sessões continuam válidas** durante a atualização, porque a `AUTH_SECRET` não mudou.

::: warning Espere uma indisponibilidade curta
O container `web` é recriado, e o hub fica fora do ar por alguns segundos, ou mais se o build for demorado ou a migração for pesada. Atualize num horário de baixo uso. O CI não perde nada: uma publicação que falhar nesse intervalo pode ser repetida.
:::

### Desenvolvimento local

```bash
git pull
pnpm install
pnpm db:deploy
pnpm dev
```

O `pnpm db:deploy` aplica as migrações novas no banco local. O `pnpm dev` regenera o cliente do Prisma sozinho. Veja [Desenvolvimento local](/instalacao/desenvolvimento-local).

### Com um banco gerenciado

Use os mesmos passos, com o seu arquivo de compose: `docker compose -f docker-compose.managed.yml --profile app up -d --build`. Faça o snapshot do banco no provedor antes.

### Atualizar o PostgreSQL

O `docker compose pull postgres` atualiza a versão menor da imagem `postgres:16-alpine`. Uma mudança de versão **maior** (por exemplo, 16 para 17) exige exportar e importar o banco, e não é coberta por esta página. Nunca faça sem backup e sem testar a restauração antes.

## Restaurar um backup

Restaurar **substitui** o banco atual. Faça isso com o app parado e, se o banco atual ainda existe, com um backup dele guardado antes.

### 1. Pare o app

```bash
docker compose --profile app stop web
```

### 2. Recrie o banco vazio

```bash
docker compose exec -T postgres psql -U apihub -d postgres -c 'DROP DATABASE IF EXISTS apihub WITH (FORCE)'
docker compose exec -T postgres psql -U apihub -d postgres -c 'CREATE DATABASE apihub OWNER apihub'
```

### 3. Restaure o arquivo

```bash
docker compose exec -T postgres pg_restore -U apihub -d apihub --no-owner < /backups/apihub-2026-09-29-0300.dump
```

### 4. Suba o app

```bash
docker compose --profile app up -d
```

Se o backup é de uma versão mais antiga do que o código atual, o `migrate` aplica as migrações que faltam.

### Restaurar num servidor novo

1. Instale a **mesma versão do código** (ou uma mais nova) e crie o `.env` com a **mesma `ENCRYPTION_KEY`**. A `AUTH_SECRET` pode ser a mesma (as sessões continuam) ou uma nova (todos entram de novo).
2. Suba só o banco: `docker compose up -d postgres`.
3. Siga os passos 2 e 3 acima.
4. Suba o app com `docker compose --profile app up -d --build`.
5. Aponte o DNS e o proxy para o servidor novo.

## Testar a restauração

Um backup que nunca foi restaurado é uma esperança, e não um backup. Teste num PostgreSQL descartável:

```bash
docker run -d --name apihub-teste-restore -e POSTGRES_PASSWORD=teste postgres:16-alpine
# espere alguns segundos até o banco terminar de iniciar
docker exec -i apihub-teste-restore createdb -U postgres apihub
docker exec -i apihub-teste-restore pg_restore -U postgres -d apihub --no-owner < /backups/apihub-2026-09-29-0300.dump
docker exec -i apihub-teste-restore psql -U postgres -d apihub -c 'SELECT count(*) FROM "Service"'
docker rm -f apihub-teste-restore
```

O comando `SELECT` deve mostrar o número de serviços que você espera. Para testar a chave também, suba um hub de teste com o banco restaurado e a `ENCRYPTION_KEY` guardada e tente **revelar um segredo** de um serviço. Se ele aparecer, o par backup e chave está bom.

## Voltar atrás (rollback)

O Prisma Migrate só aplica migrações **para frente**: não existe migração de volta. Por isso, o caminho depende de a versão nova ter aplicado migrações ou não.

**A versão nova não trouxe migrações.** Volte o código e reconstrua:

```bash
git log --oneline -5                          # ache o commit ou a tag anterior
git checkout <commit-ou-tag-anterior>
docker compose --profile app up -d --build
```

Para saber se houve migrações, compare `packages/db/prisma/migrations` entre as duas versões (`git diff --stat <anterior> <nova> -- packages/db/prisma/migrations`).

**A versão nova aplicou migrações.** O código antigo pode não funcionar com o banco novo. O caminho seguro é:

1. Parar o app (`docker compose --profile app stop web`).
2. Restaurar o **backup feito antes da atualização** (passos de restauração acima).
3. Voltar o código para a versão anterior com `git checkout`.
4. Reconstruir e subir (`docker compose --profile app up -d --build`).

Você perde o que foi gravado entre o backup e o rollback. Por isso o backup imediatamente antes de atualizar importa.

## Como saber que deu certo

- **Atualização:** `docker compose --profile app ps` mostra o `web` como `healthy`, o `curl` em `/api/health` responde `{"ok":true}` e o hub abre normalmente.
- **Backup:** o arquivo existe, tem tamanho coerente e o `pg_restore --list` o lê sem erro.
- **Restauração:** o teste com o `SELECT` mostra os dados esperados e um segredo é revelado com sucesso.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| O `migrate` falha depois do `git pull` | Uma migração não pôde ser aplicada | `docker compose --profile app logs migrate`. Restaure o backup e abra uma issue com o log |
| O `web` não sobe depois de atualizar | Variável nova ausente no `.env` ou erro na inicialização | Compare com o `.env.example` e veja `docker compose --profile app logs web` |
| `pg_dump` gera um arquivo de 0 bytes | O redirecionamento falhou ou o `-T` foi esquecido no cron | Rode o comando à mão e leia a mensagem de erro |
| Depois de restaurar, os segredos aparecem ilegíveis | A `ENCRYPTION_KEY` do servidor é diferente da original | Use a chave original e recrie o app |
| O `git pull` reclama de alterações locais | Arquivos do repositório foram editados | Mova as mudanças para um `docker-compose.override.yml` e recupere o arquivo original com `git checkout -- docker-compose.yml` |

## Próximos passos

- [Variáveis de ambiente](/instalacao/variaveis-de-ambiente): o que fazer com cada chave.
- [Produção com Docker](/instalacao/docker): o Compose e os comandos do dia a dia.
- [Recuperação de OWNER](/admin/recuperacao-de-owner): o que fazer se os administradores perderem o acesso.
- [Pull requests e releases](/contribuindo/pull-requests): como as versões são publicadas.
