---
description: Publique a spec no Rizoma a partir do Bitbucket Pipelines, Azure DevOps, Jenkins, CircleCI ou de qualquer pipeline, com curl, um script em shell ou PowerShell.
---

# Publicar por outros CIs

O hub não exige um CI específico: publicar é um `POST` com o arquivo da spec. Esta página traz o passo pronto para Bitbucket Pipelines, Azure DevOps Pipelines, Jenkins e CircleCI, dois scripts reutilizáveis (shell e PowerShell) e o formato JSON alternativo. É para quem mantém um serviço fora do GitHub Actions e do GitLab CI.

## Antes de começar

- O serviço já está cadastrado no hub. Se não estiver, veja [Do zero ao primeiro serviço](/receitas/primeiro-servico).
- Você tem `token:manage` e é do time responsável pelo serviço (ou tem `service:edit_any`).
- Os ambientes e as regras de branch estão configurados em **Configurações → Ambientes e sessões**. Veja [Ambientes por branch](/receitas/ambientes-por-branch).
- O agente do CI alcança o hub pela rede e tem `curl` 7.76 ou mais novo (por causa do `--fail-with-body`). Com um `curl` mais antigo, use o script do passo 3.
- A spec existe como arquivo ou é gerada antes do passo de publicação. Os comandos por framework estão em [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions).

## Passo a passo

### 1. Gere o token e guarde-o como segredo

1. No hub, abra **Tokens de CI** (grupo **Cadastros** do menu).
2. Clique em **Novo token**, escolha o **Serviço** (o campo começa vazio) e dê um **Nome do token** (por exemplo, `jenkins`). A **Validade (dias)** fica em **Detalhes opcionais**; o padrão é 90.
3. Clique em **Gerar token**, depois em **Copiar token**. O valor (`ahub_...`) só aparece uma vez, nesse modal.
4. Guarde o token como segredo do seu CI, com o nome `API_HUB_TOKEN`, e a URL do hub como variável comum, `API_HUB_URL` (`https://apihub.suaempresa.com`).

Um token vale para um serviço só: um repositório com vários serviços precisa de um token por serviço.

### 2. Adicione o passo de publicação

Cada CI expõe o commit e a branch com nomes diferentes. Use esta tabela para montar `commitSha` e `branch`:

| CI | Commit | Branch |
|---|---|---|
| Bitbucket Pipelines | `BITBUCKET_COMMIT` | `BITBUCKET_BRANCH` |
| Azure DevOps | `BUILD_SOURCEVERSION` | `BUILD_SOURCEBRANCH` (com `refs/heads/`; o hub aceita, ou remova o prefixo) |
| Jenkins (multibranch) | `GIT_COMMIT` | `BRANCH_NAME` |
| CircleCI | `CIRCLE_SHA1` | `CIRCLE_BRANCH` |

Com esses dois valores o hub descobre o ambiente pelas regras de branch. Sem branch (por exemplo, numa tag), informe `environment` na URL: `?environment=prod`.

#### Bitbucket Pipelines

Crie as variáveis em **Repository settings → Pipelines → Repository variables**. Marque **Secured** em `API_HUB_TOKEN`. No `bitbucket-pipelines.yml`:

```yaml
image: atlassian/default-image:4

definitions:
  steps:
    - step: &publicar-spec
        name: Publicar spec no Rizoma
        script:
          - |
            curl --fail-with-body -sS -o resposta.json -X POST \
              "${API_HUB_URL}/api/v1/specs?commitSha=${BITBUCKET_COMMIT}&branch=${BITBUCKET_BRANCH}" \
              -H "Authorization: Bearer ${API_HUB_TOKEN}" \
              -H "Content-Type: application/yaml" \
              --data-binary @openapi.yaml \
              || { echo "O Rizoma recusou a publicação:"; cat resposta.json; echo; exit 1; }
          - cat resposta.json

pipelines:
  branches:
    develop:
      - step: *publicar-spec
    homolog:
      - step: *publicar-spec
    "release/*":
      - step: *publicar-spec
    main:
      - step: *publicar-spec
```

#### Azure DevOps Pipelines

Em **Pipelines**, abra o pipeline, clique em **Edit → Variables → New variable** e crie `API_HUB_URL` e `API_HUB_TOKEN` (marque **Keep this value secret** no token). No `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop
      - homolog
      - release/*

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self

  - script: |
      curl --fail-with-body -sS -o resposta.json -X POST \
        "${API_HUB_URL}/api/v1/specs?commitSha=${BUILD_SOURCEVERSION}&branch=${BUILD_SOURCEBRANCH#refs/heads/}" \
        -H "Authorization: Bearer ${API_HUB_TOKEN}" \
        -H "Content-Type: application/yaml" \
        --data-binary @openapi.yaml \
        || { echo "O Rizoma recusou a publicação:"; cat resposta.json; echo; exit 1; }
      cat resposta.json
    displayName: Publicar spec no Rizoma
    env:
      API_HUB_URL: $(API_HUB_URL)
      API_HUB_TOKEN: $(API_HUB_TOKEN)
```

Variáveis secretas do Azure DevOps não viram variáveis de ambiente sozinhas: o bloco `env` é o que entrega o token ao script. Não use `Build.SourceBranchName`: ela guarda só o último trecho da branch (`release/1.4` vira `1.4`) e não casa com as regras.

#### Jenkins

Em **Manage Jenkins → Credentials**, adicione uma credencial do tipo **Secret text** com o ID `api-hub-token` e o token como valor. No `Jenkinsfile` de um Multibranch Pipeline:

```groovy
pipeline {
  agent any

  environment {
    API_HUB_URL   = 'https://apihub.suaempresa.com'
    API_HUB_TOKEN = credentials('api-hub-token')
  }

  stages {
    stage('Publicar spec no Rizoma') {
      when {
        anyOf {
          branch 'main'
          branch 'develop'
          branch 'homolog'
          branch 'release/*'
        }
      }
      steps {
        sh '''
          curl --fail-with-body -sS -o resposta.json -X POST \
            "${API_HUB_URL}/api/v1/specs?commitSha=${GIT_COMMIT}&branch=${BRANCH_NAME}" \
            -H "Authorization: Bearer ${API_HUB_TOKEN}" \
            -H "Content-Type: application/yaml" \
            --data-binary @openapi.yaml \
            || { echo "O Rizoma recusou a publicação:"; cat resposta.json; echo; exit 1; }
          cat resposta.json
        '''
      }
    }
  }
}
```

Use aspas simples triplas no `sh`, como acima: com aspas duplas o Groovy interpola o segredo no texto do comando e ele pode vazar para o log. Em um job que não é multibranch, `BRANCH_NAME` não existe e `GIT_BRANCH` vem como `origin/main`; remova o prefixo (`${GIT_BRANCH#origin/}`) ou informe `environment`.

#### CircleCI

Em **Project Settings → Environment Variables**, crie `API_HUB_URL` e `API_HUB_TOKEN`. No `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  publicar-spec:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - run:
          name: Publicar spec no Rizoma
          command: |
            curl --fail-with-body -sS -o resposta.json -X POST \
              "${API_HUB_URL}/api/v1/specs?commitSha=${CIRCLE_SHA1}&branch=${CIRCLE_BRANCH}" \
              -H "Authorization: Bearer ${API_HUB_TOKEN}" \
              -H "Content-Type: application/yaml" \
              --data-binary @openapi.yaml \
              || { echo "O Rizoma recusou a publicação:"; cat resposta.json; echo; exit 1; }
            cat resposta.json

workflows:
  publicar:
    jobs:
      - publicar-spec:
          filters:
            branches:
              only:
                - main
                - develop
                - homolog
                - /release\/.*/
```

### 3. Ou use um script reutilizável

Um script no repositório evita repetir o `curl` em cada CI e lê o status HTTP, o que também funciona com `curl` antigos. Salve como `scripts/publicar-spec.sh` e dê permissão de execução:

```sh
#!/usr/bin/env sh
# Publica uma spec OpenAPI no Rizoma.
# Uso: API_HUB_URL=... API_HUB_TOKEN=... [API_HUB_COMMIT=... API_HUB_BRANCH=... API_HUB_ENV=...] ./publicar-spec.sh openapi.yaml
set -eu

SPEC="${1:-openapi.yaml}"
: "${API_HUB_URL:?defina API_HUB_URL (ex.: https://apihub.suaempresa.com)}"
: "${API_HUB_TOKEN:?defina API_HUB_TOKEN}"

QUERY=""
add() { QUERY="${QUERY}${QUERY:+&}$1"; }
if [ -n "${API_HUB_COMMIT:-}" ]; then add "commitSha=${API_HUB_COMMIT}"; fi
if [ -n "${API_HUB_BRANCH:-}" ]; then add "branch=${API_HUB_BRANCH}"; fi
if [ -n "${API_HUB_ENV:-}" ]; then add "environment=${API_HUB_ENV}"; fi

RESPOSTA="$(mktemp)"
STATUS="$(curl -sS -o "$RESPOSTA" -w '%{http_code}' -X POST \
  "${API_HUB_URL%/}/api/v1/specs${QUERY:+?$QUERY}" \
  -H "Authorization: Bearer ${API_HUB_TOKEN}" \
  -H "Content-Type: application/yaml" \
  --data-binary @"$SPEC")"

cat "$RESPOSTA"; echo
rm -f "$RESPOSTA"

case "$STATUS" in
  200|201) echo "Rizoma: publicação concluída (HTTP $STATUS)." ;;
  *) echo "Rizoma: a publicação falhou (HTTP $STATUS)." >&2; exit 1 ;;
esac
```

Chame o script passando o commit e a branch do seu CI (veja a tabela do passo 2):

```bash
API_HUB_COMMIT="$CIRCLE_SHA1" API_HUB_BRANCH="$CIRCLE_BRANCH" ./scripts/publicar-spec.sh openapi.yaml
```

A versão para PowerShell (Windows, ou agentes com PowerShell 7) é equivalente. Salve como `scripts/publicar-spec.ps1`:

```powershell
param(
  [string]$Spec        = "openapi.yaml",
  [string]$Url         = $env:API_HUB_URL,
  [string]$Token       = $env:API_HUB_TOKEN,
  [string]$Commit      = $env:API_HUB_COMMIT,
  [string]$Branch      = $env:API_HUB_BRANCH,
  [string]$Environment = $env:API_HUB_ENV
)

$ErrorActionPreference = "Stop"
if (-not $Url -or -not $Token) { throw "Defina API_HUB_URL e API_HUB_TOKEN." }

$query = @()
if ($Commit)      { $query += "commitSha=$([uri]::EscapeDataString($Commit))" }
if ($Branch)      { $query += "branch=$([uri]::EscapeDataString($Branch))" }
if ($Environment) { $query += "environment=$([uri]::EscapeDataString($Environment))" }

$endpoint = "$($Url.TrimEnd('/'))/api/v1/specs"
if ($query.Count -gt 0) { $endpoint += "?" + ($query -join "&") }

try {
  $resposta = Invoke-RestMethod -Method Post -Uri $endpoint `
    -Headers @{ Authorization = "Bearer $Token" } `
    -ContentType "application/yaml" `
    -InFile $Spec
  $resposta | ConvertTo-Json -Depth 5
  Write-Host "Rizoma: publicação concluída ($($resposta.status))."
}
catch {
  $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
  [Console]::Error.WriteLine("Rizoma: a publicação falhou (HTTP $status). $($_.ErrorDetails.Message)")
  exit 1
}
```

Os dois scripts montam a query string sem codificar o nome da branch no shell. Se as branches do seu time têm `&`, `#`, `+`, `%` ou espaços, use o formato JSON, abaixo.

### 4. Use o formato JSON quando precisar

Além do arquivo cru, o hub aceita um envelope JSON com `Content-Type: application/json`:

| Campo | Obrigatório | Descrição |
|---|---|---|
| `spec` | sim | A spec, como objeto JSON ou como texto (YAML ou JSON dentro de uma string). |
| `commitSha` | não | Commit em hexadecimal, de 7 a 40 caracteres. Um valor fora desse formato devolve 422. |
| `branch` | não | Nome da branch, até 200 caracteres. |
| `environment` | não | Identificador do ambiente. Tem prioridade sobre a branch. |

Uma forma robusta de montar o envelope a partir de um arquivo YAML ou JSON é o `jq`, que cuida do escape de qualquer caractere:

```bash
jq -n --rawfile spec openapi.yaml \
  --arg commitSha "$GIT_COMMIT" \
  --arg branch "$BRANCH_NAME" \
  --arg environment "" \
  '{spec: $spec, commitSha: $commitSha, branch: $branch, environment: $environment}' \
| curl --fail-with-body -sS -X POST "$API_HUB_URL/api/v1/specs" \
    -H "Authorization: Bearer $API_HUB_TOKEN" \
    -H "Content-Type: application/json" \
    --data-binary @-
```

Um `environment` vazio é ignorado e o hub volta a usar a branch. Um envelope escrito à mão fica assim:

```bash
curl --fail-with-body -sS -X POST "$API_HUB_URL/api/v1/specs" \
  -H "Authorization: Bearer $API_HUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "spec": {
      "openapi": "3.1.0",
      "info": { "title": "Pedidos API", "version": "1.0.0" },
      "paths": { "/pedidos": { "get": { "responses": { "200": { "description": "OK" } } } } }
    },
    "commitSha": "3f2a9c1d8e",
    "branch": "release/1.4",
    "environment": "hml"
  }'
```

::: warning
Um arquivo de spec cru enviado com `Content-Type: application/json` é rejeitado com 422 (`Corpo inválido`), porque o hub procura o campo `spec`. Para o arquivo cru, use `application/yaml`, mesmo que seja JSON.
:::

## Como saber que deu certo

- O passo termina verde e a resposta impressa tem `"status": "published"` (HTTP 201) ou `"status": "unchanged"` (HTTP 200, spec idêntica à existente).
- No hub, o **Catálogo** mostra a pílula do ambiente, na coluna **Ambientes**, com a versão nova, e a aba **Documentação da API** do serviço mostra a versão com o marcador de atual.
- Em **Tokens de CI**, o **Último uso** do token foi atualizado.

Todos os status possíveis (201, 200, 401, 413, 422, 429) estão em [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions#como-saber-que-deu-certo).

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `curl: option --fail-with-body: is unknown` | O `curl` do agente é anterior à versão 7.76. Atualize-o ou use o script do passo 3. |
| 401 `Token ausente.` | A variável do token está vazia no passo. No Azure DevOps, falta o bloco `env`; no Jenkins, confira o ID da credencial. |
| 422 dizendo que a branch não corresponde a nenhum ambiente | Ajuste as regras em **Configurações → Ambientes e sessões**, ou envie `environment`. Em builds de tag ou de pull request, a branch não serve. |
| 422 `Corpo inválido` | Arquivo cru com `Content-Type: application/json`, ou envelope JSON sem `spec`, ou `commitSha` que não é hexadecimal de 7 a 40 caracteres. |
| Branch `release/1.4` chega como `1.4` | No Azure DevOps, use `BUILD_SOURCEBRANCH`, não `Build.SourceBranchName`. |
| Timeout ou conexão recusada | O agente não alcança o hub. Use um agente na rede interna. |

## Veja também

- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions): geração da spec por framework e tabela de respostas.
- [Publicar pelo GitLab CI](/receitas/publicar-pelo-gitlab-ci)
- [API HTTP](/referencia/api): referência do endpoint de publicação.
- [Extensão x-api-hub](/referencia/extensao-x-api-hub): dependências declaradas na spec.
