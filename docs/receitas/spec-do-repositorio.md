---
description: Faça o Rizoma ler o arquivo openapi.yaml direto do repositório (GitHub, GitLab ou Bitbucket), por ambiente, sob demanda ou agendado.
---

# Ler a spec do repositório

Nesta receita o hub busca o arquivo da spec (por exemplo, `openapi.yaml`) direto no repositório do serviço, na branch de cada ambiente, sem nenhum passo no CI. É para times que já versionam a spec no repositório e preferem que o hub a leia a configurar um pipeline. A origem no serviço se chama **Arquivo no repositório**.

## Antes de começar

- A spec está commitada no repositório (por exemplo, `openapi.yaml` ou `docs/openapi.yaml`), em OpenAPI 3.0/3.1 ou Swagger 2.0, JSON ou YAML, com até 5 MB.
- O repositório está no GitHub, GitLab ou Bitbucket. Repositórios cadastrados como **Outro** (URL direta) não podem ser lidos pelo hub.
- Quem faz cada passo precisa de permissões diferentes:

| Passo | Permissão |
|---|---|
| Configurar a integração e as branches de leitura | `settings:manage` (por padrão, só o OWNER) |
| Cadastrar o repositório | `link:edit` |
| Apontar o serviço para o arquivo | `service:edit` e ser do time do serviço |
| Sincronizar agora | `spec:publish` e ser do time do serviço |

- Um token só de leitura do provedor (passo 1).
- Para agendar a leitura (passo 6), o token gerado em **Configurações → Repositórios**.

::: info
O hub lê o repositório sob demanda (**Sincronizar agora**) ou agendado (`POST /api/v1/sync`). Ainda não existe leitura disparada por push (webhook): isso está no [roadmap](/arquitetura/roadmap). Se você precisa que a spec apareça a cada deploy, use o [CI](/receitas/publicar-pelo-github-actions).
:::

## Passo a passo

### 1. Configure a integração do provedor

1. Abra **Configurações → Repositórios**.
2. Marque o provedor (**GitHub**, **GitLab** ou **Bitbucket**).
3. Em **Token de leitura**, cole um token só de leitura:

| Provedor | Token |
|---|---|
| GitHub | Token fine-grained com acesso aos repositórios que terão spec lida e permissão de leitura em **Contents** e **Metadata**. |
| GitLab | Project ou Group access token com os escopos `read_repository` e `read_api`. |
| Bitbucket | Access token de repositório ou workspace com leitura. |

4. Para GitLab de instalação própria, informe também a **URL (só para instalação própria)**, por exemplo `https://gitlab.suaempresa.com`.
5. Clique em **Salvar repositórios**.

O hub confere o token no provedor antes de salvar e recusa um token rejeitado. O token é guardado cifrado e, ao editar, deixá-lo em branco mantém o atual. Desmarcar um provedor remove a integração dele.

### 2. Cadastre o repositório

1. Abra **Serviços e repositórios → Repositórios**.
2. Clique em **Novo repositório**, escolha em **Onde está** o provedor e informe o **Repositório** no formato `SEU-ORG/pedidos-api` (no GitLab, subgrupos valem: `backend/pagamentos/pix-api`).
3. Clique em **Adicionar**.

O hub só cadastra o repositório se o token enxergar ele.

### 3. Defina a branch de leitura de cada ambiente

A branch de leitura diz de qual branch o arquivo é lido em cada ambiente.

1. Abra **Configurações → Ambientes**.
2. Em cada ambiente, preencha **Branch de leitura**. Exemplo: `dev` lê `develop`, `hml` lê `homolog` e `prod` lê `main`.
3. Clique em **Salvar ambientes**.

::: warning
Preencha a branch de leitura em **todos** os ambientes. A sincronização tenta todos eles, e o que não tem branch de leitura registra um erro a cada leitura. Se dois ambientes lerem a mesma branch, eles recebem a mesma spec.
:::

### 4. Aponte o serviço para o arquivo

1. Abra o serviço e clique em **Editar serviço**.
2. No painel **Origem da spec**, escolha **Arquivo no repositório**.
3. Em **Repositório**, escolha o repositório do passo 2. Repositórios de um provedor sem integração aparecem desabilitados.
4. Em **Caminho do arquivo**, informe o caminho dentro do repositório. O padrão é `openapi.yaml`. O caminho aceita letras, números, `.`, `_`, `-` e `/`.
5. Clique em **Salvar origem**.

### 5. Sincronize agora

1. Volte à página do serviço e abra a aba **Documentação da API**.
2. No painel **Ler da origem configurada**, clique em **Sincronizar agora**.

O hub lê o arquivo na branch de leitura de cada ambiente e guarda uma versão por ambiente. A mensagem de resultado lista o que foi atualizado (`dev 1.2.0, hml 1.2.0`) e o que falhou. Uma spec idêntica à já guardada não cria versão nova.

### 6. Agende a leitura com cron

Para manter o hub em dia sem clicar, chame `POST /api/v1/sync` num agendador. O endpoint sincroniza todos os serviços não arquivados cuja origem é **Arquivo no repositório** ou **Lida de uma URL**.

Primeiro, gere o token em **Configurações → Repositórios**. A tela mostra o valor uma vez. Sem esse token, o endpoint responde sempre 401. Guarde o valor no segredo do agendador e escolha um:

::: code-group
```bash [crontab]
# a cada hora, no minuto 7
7 * * * * curl --fail-with-body -sS --max-time 300 -X POST -H "Authorization: Bearer $(cat /etc/api-hub/sync-token)" https://apihub.suaempresa.com/api/v1/sync >> /var/log/api-hub-sync.log 2>&1
```

```yaml [GitHub Actions]
name: Sincronizar Rizoma

on:
  schedule:
    - cron: "0 * * * *"
  workflow_dispatch:

jobs:
  sincronizar:
    runs-on: ubuntu-latest
    steps:
      - name: Pedir a sincronização ao Rizoma
        env:
          API_HUB_URL: ${{ vars.API_HUB_URL }}
          SYNC_TOKEN: ${{ secrets.API_HUB_SYNC_TOKEN }}
        run: |
          curl --fail-with-body -sS --max-time 300 -X POST \
            -H "Authorization: Bearer ${SYNC_TOKEN}" \
            "${API_HUB_URL}/api/v1/sync" | tee sync.json
          echo
          jq -e '[.report[][] | select(.status == "error")] | length == 0' sync.json > /dev/null
```

```yaml [Kubernetes CronJob]
apiVersion: batch/v1
kind: CronJob
metadata:
  name: api-hub-sync
spec:
  schedule: "7 * * * *"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      backoffLimit: 0
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: sync
              image: curlimages/curl:8.10.1
              env:
                - name: SYNC_TOKEN
                  valueFrom:
                    secretKeyRef:
                      name: api-hub-sync
                      key: token
              command: ["sh", "-c"]
              args:
                - >-
                  curl --fail-with-body -sS --max-time 300 -X POST
                  -H "Authorization: Bearer $SYNC_TOKEN"
                  https://apihub.suaempresa.com/api/v1/sync
```
:::

A resposta lista o resultado por serviço e por ambiente. Note que o endpoint responde 200 mesmo quando alguma leitura falha: o `jq -e` do exemplo do GitHub Actions faz o job falhar nesse caso.

```json
{
  "services": 2,
  "report": {
    "pedidos-api": [
      { "env": "dev", "status": "published", "version": "2.4.0" },
      { "env": "prod", "status": "unchanged", "version": "2.3.1" }
    ],
    "estoque-api": [
      { "env": "dev", "status": "error", "error": "A origem respondeu 404." }
    ]
  }
}
```

::: tip
Cada execução registra na **Auditoria** um evento `Sincronização de spec executada` por serviço, mesmo sem mudanças. Uma frequência de 15 a 60 minutos costuma bastar. Se o hub só abre na rede interna, agende de dentro dela (crontab ou CronJob), não de um runner público.
:::

## Como saber que deu certo

- **Sincronizar agora** mostra `Atualizado: ...` com os ambientes e as versões, sem `Falhou`.
- No cabeçalho do serviço, **Origem da spec** mostra **Arquivo no repositório** e `Última leitura` com a data, sem mensagem em vermelho.
- Na aba **Documentação da API**, cada ambiente tem a versão do arquivo. Passe o mouse sobre a versão para ver a origem e a branch lida. Como o hub lê a branch e não um commit, a versão não guarda `commitSha`.
- No **Catálogo**, o serviço mostra o selo de cada ambiente com a versão.
- No cron, `services` traz a quantidade lida e nenhum item do `report` tem `"status": "error"`.

## Problemas comuns

O erro da última leitura aparece em vermelho no cabeçalho do serviço, no formato `ambiente: mensagem`, separados por ponto médio quando há mais de um. Ele é limpo ao salvar a origem e regravado a cada sincronização.

| Mensagem | Causa e solução |
|---|---|
| `O ambiente ... não tem branch de leitura configurada.` | Faltou o passo 3 nesse ambiente. |
| `A origem respondeu 404.` | Caminho, branch ou repositório errados, ou o token não enxerga o repositório (o GitHub responde 404 a repositórios privados sem acesso). Confira o **Caminho do arquivo** e se o arquivo existe na branch de leitura. |
| `A origem respondeu 401.` ou `403.` | Token vencido, revogado ou sem permissão de leitura. Gere outro e salve em **Configurações → Repositórios**. |
| `Escolha o repositório e o caminho do arquivo.` | A origem do serviço está incompleta. Refaça o passo 4. |
| `Esse tipo de repositório não permite leitura direta; use URL, CI ou importação.` | O repositório foi cadastrado como **Outro**. Cadastre-o pelo provedor real ou use outra origem. |
| Mensagem sobre a spec (por exemplo, falta de `paths`, `webhooks` ou `components`) | O arquivo lido não é uma spec válida. Abra-o na branch de leitura e corrija. |
| `fetch failed` | O hub não alcançou o provedor (rede, DNS, proxy) ou a chamada foi redirecionada: o hub não segue redirecionamentos. Para GitLab próprio, confira a **URL** da integração. |
| Cron responde 401 `Não autorizado.` | Token ainda não gerado em **Configurações → Repositórios**, ou diferente do enviado. |
| O repositório aparece desabilitado na lista | O provedor dele não tem integração em **Configurações → Repositórios**. |

## Veja também

- [Ler a spec de uma URL](/receitas/spec-por-url): origem para serviços que já expõem a spec por HTTP.
- [Ambientes por branch](/receitas/ambientes-por-branch)
- [Editar serviço](/admin/editar-servico)
- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions): quando a spec deve aparecer a cada deploy.
