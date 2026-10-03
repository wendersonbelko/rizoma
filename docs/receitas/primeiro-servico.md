---
description: Do hub recém-instalado ao primeiro serviço com a documentação da API publicada, passo a passo.
---

# Do zero ao primeiro serviço

Este passo a passo leva você de um hub vazio até um serviço com a documentação da API publicada: cria o time, cadastra o serviço, gera um token, envia a primeira spec com `curl`, confere no catálogo e chama o time. É para quem vai cadastrar o primeiro serviço (pessoa administradora ou mantenedora).

## Antes de começar

- O hub está instalado e você consegue entrar nele. No primeiro acesso, conclua o tour guiado.
- Você tem as permissões certas. Com os papéis padrão, **ADMIN** e **OWNER** fazem tudo abaixo; **MAINTAINER** faz tudo, menos criar o time (passo 1), que exige `team:manage`. Veja [Permissões](/referencia/permissoes).
- Existe pelo menos um ambiente configurado (**Configurações → Ambientes**), com um deles marcado como produção. O assistente de instalação já pede isso.
- Você tem uma spec OpenAPI 3.0, 3.1 ou Swagger 2.0, em JSON ou YAML, com até 5 MB. Se ainda não tem, use o exemplo do passo 4.
- `curl` instalado na sua máquina.

## Passo a passo

### 1. Crie o time

Todo serviço tem um time responsável, e só quem é do time (ou tem `service:edit_any`) o gerencia depois.

1. No menu, abra **Times**.
2. Clique em **Novo time** e preencha **Nome** (por exemplo, `Pagamentos`). O **Slug** é gerado a partir do nome. Preencha a **Descrição** se quiser e clique em **Criar time**.
3. Na seção do time, digite o usuário do GitHub (`@fulano`) ou o e-mail (`fulano@suaempresa.com`) de quem participa, escolha **Membro** ou **Líder** e clique em **Adicionar membro**.

Só entram em times as pessoas que já têm acesso ativo ao hub. Quem ainda não entrou fica para o passo 6.

::: tip
Sem `service:edit_any` (o caso do papel MAINTAINER), você só cria serviços para um time do qual participa. Adicione a si mesmo ao time, ou peça a quem administra.
:::

### 2. Cadastre o serviço no assistente

1. Abra **Serviços e repositórios** e fique na aba **Serviços**.
2. Clique em **Novo serviço** e siga os quatro passos do modal:

| Passo | O que preencher |
|---|---|
| **1. Dados básicos** | **Nome**, **Slug** (letras minúsculas, números e hífen, de 2 a 63 caracteres; aparece na URL `/services/pedidos-api`), **Descrição** e **Tags** (separadas por vírgula, até 10). Clique em **Avançar**. |
| **2. Time & visibilidade** | **Time responsável** e **Quem pode ver**: **Toda a empresa** ou **Só o time responsável**. Clique em **Criar serviço e continuar**. |
| **3. Repositório** (opcional) | Escolha um repositório já cadastrado ou cadastre um novo, defina o **Papel do repositório** e clique em **Vincular**. Dá para **Pular etapa**. |
| **4. Spec inicial** (opcional) | Importa uma spec por arquivo ou texto colado. |

O serviço passa a existir no fim do passo 2, e os passos 3 e 4 trabalham sobre ele. Neste roteiro, no passo 4 clique em **Pular e concluir**: você vai publicar a spec como o CI faz, para testar o caminho completo.

::: warning
O slug fica congelado depois que o serviço publica a primeira spec, porque outros serviços podem declarar dependência dele por esse identificador. Escolha com calma.
:::

### 3. Gere o token de publicação

1. Em **Serviços e repositórios**, abra a aba **Tokens**.
2. Clique em **Novo token**. No modal, escolha o **Serviço**, dê um **Nome** que diga onde o token vai ser usado (por exemplo, `github-actions`) e defina a **Validade (dias)**, de 1 a 365. O padrão é 90. O modal fica aberto para você copiar o token.
3. Clique em **Gerar token** e copie o valor que começa com `ahub_`.

O token aparece uma única vez; no banco fica só o hash. Guarde-o como um segredo: ele publica specs em nome do serviço. Um token vale para um serviço só.

### 4. Publique a primeira spec

Salve este arquivo como `openapi.yaml` (ou use o seu):

```yaml
openapi: 3.1.0
info:
  title: Pedidos API
  version: 1.0.0
paths:
  /pedidos:
    get:
      summary: Lista os pedidos
      responses:
        "200":
          description: OK
```

Depois envie:

```bash
export API_HUB_URL="https://apihub.suaempresa.com"
export API_HUB_TOKEN="ahub_..."   # o token do passo 3

curl --fail-with-body -sS -X POST "$API_HUB_URL/api/v1/specs" \
  -H "Authorization: Bearer $API_HUB_TOKEN" \
  -H "Content-Type: application/yaml" \
  --data-binary @openapi.yaml
```

A resposta esperada é HTTP 201:

```json
{ "status": "published", "id": "cm...", "version": "1.0.0", "environment": "prod", "unknownDependencies": [] }
```

Sem `environment` nem `branch` na URL, a spec vai para o ambiente marcado como produção. Para publicar em outro, acrescente `?environment=dev` (o identificador do ambiente, como aparece em **Configurações → Ambientes**).

::: info
Use `Content-Type: application/yaml` mesmo que o arquivo seja JSON: o hub detecta o formato pelo conteúdo. Com `application/json`, ele espera o formato alternativo `{ "spec": ... }`, descrito em [Publicar por outros CIs](/receitas/publicar-por-outros-ci).
:::

### 5. Confira no catálogo

1. Abra **Catálogo**. O serviço aparece com um selo do ambiente e a versão (`1.0.0`). Enquanto não há spec, o selo é **sem spec**.
2. Clique no serviço e abra a aba **Documentação da API**, com o ambiente certo selecionado.

![Página de um serviço com a documentação da API renderizada](/prints/05-servico-documentacao.png)

### 6. Convide o time

Com SMTP salvo, o convite sai por e-mail. Sem SMTP, quem entra é quem tem acesso pelo login da empresa, ou quem recebe o link copiado.

- Se as pessoas comprovam vínculo com a empresa (organização do GitHub, domínio de e-mail…), basta mandar o endereço do hub. Elas entram sozinhas e você as adiciona ao time em **Times → Adicionar membro**.
- Quem não comprova vínculo cai em **Pessoas e acesso**, na lista de pedidos pendentes, para você aprovar.
- Com o login por e-mail e senha habilitado, clique em **Convidar usuário** em **Pessoas e acesso** e envie o link pelo canal da empresa.

## Como saber que deu certo

- O `curl` respondeu HTTP 201 com `"status": "published"`.
- O **Catálogo** mostra o serviço com o selo do ambiente e a versão.
- Na aba **Documentação da API**, a spec aparece renderizada e o seletor de versões mostra `1.0.0` com o marcador de versão atual.
- No cabeçalho do serviço, **Origem da spec** mostra **Enviada pelo CI** (a origem padrão de um serviço novo).
- Em **Serviços e repositórios → Tokens**, a coluna **Último uso** do token deixa de ser "nunca".
- Em **Auditoria**, a publicação aparece no grupo **Publicação de specs**.

## Problemas comuns

| Sintoma | Causa provável e o que fazer |
|---|---|
| HTTP 401 `Token ausente.` | O cabeçalho `Authorization` não chegou ou a variável está vazia. Confira que o valor começa com `ahub_` (`echo "${API_HUB_TOKEN:0:5}"`). |
| HTTP 401 `Token inválido, revogado ou expirado.` | O token foi revogado, venceu ou o serviço foi arquivado. Gere outro na aba **Tokens**. |
| HTTP 422 `Corpo inválido...` | Você enviou o arquivo com `Content-Type: application/json`. Troque por `application/yaml`. |
| HTTP 422 dizendo que o campo `openapi` ou `swagger` não foi encontrado | O arquivo não é uma spec OpenAPI/Swagger. A spec também precisa de `info` e de `paths`, `webhooks` ou `components`. |
| HTTP 422 `Ambiente "..." não existe.` | O valor de `environment` não é o identificador de um ambiente. Veja **Configurações → Ambientes**. |
| O serviço não aparece na lista da aba **Tokens** | A lista só mostra serviços que você mantém. Confirme que você é do time responsável. |
| `Escolha um dos seus times como responsável.` no passo 2 | Sem `service:edit_any`, o serviço precisa ser de um time do qual você participa. |
| `Já existe um serviço com esse slug.` | Escolha outro slug. |

## Veja também

- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions): automatize o passo 4 a cada deploy.
- [Publicar pelo GitLab CI](/receitas/publicar-pelo-gitlab-ci)
- [Página do serviço](/uso/servico): o que cada aba mostra.
- [Times](/admin/times): papéis e membros.
