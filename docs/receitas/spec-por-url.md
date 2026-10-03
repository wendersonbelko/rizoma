---
description: Faça o Rizoma buscar a spec de um serviço numa URL, com o ambiente na URL, cabeçalhos cifrados e proteção contra SSRF. Ideal para serviços legados.
---

# Ler a spec de uma URL

Nesta receita o hub busca a spec do serviço numa URL HTTP(S), por ambiente, sem mexer no código nem no pipeline do serviço. É a saída para sistemas legados que já expõem o documento OpenAPI (por exemplo, `/v3/api-docs`) mas não têm CI que possa publicá-lo. A origem no serviço se chama **Lida de uma URL**.

## Antes de começar

- O serviço já está cadastrado no hub. Veja [Do zero ao primeiro serviço](/receitas/primeiro-servico).
- Você tem `service:edit` e é do time do serviço, para configurar a origem, e `spec:publish` para sincronizar.
- A URL devolve o documento OpenAPI 3.0/3.1 ou Swagger 2.0 (JSON ou YAML) com HTTP 200, em até 15 segundos e com até 5 MB.
- A URL é alcançável **a partir do servidor do hub**, não do seu navegador. Endereços de rede privada são permitidos; `localhost` não é.
- Para agendar a leitura (passo 5), o token gerado em **Configurações → Repositórios**.

::: warning
Se você planeja [tirar o /docs público do ar](/receitas/tirar-docs-do-ar), lembre que o hub precisa continuar alcançando o endpoint que entrega a spec. Restrinja-o à rede interna em vez de desligá-lo.
:::

## Passo a passo

### 1. Descubra a URL da spec

Frameworks costumam expor o documento neste caminho por padrão. Confira o do seu serviço:

| Framework | Caminho usual |
|---|---|
| FastAPI | `/openapi.json` |
| Spring Boot com springdoc | `/v3/api-docs` (JSON) ou `/v3/api-docs.yaml` |
| NestJS com @nestjs/swagger | `/docs-json`, se a interface foi montada em `/docs` (o sufixo `-json` vai depois do caminho escolhido em `SwaggerModule.setup`) |
| ASP.NET Core com Swashbuckle | `/swagger/v1/swagger.json` |

Teste de uma máquina da mesma rede do hub (melhor ainda, de dentro do servidor do hub):

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://pedidos.hml.suaempresa.internal/v3/api-docs
```

Deve imprimir `200`. Se responder 301 ou 302, use a URL final: o hub não segue redirecionamentos.

### 2. Configure a origem do serviço

1. Abra o serviço e clique em **Editar serviço**.
2. No painel **Origem da spec**, escolha **URL**.
3. Em **URL da spec**, informe o endereço. Use `{env}` no lugar do ambiente:

```text
https://pedidos.{env}.suaempresa.internal/v3/api-docs
```

Para cada ambiente, o hub troca `{env}` pelo identificador dele (`dev`, `hml`, `prod`…), em todas as ocorrências. Sem `{env}`, todos os ambientes leem a mesma URL e ficam com a mesma spec.

4. Se a URL exige autenticação, preencha **Cabeçalhos (JSON, opcional)**:

```json
{ "Authorization": "Bearer eyJ..." }
```

O valor precisa ser um objeto JSON cujos valores são todos texto. Os cabeçalhos são cifrados no banco, nunca aparecem na tela nem na auditoria e são enviados em toda leitura, de todos os ambientes. Ao editar, deixar o campo em branco mantém os cabeçalhos salvos; para trocá-los, envie o JSON completo de novo. Para apagá-los, mude a origem para outra e salve; ao voltar para **URL**, preencha o endereço de novo (trocar de origem também apaga a URL).

5. Clique em **Salvar origem**. A URL precisa começar com `http://` ou `https://` e ter até 500 caracteres.

### 3. Confira as regras de segurança da leitura

A leitura por URL parte do servidor do hub, então o hub recusa destinos perigosos (proteção contra SSRF):

| Bloqueado | Mensagem |
|---|---|
| Esquemas que não sejam `http` e `https` | `Só http e https são aceitos.` |
| `localhost` e `*.localhost` | `localhost não é permitido.` |
| Loopback: `127.x.x.x`, `::1` e `0.0.0.0` | `Endereço de loopback não é permitido.` |
| Link-local: `169.254.x.x` (inclui o serviço de metadados de nuvem em `169.254.169.254`) e `fe80:` | `Endereço link-local (metadados de nuvem) não é permitido.` |
| `metadata.google.internal` e `metadata` | `Serviço de metadados não é permitido.` |
| Um nome cujo DNS resolve para um dos endereços acima | `... aponta para um endereço bloqueado.` |
| Qualquer redirecionamento | a leitura falha |

**Redes privadas são permitidas**: `10.x.x.x`, `172.16.x.x` a `172.31.x.x`, `192.168.x.x` e nomes internos (`.internal`, `.svc.cluster.local`), porque serviços internos são o caso de uso. Como o `localhost` do hub é o próprio servidor (ou o contêiner) do hub, um serviço na mesma máquina precisa ser lido pelo nome ou pelo IP da rede, não por `localhost`.

Os limites da leitura são: 15 segundos de tempo total, 5 MB de tamanho e resposta HTTP 2xx. Qualquer outro status vira o erro `A origem respondeu ...`.

### 4. Sincronize agora

1. Volte à página do serviço e abra a aba **Documentação da API**.
2. No painel **Ler da origem configurada**, clique em **Sincronizar agora**.

O hub busca a URL de cada ambiente e guarda uma versão por ambiente, com a origem **Lida de uma URL**. A mensagem de resultado lista o que foi atualizado (`dev 3.1.0, hml 3.1.0`) e o que falhou (`Falhou: prod (A origem respondeu 404.)`). Uma spec idêntica à já guardada não cria versão nova. A versão não registra branch nem commit.

### 5. Agende a leitura com cron

Para manter o hub em dia, chame `POST /api/v1/sync` num agendador. O endpoint sincroniza todos os serviços não arquivados cuja origem é **Lida de uma URL** ou **Arquivo no repositório**. Gere o token em **Configurações → Repositórios** (a tela mostra o valor uma vez) e agende:

```bash
# crontab: a cada hora, no minuto 7
7 * * * * curl --fail-with-body -sS --max-time 300 -X POST -H "Authorization: Bearer $(cat /etc/api-hub/sync-token)" https://apihub.suaempresa.com/api/v1/sync >> /var/log/api-hub-sync.log 2>&1
```

Exemplos de GitHub Actions agendado e de Kubernetes CronJob, o formato da resposta e a explicação do 401 estão no passo 6 de [Ler a spec do repositório](/receitas/spec-do-repositorio).

## Como saber que deu certo

- **Sincronizar agora** mostra `Atualizado: ...` sem `Falhou`.
- No cabeçalho do serviço, **Origem da spec** mostra **Lida de uma URL** e `Última leitura` com a data, sem mensagem em vermelho.
- Na aba **Documentação da API**, cada ambiente tem a versão lida da URL. Passe o mouse sobre a versão para ver a origem.
- No **Catálogo**, o serviço mostra o selo de cada ambiente com a versão.

## Problemas comuns

O erro da última leitura aparece em vermelho no cabeçalho do serviço, no formato `ambiente: mensagem`.

| Mensagem | Causa e solução |
|---|---|
| `... aponta para um endereço bloqueado.` ou uma das mensagens da tabela do passo 3 | O destino é `localhost`, loopback, link-local ou metadados. Use o nome ou o IP do serviço na rede privada. |
| `Não foi possível resolver ...` | O DNS do servidor do hub não conhece o nome. Teste de dentro do servidor do hub. |
| `A origem respondeu 401.` ou `403.` | A URL exige autenticação: preencha **Cabeçalhos (JSON, opcional)**, ou confira se o token venceu. |
| `A origem respondeu 404.` em só um ambiente | O serviço não existe nesse ambiente, ou o nome do host não segue o padrão com `{env}`. Todos os ambientes são lidos a cada sincronização e não há como pular um. |
| `Spec maior que 5 MB.` | A spec passou do limite, que vale para todas as origens. Reduza o documento (por exemplo, exemplos e descrições muito grandes). |
| `fetch failed` | Falha de rede (conexão recusada, TLS, tempo esgotado de 15 segundos) ou redirecionamento. Use a URL final. |
| Mensagem sobre a spec (por exemplo, falta de `paths`, `webhooks` ou `components`) | A URL devolve uma página HTML ou outro documento. Confira o conteúdo com `curl`. |
| `Cabeçalhos devem ser um JSON como ...` ao salvar | O campo não é um objeto JSON, ou algum valor não é texto. |
| Cron responde 401 | Token ainda não gerado em **Configurações → Repositórios**, ou diferente do enviado. |

## Veja também

- [Ler a spec do repositório](/receitas/spec-do-repositorio): origem sem endpoint HTTP, direto do Git.
- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions): para quem pode mexer no pipeline.
- [Tirar o /docs público do ar](/receitas/tirar-docs-do-ar)
- [Segurança](/referencia/seguranca): a proteção contra SSRF e o resto do modelo.
