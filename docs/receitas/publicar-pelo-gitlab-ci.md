---
description: Publique a spec OpenAPI de um serviço no Rizoma a cada push com GitLab CI, usando variáveis mascaradas e regras por branch.
---

# Publicar pelo GitLab CI

Esta receita adiciona um job ao `.gitlab-ci.yml` que envia a spec OpenAPI do serviço para o hub a cada push nas branches que você escolher. O ambiente é descoberto pela branch. É para quem mantém um serviço num projeto do GitLab (gitlab.com ou instalação própria).

## Antes de começar

- O serviço já está cadastrado no hub. Se não estiver, veja [Do zero ao primeiro serviço](/receitas/primeiro-servico).
- Você tem `token:manage` e é do time responsável pelo serviço (ou tem `service:edit_any`), para gerar o token.
- Você é Maintainer do projeto no GitLab (é preciso para criar variáveis de CI).
- Os ambientes e as regras de branch estão configurados em **Configurações → Ambientes**. Veja [Ambientes por branch](/receitas/ambientes-por-branch).
- O runner alcança o hub pela rede. Se o hub só abre na rede interna, use um runner registrado dentro dela.
- A spec existe como arquivo (`openapi.yaml` ou `openapi.json`) ou é gerada num job anterior.

## Passo a passo

### 1. Gere o token de publicação

1. No hub, abra **Serviços e repositórios → Tokens**.
2. Clique em **Novo token**, escolha o **Serviço**, dê um **Nome** (`gitlab-ci`) e defina a **Validade (dias)**, de 1 a 365.
3. Clique em **Gerar token** e copie o valor (`ahub_...`). Ele só aparece uma vez.

### 2. Crie as variáveis de CI

No projeto, abra **Settings → CI/CD → Variables** e clique em **Add variable** duas vezes:

| Chave | Valor | Opções |
|---|---|---|
| `API_HUB_TOKEN` | o token do passo 1 | Marque a variável como mascarada (**Mask variable**, ou o nível de visibilidade que esconde o valor nos logs). |
| `API_HUB_URL` | `https://apihub.suaempresa.com` | Nenhuma. A URL não é segredo. |

::: warning
Se você marcar **Protect variable**, a variável só chega a pipelines de branches e tags protegidas. Uma branch como `develop` ou `release/1.4` que não seja protegida recebe o token vazio e o hub responde 401. Proteja essas branches ou desmarque a opção.
:::

Um token vale para um serviço só. Num repositório com vários serviços, crie uma variável por token (`API_HUB_TOKEN_PEDIDOS`, `API_HUB_TOKEN_ESTOQUE`) e um job por serviço.

### 3. Adicione o job ao `.gitlab-ci.yml`

```yaml
stages:
  - publicar

publicar-spec:
  stage: publicar
  image:
    name: curlimages/curl:8.10.1
    entrypoint: [""]
  rules:
    - if: '$CI_COMMIT_BRANCH =~ /^(main|develop|homolog|release\/.+)$/'
  script:
    - |
      curl --fail-with-body -sS -o resposta.json -X POST \
        "${API_HUB_URL}/api/v1/specs?commitSha=${CI_COMMIT_SHA}&branch=${CI_COMMIT_REF_NAME}" \
        -H "Authorization: Bearer ${API_HUB_TOKEN}" \
        -H "Content-Type: application/yaml" \
        --data-binary @openapi.yaml \
        || { echo "O Rizoma recusou a publicação:"; cat resposta.json; echo; exit 1; }
    - cat resposta.json
```

Como funciona:

- `rules` limita o job às branches listadas. `CI_COMMIT_BRANCH` só existe em pipelines de branch, então pipelines de merge request não publicam.
- `CI_COMMIT_SHA` e `CI_COMMIT_REF_NAME` viram `commitSha` e `branch`. O hub usa a branch para achar o ambiente e guarda os dois na versão.
- `--fail-with-body` faz o `curl` falhar em qualquer HTTP 4xx ou 5xx sem perder o corpo, e o `|| { ...; exit 1; }` imprime a resposta do hub e derruba o job. Uma spec inválida, um token vencido ou uma branch sem ambiente (422) quebram o pipeline.
- `Content-Type: application/yaml` serve para YAML e para JSON: o hub detecta o formato pelo conteúdo.
- O `entrypoint: [""]` é necessário porque a imagem do `curl` define um entrypoint próprio e o GitLab precisa de um shell. Se o seu job já usa outra imagem com `curl`, mantenha a sua.

Com as regras de branch do exemplo (`develop` em `dev`, `release/*` e `homolog` em `hml`, `main` em `prod`), cada push cai no ambiente certo sem mais nenhuma configuração.

### 4. Gere a spec no build (se ela nasce do código)

Deixe um job anterior produzir o arquivo como artefato. Os comandos por framework (NestJS, FastAPI, Spring Boot, ASP.NET Core) estão no passo 4 de [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions) e servem igual aqui. Use as mesmas regras nos dois jobs: um `needs` para um job que não entra no pipeline faz o GitLab recusar o pipeline.

```yaml
stages:
  - build
  - publicar

.branches-publicaveis:
  rules:
    - if: '$CI_COMMIT_BRANCH =~ /^(main|develop|homolog|release\/.+)$/'

gerar-spec:
  extends: .branches-publicaveis
  stage: build
  script:
    - ./scripts/gerar-openapi.sh   # o comando do seu framework; deve escrever openapi.json
  artifacts:
    paths:
      - openapi.json
    expire_in: 1 day

publicar-spec:
  extends: .branches-publicaveis
  stage: publicar
  needs: [gerar-spec]
  image:
    name: curlimages/curl:8.10.1
    entrypoint: [""]
  script:
    - |
      curl --fail-with-body -sS -o resposta.json -X POST \
        "${API_HUB_URL}/api/v1/specs?commitSha=${CI_COMMIT_SHA}&branch=${CI_COMMIT_REF_NAME}" \
        -H "Authorization: Bearer ${API_HUB_TOKEN}" \
        -H "Content-Type: application/yaml" \
        --data-binary @openapi.json \
        || { echo "O Rizoma recusou a publicação:"; cat resposta.json; echo; exit 1; }
    - cat resposta.json
```

### 5. Force o ambiente em tags (opcional)

Numa tag, `CI_COMMIT_REF_NAME` é o nome da tag e não casa com nenhuma regra de branch. Informe o ambiente explicitamente com `environment`, que tem prioridade sobre a branch:

```yaml
publicar-spec-release:
  stage: publicar
  image:
    name: curlimages/curl:8.10.1
    entrypoint: [""]
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v\d+/'
  variables:
    API_HUB_ENV: prod
  script:
    - |
      curl --fail-with-body -sS -o resposta.json -X POST \
        "${API_HUB_URL}/api/v1/specs?environment=${API_HUB_ENV}&commitSha=${CI_COMMIT_SHA}&branch=${CI_COMMIT_REF_NAME}" \
        -H "Authorization: Bearer ${API_HUB_TOKEN}" \
        -H "Content-Type: application/yaml" \
        --data-binary @openapi.yaml \
        || { echo "O Rizoma recusou a publicação:"; cat resposta.json; echo; exit 1; }
    - cat resposta.json
```

`API_HUB_ENV` é o identificador do ambiente (`prod`, `hml`), não o nome de exibição. Com **Protect variable** ligada, proteja também as tags `v*`.

### 6. Declare dependências na spec (opcional)

Para o mapa mostrar de quem o serviço depende, acrescente na raiz da spec:

```yaml
x-api-hub:
  dependsOn: [estoque-api, pagamentos-api]
```

Cada slug vira uma ligação **consome a API de**. Slugs desconhecidos voltam em `unknownDependencies`. Veja [Mapear dependências](/receitas/mapear-dependencias).

## Como saber que deu certo

- O job termina verde e o log termina com o JSON `"status": "published"` (HTTP 201) ou `"status": "unchanged"` (HTTP 200, spec idêntica à já publicada).
- No hub, o **Catálogo** mostra o selo do ambiente com a versão nova. Na aba **Documentação da API** do serviço, a versão aparece com o marcador de atual.
- Em **Serviços e repositórios → Tokens**, o **Último uso** do token foi atualizado.

A tabela completa de respostas (201, 200, 401, 413, 422, 429) está em [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions#como-saber-que-deu-certo).

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| 401 `Token ausente.` | A variável `API_HUB_TOKEN` está vazia no job. Se ela é protegida, a branch ou a tag também precisa ser protegida. |
| 401 com token inválido, revogado ou expirado | Gere outro token e atualize a variável. Arquivar o serviço revoga os tokens dele. |
| 422 dizendo que a branch não corresponde a nenhum ambiente | Ajuste as regras em **Configurações → Ambientes** ou use `environment`. A resposta lista os ambientes e as regras. |
| 422 `Corpo inválido` | Você enviou o arquivo com `Content-Type: application/json`. Use `application/yaml` para o arquivo cru. |
| O pipeline não roda o job | A branch não casa com a regra de `rules`, ou é um pipeline de merge request (`CI_COMMIT_BRANCH` fica vazio). |
| `needs` recusado ao criar o pipeline | Os dois jobs precisam das mesmas `rules`. |
| Timeout ou conexão recusada | O runner não alcança o hub. Use um runner na rede interna. |

## Veja também

- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions): geração da spec por framework e tabela de respostas.
- [Publicar por outros CIs](/receitas/publicar-por-outros-ci)
- [Tirar o /docs público do ar](/receitas/tirar-docs-do-ar)
- [Ambientes por branch](/receitas/ambientes-por-branch)
