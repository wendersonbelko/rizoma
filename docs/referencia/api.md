---
description: Referência da API HTTP do Rizoma - publicação de specs pelo CI, sincronização agendada, health check e as rotas usadas pela interface.
---

# API HTTP

Esta página descreve todas as rotas HTTP do Rizoma: as que servem para automação (publicar specs, sincronizar, checar saúde) e as que existem só para a interface. É para quem escreve pipelines de CI, cron jobs e integrações. Para um passo a passo de CI, veja [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions).

O hub **não tem uma API pública de leitura**: as specs são consultadas pela interface. A API de automação serve para enviar specs e disparar sincronizações.

## Visão geral

| Rota | Quem chama | Autenticação | Resumo |
|---|---|---|---|
| `POST /api/v1/specs` | CI | Token de serviço (`ahub_...`) | Publica uma spec num ambiente |
| `POST /api/v1/sync` | Cron | Token gerado em Configurações | Sincroniza serviços que leem a spec de URL ou repositório |
| `POST /api/v1/hooks` | GitHub, GitLab ou Bitbucket | Segredo gerado em Configurações | Sincroniza o serviço do repositório que recebeu o push |
| `GET /api/health` | Docker, monitoramento | Nenhuma | Responde `{ "ok": true }` |
| `GET /api/services/{slug}/dotenv` | Navegador | Sessão | Baixa o `.env` de um ambiente, sem segredos |
| `GET /api/admin/audit` | Navegador | Sessão + `audit:read` | Exporta a auditoria em CSV |
| `/api/auth/*` | Navegador | Auth.js | Login, callback e logout |
| `/api/setup*` | Assistente | Mesma origem | Uso interno da instalação |

As rotas `/api/v1/*`, `/api/health`, `/api/auth/*` e `/api/setup*` não exigem cookie de sessão. Qualquer outra rota exige o cookie de sessão: sem ele, o hub redireciona para `/login`.

::: info Sem CORS
O hub não define cabeçalhos CORS. A API foi pensada para chamadas de servidor para servidor (CI, cron), não para o navegador de terceiros.
:::

## Autenticação por token de serviço

A publicação usa um **token por serviço**, no cabeçalho `Authorization`:

```http
Authorization: Bearer ahub_x7Kq...
```

Como o token funciona:

- Você gera o token em **Serviços e repositórios → Tokens**, com a permissão `token:manage`.
- O token aparece **uma única vez**. O banco guarda só o hash SHA-256.
- A validade é de 1 a 365 dias, obrigatória. Você pode revogar a qualquer momento.
- Um token publica **somente** no serviço a que pertence.
- Arquivar o serviço revoga todos os tokens dele. Restaurar o serviço não reativa os tokens.
- Cada uso atualiza a data de "último uso" do token.

Guarde o token como segredo do pipeline (por exemplo, `API_HUB_TOKEN`). Nunca o coloque no repositório.

## POST /api/v1/specs

Publica a spec de um serviço num ambiente. Aceita OpenAPI 3.0, 3.1 e Swagger 2.0, em JSON ou YAML, com até 5 MB. A spec precisa ter `info` e pelo menos um entre `paths`, `webhooks` ou `components`.

### Formatos de corpo

Há dois formatos. O hub escolhe pelo `Content-Type`: se contiver `application/json`, usa o formato 2; qualquer outro valor usa o formato 1.

**Formato 1: corpo cru (YAML ou JSON).** O corpo é a própria spec. Os metadados vão na query string.

```bash
curl --fail-with-body -sS -X POST \
  "https://apihub.suaempresa.com/api/v1/specs?branch=main&commitSha=$GITHUB_SHA" \
  -H "Authorization: Bearer $API_HUB_TOKEN" \
  -H "Content-Type: application/yaml" \
  --data-binary @openapi.yaml
```

**Formato 2: JSON com envelope.** Use `Content-Type: application/json` e o corpo `{ "spec": ..., ... }`.

```bash
curl --fail-with-body -sS -X POST "https://apihub.suaempresa.com/api/v1/specs" \
  -H "Authorization: Bearer $API_HUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "spec": { "openapi": "3.1.0", "info": { "title": "Pedidos", "version": "2.4.0" }, "paths": {} },
    "commitSha": "a1b2c3d",
    "branch": "main"
  }'
```

::: warning JSON cru com Content-Type application/json dá 422
Se o arquivo `openapi.json` for enviado com `Content-Type: application/json`, o hub espera o envelope `{ "spec": ... }` e responde 422 (`Corpo inválido`). Para enviar o JSON da spec sem envelope, use `Content-Type: application/yaml` (o JSON é um YAML válido) ou `text/plain`. Ou monte o envelope, por exemplo com `jq`:

```bash
jq -n --slurpfile spec openapi.json --arg sha "$GIT_SHA" --arg branch "$BRANCH" \
  '{ spec: $spec[0], commitSha: $sha, branch: $branch }' \
| curl --fail-with-body -sS -X POST "https://apihub.suaempresa.com/api/v1/specs" \
    -H "Authorization: Bearer $API_HUB_TOKEN" \
    -H "Content-Type: application/json" \
    --data-binary @-
```
:::

Use `--data-binary` (e não `-d`) para arquivos: o `-d` do curl remove quebras de linha e quebra YAML.

### Parâmetros e campos

| Nome | Formato 1 (query string) | Formato 2 (corpo JSON) | Descrição |
|---|---|---|---|
| `environment` | Sim | Sim (no corpo; a query string vale como padrão) | Slug do ambiente de destino. Se informado, tem prioridade sobre a branch |
| `branch` | Sim | Sim | Branch que originou a spec. Serve para descobrir o ambiente. Até 200 caracteres no formato 2 |
| `commitSha` | Sim | Sim | Commit da publicação. No formato 2 precisa ter de 7 a 40 caracteres hexadecimais |
| `spec` | (é o corpo) | Obrigatório | A spec como objeto JSON ou como texto (JSON ou YAML dentro de uma string) |

`branch` e `commitSha` são só informativos: aparecem no histórico de versões. No formato 2, uma `branch` na query string é ignorada; use o campo do corpo.

### Como o ambiente é escolhido

O hub decide o ambiente de destino nesta ordem:

1. **`environment` explícito.** Se o slug não existir, a resposta é 422 com a lista de ambientes.
2. **Regra de branch.** O primeiro ambiente, na ordem em que estão cadastrados, cuja regra casa com a branch. O prefixo `refs/heads/` é removido antes de comparar.
3. **Sem `environment` e sem `branch`.** O ambiente marcado como produção.

Se a branch não casar com nenhuma regra, a resposta é 422 com a lista de ambientes e regras (veja abaixo). Regras de branch usam glob: `*` casa um trecho sem barra, `**` casa qualquer coisa (inclusive barras) e `?` casa um caractere. Exemplos: `main`, `release/*`, `feature/**`, `hotfix-*`. Configure em **Configurações → Ambientes**; a receita [Ambientes por branch](/receitas/ambientes-por-branch) mostra exemplos.

### Limites

| Limite | Valor | Resultado ao passar |
|---|---|---|
| Tamanho da spec | 5 MB | 413 ou 422 (veja a nota) |
| Publicações por token | 30 por minuto | 429 |
| Formato aceito | OpenAPI 3.0/3.1, Swagger 2.0 | 422 |
| Aliases YAML | 100 | 422 |

::: info Sobre o 413
O hub responde 413 quando o cabeçalho `Content-Length` passa de 5 MB mais 64 KB. Um corpo entre 5 MB e esse teto, ou enviado sem `Content-Length` (chunked), é lido e recusado com 422 (`A spec passa de 5 MB.`). Nos dois casos, a spec não é salva.
:::

O limite de 30 por minuto é contado por token, em memória, numa janela de 60 segundos. Ele vale para toda requisição com token válido, mesmo que a spec seja recusada depois. Com várias instâncias do hub, cada uma conta separado.

### Respostas

| Status | Significado |
|---|---|
| `201` | Nova versão salva e marcada como a atual do ambiente (`status: "published"`) |
| `200` | Spec idêntica a uma versão já existente; nada foi criado (`status: "unchanged"`) |
| `401` | Token ausente, inválido, revogado ou expirado; ou serviço arquivado |
| `413` | Spec maior que 5 MB (pelo `Content-Length`) |
| `422` | Spec inválida, corpo inválido, ambiente inexistente ou branch sem ambiente |
| `429` | Mais de 30 publicações por minuto com o mesmo token |
| `500` | Erro interno (por exemplo, banco indisponível). Repita e confira os logs |

As respostas de erro são JSON no formato `{ "error": "mensagem" }`, com campos extras em alguns casos.

#### 201: publicada

```json
{
  "status": "published",
  "id": "cm1x2y3z40000abcd1234efgh",
  "version": "2.4.0",
  "environment": "prod",
  "unknownDependencies": ["fantasma"],
  "changeSummary": { "added": 1, "removed": 0, "changed": 2, "deprecated": 0, "breaking": false, "sample": [] }
}
```

- `id`: identificador da versão salva.
- `version`: o valor de `info.version` da spec (ou `0.0.0` se a spec não tiver). Não é um contador do hub.
- `environment`: slug do ambiente onde a versão foi gravada.
- `unknownDependencies`: slugs declarados em [`x-api-hub.dependsOn`](/referencia/extensao-x-api-hub) que não existem no hub. É uma lista vazia quando está tudo certo.
- `changeSummary`: o que mudou em relação à versão anterior do mesmo ambiente. `breaking` é verdadeiro quando algum path ou método foi removido. Nesse caso, se o SMTP está salvo, o hub envia e-mail para Owner e Admin ativos, para o time do serviço e para os times que dependem dele. Na primeira publicação o campo vem nulo. A resposta `unchanged` não traz resumo novo.

#### 200: sem mudança

```json
{
  "status": "unchanged",
  "id": "cm1x2y3z40000abcd1234efgh",
  "version": "2.4.0",
  "environment": "prod"
}
```

#### 401: token

```json
{ "error": "Token ausente." }
```

```json
{ "error": "Token inválido, revogado ou expirado." }
```

A primeira mensagem aparece quando o cabeçalho não existe ou o token não começa com `ahub_`. A segunda cobre token desconhecido, revogado, vencido ou de serviço arquivado.

#### 413: grande demais

```json
{ "error": "Spec maior que 5 MB." }
```

#### 422: recusada

Corpo JSON fora do formato do envelope:

```json
{ "error": "Corpo inválido. Esperado { spec, commitSha?, branch?, environment? }." }
```

Ambiente informado que não existe:

```json
{
  "error": "Ambiente \"hml2\" não existe.",
  "environments": [
    { "slug": "dev", "branches": ["develop", "feature/**"] },
    { "slug": "hml", "branches": ["release/*", "homolog"] },
    { "slug": "prod", "branches": ["main"] }
  ]
}
```

Branch que não casa com nenhum ambiente:

```json
{
  "error": "A branch \"experimento\" não corresponde a nenhum ambiente. Informe \"environment\" ou ajuste as regras em Configurações → Ambientes.",
  "environments": [
    { "slug": "dev", "branches": ["develop", "feature/**"] },
    { "slug": "hml", "branches": ["release/*", "homolog"] },
    { "slug": "prod", "branches": ["main"] }
  ]
}
```

Spec inválida. O campo `error` explica o motivo:

```json
{ "error": "Campo `openapi` (3.x) ou `swagger` (2.0) não encontrado." }
```

Estas são as mensagens possíveis para uma spec recusada:

| Mensagem | Causa |
|---|---|
| `A spec está vazia.` | Corpo vazio |
| `A spec passa de 5 MB.` | Corpo maior que 5 MB |
| `Não foi possível ler a spec: ...` | JSON ou YAML com erro de sintaxe (ou aliases demais) |
| `A spec precisa ser um objeto JSON/YAML.` | O documento não é um objeto |
| ``Campo `openapi` (3.x) ou `swagger` (2.0) não encontrado.`` | Não é OpenAPI 3.x nem Swagger 2.0 |
| ``Campo `info` ausente.`` | Falta o objeto `info` |
| ``A spec não tem `paths`, `webhooks` nem `components`.`` | Nada para documentar |

#### 429: limite

```json
{ "error": "Limite de 30 publicações por minuto." }
```

### Idempotência

O hub calcula um **checksum SHA-256** do conteúdo da spec já interpretada (o documento normalizado em JSON, sem comentários nem espaços do original). A chave de unicidade é serviço + ambiente + checksum. Na prática:

- Reenviar a mesma spec no mesmo ambiente **não cria versão nova** e devolve 200 `unchanged`. Um pipeline pode publicar a cada build sem poluir o histórico.
- Uma spec em YAML e a mesma em JSON produzem o mesmo checksum. Mudar a **ordem das chaves** conta como mudança.
- `branch` e `commitSha` não entram no checksum. Numa resposta `unchanged` eles não são atualizados.
- A mesma spec enviada para **outro ambiente** é uma publicação nova (201).
- Se você reenviar o conteúdo de uma versão antiga (que não é a atual), o hub responde 200 `unchanged` e essa versão volta a ser a atual do ambiente.
- Só a publicação nova (201) grava um evento na [auditoria](/admin/auditoria) (`spec.published`, com versão, ambiente, prefixo do token, commit e branch).

### Exemplos

**GitHub Actions**, publicando só a branch principal:

```yaml
- name: Publicar spec no Rizoma
  if: github.ref == 'refs/heads/main'
  run: |
    curl --fail-with-body -sS -X POST \
      "https://apihub.suaempresa.com/api/v1/specs?commitSha=${GITHUB_SHA}&branch=${GITHUB_REF_NAME}" \
      -H "Authorization: Bearer ${{ secrets.API_HUB_TOKEN }}" \
      -H "Content-Type: application/yaml" \
      --data-binary @openapi.yaml
```

**Forçando o ambiente**, sem depender de branch:

```bash
curl --fail-with-body -sS -X POST \
  "https://apihub.suaempresa.com/api/v1/specs?environment=hml" \
  -H "Authorization: Bearer $API_HUB_TOKEN" \
  -H "Content-Type: application/yaml" \
  --data-binary @openapi.yaml
```

**Lendo o resultado** para falhar o pipeline se houver dependência desconhecida:

```bash
resp=$(curl -sS -X POST "https://apihub.suaempresa.com/api/v1/specs?branch=main" \
  -H "Authorization: Bearer $API_HUB_TOKEN" \
  -H "Content-Type: application/yaml" --data-binary @openapi.yaml)
echo "$resp"
echo "$resp" | jq -e '(.unknownDependencies // []) | length == 0'
```

Mais cenários em [Publicar pelo GitLab CI](/receitas/publicar-pelo-gitlab-ci) e [Publicar por outros CIs](/receitas/publicar-por-outros-ci). Se algo der errado, consulte [Solução de problemas](/referencia/solucao-de-problemas).

## POST /api/v1/sync

Sincroniza, de uma vez, todos os serviços cuja origem da spec é **arquivo no repositório** ou **URL**. Foi pensado para um cron (Kubernetes CronJob, GitHub Actions agendado etc.). Serviços arquivados e serviços que recebem a spec por CI ou importação manual são ignorados.

O token é gerado em **Configurações → Repositórios**. A tela mostra o valor uma vez; o banco guarda só o hash. A variável `SYNC_TOKEN` não é lida.

```bash
curl -sS -X POST "https://apihub.suaempresa.com/api/v1/sync" \
  -H "Authorization: Bearer TOKEN_GERADO_NA_TELA"
```

### Resposta

```json
{
  "services": 2,
  "report": {
    "pedidos-api": [
      { "env": "dev", "status": "unchanged", "version": "2.5.0-dev.14" },
      { "env": "hml", "status": "published", "version": "2.5.0-rc.1" },
      { "env": "prod", "status": "error", "error": "O ambiente Produção não tem branch de leitura configurada." }
    ],
    "estoque-api": [
      { "env": "dev", "status": "unchanged", "version": "1.8.0" },
      { "env": "hml", "status": "unchanged", "version": "1.8.0" },
      { "env": "prod", "status": "unchanged", "version": "1.8.0" }
    ]
  }
}
```

- `services`: quantos serviços foram processados.
- `report`: um item por serviço (chave = slug), com uma linha por ambiente.
- `status` por ambiente: `published` (versão nova), `unchanged` (mesma spec) ou `error` (com o motivo em `error`).

A resposta é `200` mesmo quando algum ambiente falha: **confira o `report`**, não só o status HTTP. O motivo do último erro de cada serviço também aparece na página dele. Sem token gerado na tela, ou com o token errado, a resposta é `401` com `{ "error": "Não autorizado." }`.

Os serviços são processados em sequência (limite de 300 segundos por chamada). Cada sincronização gera um evento `spec.synced` na auditoria, sem autor (é o sistema). Para a versão manual, use o botão **Sincronizar agora** na página do serviço. Veja [Ler a spec do repositório](/receitas/spec-do-repositorio) e [Ler a spec de uma URL](/receitas/spec-por-url).

## GET /api/health

Devolve `{ "ok": true }` com status 200, sem autenticação:

```bash
curl -sS https://apihub.suaempresa.com/api/health
```

```json
{ "ok": true }
```

A rota só confirma que o processo está de pé: **não consulta o banco**. É o que o healthcheck da imagem Docker usa (a cada 30 segundos).

## GET /api/services/{slug}/dotenv

Baixa o `.env` de um serviço num ambiente. É o endpoint do botão de download da aba **Variáveis de ambiente**.

```text
GET /api/services/pedidos-api/dotenv?env=prod
```

| Item | Detalhe |
|---|---|
| Parâmetro | `env`: slug do ambiente (obrigatório) |
| Autenticação | Sessão do navegador (cookie). Com `curl`, seria preciso enviar o cookie de sessão |
| Permissão | `envvars:read` e visibilidade do serviço (`catalog:read`, mais time ou `catalog:read_private` se o serviço for "Só o time") |
| Resposta | Texto, com `Content-Disposition: attachment; filename="pedidos-api.prod.env"` e `Cache-Control: no-store` |
| Erros | `404` para tudo: sem sessão válida, serviço ou ambiente inexistente, sem permissão |
| Auditoria | Registra `envvar.exported`, com ambiente e quantidade de variáveis |

Os **segredos saem com o valor em branco**, precedidos de um comentário. As variáveis vêm em ordem alfabética:

```dotenv
# Pedidos API · Produção · gerado em 2026-09-29T12:00:00.000Z

# segredo: peça a quem mantém o serviço
DATABASE_URL=
LOG_LEVEL=info
PORT=3000
```

Veja também [Segredos, .env e cópia entre ambientes](/receitas/segredos-e-env).

## GET /api/admin/audit

Exporta a auditoria em CSV. É o link **Baixar CSV** da tela **Auditoria**.

| Item | Detalhe |
|---|---|
| Autenticação | Sessão + permissão `audit:read`. Sem isso, `404` |
| Filtros | Os mesmos da tela, na query string: `actor`, `group`, `from`, `to`, `target` |
| Limite | Até 10.000 linhas, das mais recentes para as mais antigas |
| Formato | CSV UTF-8 com BOM, `Content-Disposition: attachment; filename="auditoria-AAAA-MM-DD.csv"` |
| Auditoria da exportação | Cada exportação registra `audit.exported` |

Filtros aceitos:

| Parâmetro | Descrição | Exemplo |
|---|---|---|
| `actor` | Pessoa: usuário do GitHub ou e-mail | `actor=fulano@suaempresa.com` |
| `group` | Tipo de evento, pelo prefixo da ação: `auth.`, `access.`, `user.`, `team.`, `service.`, `link.`, `repository.`, `token.`, `spec.`, `settings.`, `owner.`, `setup.` | `group=spec.` |
| `from`, `to` | Período, datas `AAAA-MM-DD` (inclusive) | `from=2026-09-01&to=2026-09-30` |
| `target` | Identificador do alvo do evento | `target=cm1x2y3z4...` |

Colunas do CSV: `quando`, `quem`, `acao`, `alvo_tipo`, `alvo_id`, `ip`, `detalhes`. A coluna `detalhes` traz o JSON de metadados do evento. Células que começam com `=`, `+`, `-`, `@`, tabulação ou retorno de carro ganham um apóstrofo na frente, para que planilhas não as interpretem como fórmula.

Nenhum valor de variável, cabeçalho de integração ou segredo entra na auditoria. Mais em [Auditoria](/admin/auditoria).

## /api/auth/*

Rotas padrão do Auth.js v5: início do login por provedor, callback, logout, sessão e token CSRF. A tela de login do hub inicia o login por uma Server Action, então você raramente as chama direto.

O que importa para a instalação é a **URL de callback** de cada provedor:

| Provedor | Identificador | URL de callback |
|---|---|---|
| GitHub | `github` | `https://apihub.suaempresa.com/api/auth/callback/github` |
| Google | `google` | `https://apihub.suaempresa.com/api/auth/callback/google` |
| Microsoft | `microsoft-entra-id` | `https://apihub.suaempresa.com/api/auth/callback/microsoft-entra-id` |
| GitLab | `gitlab` | `https://apihub.suaempresa.com/api/auth/callback/gitlab` |
| Facebook | `facebook` | `https://apihub.suaempresa.com/api/auth/callback/facebook` |
| OIDC (Keycloak, Okta, Auth0) | `oidc` | `https://apihub.suaempresa.com/api/auth/callback/oidc` |

A base da URL vem da variável `AUTH_URL`. A tela **Configurações → Formas de login** mostra a URL pronta para copiar. Se o provedor reclamar de `redirect_uri`, veja [Solução de problemas](/referencia/solucao-de-problemas). Detalhes de cada provedor em [Provedores de login](/instalacao/provedores-de-login).

## /api/setup*

Rotas internas do [assistente de instalação](/instalacao/assistente). Não são uma API estável e não servem para automação.

| Rota | Função |
|---|---|
| `GET /api/setup` | Estado do assistente (etapa atual, dados já salvos sem segredos, log da instalação). Depois de instalado, responde só `{ "installed": true }` |
| `POST /api/setup` | Salva os dados de uma etapa: `{ "step": "...", "data": { ... } }` |
| `GET /api/setup/database` | Status da etapa "Banco de dados": alcançabilidade, motores e migrations aplicadas. Responde `404` depois de instalado |
| `POST /api/setup/database` | Testa uma conexão candidata, sem aplicá-la ao processo em execução |

Respostas de `POST /api/setup`:

| Status | Quando |
|---|---|
| `200` | Etapa salva (`{ "ok": true }`). No passo do administrador por provedor, `{ "ok": true, "needsSignIn": true }` até a pessoa entrar |
| `400` | Etapa desconhecida, etapa pulada ou regra de negócio (por exemplo, "Falta concluir: ...") |
| `403` | A requisição não veio da própria página do hub (checagem de mesma origem) |
| `409` | O hub já está instalado, ou o OWNER já foi definido |
| `422` | Dados inválidos |

`POST /api/setup/database` limita a 20 tentativas a cada 5 minutos (`429` depois disso) e só aceita PostgreSQL por enquanto. Se a conexão funcionar, devolve `{ "ok": true, "envSnippet": "DATABASE_URL=\"...\"" }`: cole o trecho no `.env` e reinicie o servidor.

## Veja também

- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions)
- [Extensão x-api-hub](/referencia/extensao-x-api-hub)
- [Segurança](/referencia/seguranca)
- [Ingestão de specs (arquitetura)](/arquitetura/ingestao-de-specs)
