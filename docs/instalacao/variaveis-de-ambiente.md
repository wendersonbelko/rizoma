---
description: Tabela completa das variáveis de ambiente do Rizoma, o que cada uma faz, onde cada processo lê o .env, como gerar as chaves e o que acontece se você trocar ENCRYPTION_KEY ou AUTH_SECRET.
---

# Variáveis de ambiente

Esta página é a referência de todas as variáveis de ambiente do Rizoma: quais são obrigatórias, o valor padrão, um exemplo e para que servem. Ela serve a quem instala e a quem opera o hub, e traz também onde cada processo lê o `.env`, como gerar as chaves e o que muda quando você troca uma delas.

## Tabela completa

| Nome | Obrigatória | Padrão | Exemplo | Para que serve |
|---|---|---|---|---|
| `DATABASE_URL` | Sim | Nenhum (o `.env.example` traz `postgresql://apihub:apihub@localhost:5432/apihub?schema=public`) | `postgresql://apihub:SENHA@postgres:5432/apihub?schema=public` | Conexão com o PostgreSQL. |
| `ENCRYPTION_KEY` | Sim | Nenhum | `Yx3...=` (32 bytes em base64) | Cifra os segredos guardados no banco (AES-256-GCM). |
| `AUTH_SECRET` | Sim | Nenhum | `dF1q...` | Segredo do Auth.js: assina e cifra os cookies de sessão e os tokens de CSRF. |
| `AUTH_URL` | Sim em produção | Nenhum (o `.env.example` traz `http://localhost:3000`) | `https://apihub.suaempresa.com` | URL pública do hub. Base das URLs de callback, dos links de convite e da checagem de origem do assistente. |
| `AUTH_TRUST_HOST` | Recomendada | Nenhum (o `.env.example` traz `"true"`) | `true` | Convenção do Auth.js para aceitar o host vindo do proxy. |
| `SYNC_TOKEN` | Não use | — | — | O token do cron é gerado em **Configurações → Repositórios**, não nesta variável. |
| `NEXT_PUBLIC_DOCS_URL` | Não | `https://wendersonbelko.github.io/rizoma` | `https://docs.suaempresa.com` | Base dos links "Como configurar o CI" da interface. Lida **no build**. |
| `POSTGRES_PASSWORD` | Não | `apihub` | saída de `openssl rand -hex 24` | Senha do PostgreSQL do Compose. |
| `TEST_DATABASE_URL` | Só nos testes | Nenhum | `postgresql://apihub:apihub@localhost:5432/apihub_test` | Banco dos testes de integração. **As tabelas são truncadas.** |
| `DOCS_REPO` | Só no build da documentação | `wendersonbelko/rizoma` | `minha-org/rizoma` | Repositório do GitHub usado nos links e no caminho do site. |
| `DOCS_BASE` | Só no build da documentação | `/<nome-do-repositório>/` | `/` | Caminho base do site da documentação (`/` para domínio próprio). |

Além dessas, a imagem Docker do app define `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0` e `NEXT_TELEMETRY_DISABLED=1`. Você não precisa configurá-las.

## Exemplo de `.env` de produção

```bash
POSTGRES_PASSWORD=cole-aqui-o-resultado-de-openssl-rand-hex-24

ENCRYPTION_KEY="cole-aqui"
AUTH_SECRET="cole-aqui"

AUTH_URL="https://apihub.suaempresa.com"
AUTH_TRUST_HOST="true"
```

Com o Compose padrão, a `DATABASE_URL` do `.env` é ignorada (ela é sobrescrita). Ela só importa se você usar um banco gerenciado ou rodar sem Compose. Veja [Produção com Docker](/instalacao/docker).

## Detalhes de cada variável

### `DATABASE_URL`

Formato: `postgresql://usuario:senha@host:porta/banco?schema=public`.

- Caracteres especiais na senha precisam de codificação de URL (`@` vira `%40`).
- Para exigir SSL, acrescente `&sslmode=require`.
- Só PostgreSQL 16 ou superior funciona hoje.
- O app e os scripts a leem em tempo de execução. O Prisma a usa também para aplicar as migrações.
- **No Compose padrão, o `migrate` e o `web` recebem outra `DATABASE_URL`**, montada com `POSTGRES_PASSWORD` e apontando para o container `postgres`. A do `.env` não vale nesse caso.

### `ENCRYPTION_KEY`

Uma chave de **32 bytes codificada em base64** (44 caracteres). O app recusa valores com outro tamanho ("ENCRYPTION_KEY precisa ter 32 bytes em base64."). Ela cifra com AES-256-GCM:

- o Client secret de cada forma de login;
- o token de leitura das integrações de repositório;
- os cabeçalhos usados na leitura de specs por URL (por exemplo, `Authorization`);
- o valor das variáveis marcadas como segredo;
- os tokens OAuth do GitHub de cada pessoa.

A chave **nunca vai para o banco**. Ela existe só no ambiente do app. Veja [o que acontece se você trocá-la](#o-que-acontece-se-trocar-as-chaves).

### `AUTH_SECRET`

O segredo que o Auth.js usa para assinar e cifrar as sessões (JWT) e os tokens de CSRF. Gere um valor aleatório e longo (o gerador de chaves produz 32 bytes em base64url). Sem ele, o login não funciona.

### `AUTH_URL`

A URL pública do hub, com `https://` e **sem barra no final**. Ela é usada para:

- montar a URL de callback de cada provedor de login (mostrada na tela);
- gerar os links de convite (`/invite/...`) e de nova senha (`/reset-password/...`);
- aceitar o host do assistente de instalação atrás de um proxy (checagem de mesma origem);
- gerar o link de nova senha do `pnpm admin:recover --reset-password`.

Em produção, se ela ficar em `http://localhost:3000`, os provedores recusam o login. Veja [HTTPS com proxy reverso](/instalacao/proxy-https).

### `AUTH_TRUST_HOST`

Convenção do Auth.js para confiar no host informado pelo proxy. O hub já ativa `trustHost` no próprio código de autenticação, então a variável funciona como redundância explícita. Mantenha `"true"`, como no `.env.example`.

### `SYNC_TOKEN`

Não é mais lida. O token de `POST /api/v1/sync` é gerado em **Configurações → Repositórios** e só o hash fica no banco. Copie o valor na hora em que a tela o mostra. O botão **Sincronizar agora** de cada serviço não depende dele.

### `NEXT_PUBLIC_DOCS_URL`

Define a base dos links "Como configurar o CI", que aparecem na página do serviço e na aba **Tokens**. Por padrão apontam para `https://wendersonbelko.github.io/rizoma`, o site desta documentação publicado no GitHub Pages.

::: warning Ela é lida no build, não na execução
O prefixo `NEXT_PUBLIC_` faz o Next.js gravar o valor no código quando o app é construído. Em desenvolvimento, ela vale a partir do `apps/web/.env`. Na imagem Docker, o `.env` fica fora do contexto de build e o Dockerfile não repassa essa variável, então defini-la no `.env` **não** muda os links de uma imagem construída assim. Para usar outro endereço, passe a variável no build. Um exemplo de ajuste (não faz parte do repositório):

```dockerfile
# no estágio "build" do Dockerfile, antes do RUN que roda o build do Next.js
ARG NEXT_PUBLIC_DOCS_URL
ENV NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL
```

```yaml
# no docker-compose.yml, no serviço web
build: { context: ., target: runner, args: { NEXT_PUBLIC_DOCS_URL: "https://docs.suaempresa.com" } }
```
:::

### `POSTGRES_PASSWORD`

Usada só pelo Compose: define a senha do usuário `apihub` do container `postgres` e entra na `DATABASE_URL` que o Compose monta para o `migrate` e o `web`. Use letras e números. Ela vale **na primeira criação do volume**: mudar depois não altera a senha do banco existente (veja [Produção com Docker](/instalacao/docker)).

### `TEST_DATABASE_URL`

Usada só pelos testes de integração (`pnpm test:integration`). **O banco apontado é truncado.** Use sempre um banco separado. Veja [Testes](/contribuindo/testes).

### `DOCS_REPO` e `DOCS_BASE`

Usadas só para construir o site desta documentação (`pnpm docs:build`). `DOCS_REPO` (`dono/nome`) define o link do GitHub e o caminho do site no GitHub Pages. `DOCS_BASE` sobrescreve o caminho, e `/` serve para domínio próprio. Veja [Esta documentação](/contribuindo/documentacao).

## Onde cada processo lê o `.env`

O mesmo arquivo `.env` da raiz não é lido por todo mundo. Cada processo tem o seu lugar:

| Processo | Comandos | De onde lê |
|---|---|---|
| Next.js em desenvolvimento | `pnpm dev` | `apps/web/.env` |
| Prisma e scripts do banco | `pnpm db:deploy`, `pnpm db:migrate`, Prisma Studio, `pnpm admin:recover`, `pnpm demo:seed` | `packages/db/.env` |
| Docker Compose (substituição de `${...}`) | `docker compose ...` | `.env` da raiz e o ambiente do shell |
| Containers `migrate` e `web` | `docker compose --profile app ...` | `env_file: .env` da raiz. Os valores de `environment` do compose (a `DATABASE_URL`) prevalecem |
| App sem Compose | `docker run ...` | `--env-file` ou `-e`. O `--env-file` **não remove aspas**: escreva os valores sem elas |
| Testes de integração | `pnpm test:integration` | O ambiente do shell (`TEST_DATABASE_URL`) |
| Documentação | `pnpm docs:build` | O ambiente do shell (`DOCS_REPO`, `DOCS_BASE`) |

Em desenvolvimento, por isso, você copia o `.env` para `apps/web` e `packages/db` (veja [Desenvolvimento local](/instalacao/desenvolvimento-local)). O `.env` e os arquivos `.env.*` (menos o `.env.example`) já estão no `.gitignore` e no `.dockerignore`, então não vão para o Git nem para a imagem. Mantenha o arquivo com permissão restrita (`chmod 600 .env`).

## Como gerar as chaves

Com o Node instalado, na raiz do repositório:

```bash
node scripts/generate-keys.mjs    # ou: pnpm setup:keys
```

O comando **imprime** duas linhas e não altera nenhum arquivo:

```text
ENCRYPTION_KEY="..."   # 32 bytes aleatórios em base64
AUTH_SECRET="..."      # 32 bytes aleatórios em base64url
```

Cole cada valor no `.env`. As alternativas com `openssl`:

```bash
openssl rand -base64 32    # ENCRYPTION_KEY (44 caracteres)
openssl rand -base64 32    # AUTH_SECRET
openssl rand -hex 24       # POSTGRES_PASSWORD
```

Gere **valores novos para cada ambiente**. Nunca reaproveite as chaves de desenvolvimento em produção.

## O que acontece se trocar as chaves

### `ENCRYPTION_KEY`

Trocar a chave (ou perdê-la) **não é reversível** pelo hub: não existe um comando de rotação, e os dados cifrados com a chave antiga não podem ser lidos com a nova. O que acontece, segundo o código:

| O que estava cifrado | Efeito |
|---|---|
| Tokens OAuth do GitHub das pessoas | Só forçam **um novo login**. O hub trata o token ilegível como inválido |
| Valor das variáveis marcadas como segredo | Ficam **ilegíveis**. Revelar um segredo dá erro. Os valores continuam no banco e voltam a funcionar se você restaurar a chave original |
| Token das integrações de repositório e cabeçalhos de leitura por URL | A leitura e a sincronização passam a falhar |
| Client secret das formas de login | O hub decifra esses secrets ao montar a configuração de login. Com a chave errada, essa etapa falha e o login por esses provedores **deixa de funcionar** (e, com ele, as páginas que dependem da sessão) até você restaurar a chave |

Em resumo: **guarde a `ENCRYPTION_KEY` junto com o backup do banco**, em local seguro. Um backup sem a chave perde o valor dos segredos. Se a chave foi perdida de vez, não há caminho suportado de recuperação: seria preciso intervir no banco e cadastrar os segredos de novo. Veja [Atualização e backup](/instalacao/atualizacao-e-backup).

### `AUTH_SECRET`

Trocar o `AUTH_SECRET` **invalida todas as sessões**: cada pessoa precisa entrar de novo. Nada é perdido no banco. Convites, links de nova senha e tokens de publicação continuam valendo. É uma troca segura, e útil depois de um incidente. Para derrubar as sessões sem reiniciar o app, use **Encerrar todas as sessões** em **Configurações → Sessões e recuperação**.

### `AUTH_URL`

Trocar o `AUTH_URL` muda as URLs de callback. Atualize a callback em **todos** os provedores de login, senão o login falha por URL de retorno inválida. Links de convite e de nova senha já gerados continuam válidos, mas passam a ser montados com a nova URL nos próximos.

### Token do cron

O token de `POST /api/v1/sync` não fica no `.env`. Gere outro em **Configurações → Repositórios** e atualize o agendador. O valor anterior deixa de valer.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "ENCRYPTION_KEY não definida." | Variável ausente no processo que falhou | Confira o `.env` da pasta certa (veja a tabela de onde cada processo lê) |
| "ENCRYPTION_KEY precisa ter 32 bytes em base64." | Valor com aspas erradas, cortado, ou gerado com outro tamanho | Gere de novo com `node scripts/generate-keys.mjs` |
| Erro de `MissingSecret` no login | `AUTH_SECRET` vazio | Preencha e reinicie |
| Mudei o `.env` e nada mudou | Cópia esquecida ou processo não reiniciado | Copie para `apps/web` e `packages/db` (dev) ou recrie o container |
| `/api/v1/sync` responde `401` | Token ainda não gerado na tela, ou diferente do enviado | Gere o token em **Configurações → Repositórios** e confira o cabeçalho `Authorization: Bearer ...` |

## Veja também

- [Produção com Docker](/instalacao/docker): o `.env` de produção e o Compose.
- [Desenvolvimento local](/instalacao/desenvolvimento-local): as três cópias do `.env`.
- [Atualização e backup](/instalacao/atualizacao-e-backup): guarde as chaves com o backup.
- [Segurança](/referencia/seguranca): como os segredos são protegidos.
