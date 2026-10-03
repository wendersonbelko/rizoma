---
description: Como declarar dependências entre serviços na própria spec OpenAPI com a extensão x-api-hub.dependsOn.
---

# Extensão x-api-hub

A extensão `x-api-hub` permite que o contrato OpenAPI de um serviço declare de quais outros serviços do hub ele depende. A cada publicação, o hub transforma essa declaração em ligações no [mapa](/uso/mapa). É para quem mantém specs e quer o mapa sempre atualizado sem cadastrar vínculos à mão.

## Formato

A extensão fica na **raiz** do documento (ao lado de `openapi`, `info` e `paths`), com uma lista de slugs em `dependsOn`:

::: code-group
```yaml [YAML]
openapi: 3.1.0
info:
  title: Pedidos
  version: 2.4.0
x-api-hub:
  dependsOn:
    - estoque
    - pagamentos
paths: {}
```

```json [JSON]
{
  "openapi": "3.1.0",
  "info": { "title": "Pedidos", "version": "2.4.0" },
  "x-api-hub": {
    "dependsOn": ["estoque", "pagamentos"]
  },
  "paths": {}
}
```
:::

Regras do formato:

| Item | Regra |
|---|---|
| Posição | Na raiz da spec. Dentro de `info` ou de `paths` não vale |
| `dependsOn` | Lista de textos. Cada texto é o **slug** de um serviço cadastrado no hub |
| Slug | Igual ao slug do serviço, em minúsculas, exatamente como aparece na URL `/services/estoque` |
| Outros itens da lista | Valores que não são texto são ignorados sem erro |
| `dependsOn` que não é lista | Ignorado sem erro |

Funciona em qualquer formato aceito pelo hub: OpenAPI 3.0, 3.1 e Swagger 2.0.

## O que acontece na publicação

Cada vez que o hub grava uma **versão nova** da spec (pelo CI, por leitura de repositório ou URL, ou por importação manual), ele processa a lista `dependsOn`:

1. Para cada slug que existe no hub, cria a ligação **consome a API de** entre o seu serviço e o outro. A ligação nasce marcada como **declarado na spec** (detectada).
2. Se a ligação já existir (manual ou detectada), nada muda.
3. Slugs que não existem, ou que apontam para o próprio serviço, não geram ligação. Eles voltam no campo `unknownDependencies` da resposta da API:

```json
{
  "status": "published",
  "id": "cm1x2y3z40000abcd1234efgh",
  "version": "2.4.0",
  "environment": "prod",
  "unknownDependencies": ["fantasma"]
}
```

Depois disso, as ligações aparecem:

- no [Mapa de ligações](/uso/mapa), como seta de "consome a API de";
- na aba **Integrações** do serviço, em **Outros serviços do hub**, com o selo **declarado na spec**;
- em **Serviços e repositórios → Vínculos**, junto com os vínculos manuais.

## Regras que valem a pena conhecer

**Só versões novas processam a lista.** Reenviar uma spec idêntica devolve `unchanged` e não reprocessa `dependsOn`. A declaração é lida quando o conteúdo da spec muda.

**Ligações detectadas voltam a cada publicação.** Você pode remover uma ligação detectada em **Vínculos**, mas se o slug continuar em `dependsOn`, a ligação é recriada na próxima publicação de uma versão nova. Para desfazer de vez, tire o slug da spec.

**Remover o slug da spec não apaga a ligação.** O hub cria ligações a partir da declaração, mas não limpa as que deixaram de ser declaradas. Remova-as manualmente em **Vínculos**.

**Só existe um tipo de ligação.** A extensão cria apenas "consome a API de". Outros tipos ("publica eventos em", "assina eventos de", "compartilha biblioteca com", "depende de") são criados à mão em **Vínculos** ou no mapa.

**Slug desconhecido não é erro.** A publicação acontece normalmente; o slug só aparece em `unknownDependencies`. Se o serviço citado for cadastrado depois, a ligação nasce na próxima publicação de uma versão nova.

**Visibilidade vale.** Serviços com visibilidade "Só o time" só aparecem no mapa para quem pode vê-los, mesmo que a ligação exista.

::: tip Detecte erros no pipeline
O campo `unknownDependencies` só aparece na resposta da API. Se quiser falhar o build quando houver slug desconhecido, leia a resposta no CI. Um exemplo está em [API HTTP](/referencia/api).
:::

## Como gerar a extensão no seu framework

Se a sua spec é gerada por um framework, adicione a chave `x-api-hub` ao documento antes de gravá-lo. Os exemplos abaixo mostram o princípio; confira a documentação da sua versão do framework, porque os detalhes de API mudam.

### Arquivo escrito à mão

Basta acrescentar o bloco `x-api-hub` ao `openapi.yaml`, como no exemplo do início da página.

### FastAPI (Python)

O FastAPI permite personalizar o esquema gerado sobrescrevendo `app.openapi`:

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(title="Pedidos", version="2.4.0")

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
    schema["x-api-hub"] = {"dependsOn": ["estoque", "pagamentos"]}
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi
```

### NestJS (@nestjs/swagger)

`SwaggerModule.createDocument` devolve o documento como objeto. Acrescente a chave antes de servir ou gravar o arquivo:

```ts
const document = SwaggerModule.createDocument(app, config);
(document as Record<string, unknown>)["x-api-hub"] = { dependsOn: ["estoque", "pagamentos"] };
```

### Spring Boot (springdoc-openapi)

O modelo `OpenAPI` aceita extensões cujo nome começa com `x-`:

```java
@Bean
public OpenAPI apiHubOpenAPI() {
    return new OpenAPI()
        .info(new Info().title("Pedidos").version("2.4.0"))
        .addExtension("x-api-hub", Map.of("dependsOn", List.of("estoque", "pagamentos")));
}
```

### ASP.NET Core (Swashbuckle)

Use um filtro de documento e registre-o em `AddSwaggerGen`:

```csharp
public class ApiHubDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument doc, DocumentFilterContext context)
    {
        doc.Extensions["x-api-hub"] = new OpenApiObject
        {
            ["dependsOn"] = new OpenApiArray
            {
                new OpenApiString("estoque"),
                new OpenApiString("pagamentos"),
            },
        };
    }
}

// Program.cs
builder.Services.AddSwaggerGen(options => options.DocumentFilter<ApiHubDocumentFilter>());
```

### Express com swagger-jsdoc

O objeto `definition` é a base do documento. Inclua a chave lá:

```js
const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "Pedidos", version: "2.4.0" },
    "x-api-hub": { dependsOn: ["estoque", "pagamentos"] },
  },
  apis: ["./src/routes/*.js"],
});
```

### Qualquer framework: injetar no build

Se o seu framework não deixa personalizar o documento, acrescente a chave ao arquivo gerado, num passo do pipeline. Para JSON, com `jq`:

```bash
jq '. + {"x-api-hub": {"dependsOn": ["estoque", "pagamentos"]}}' openapi.json > openapi.final.json
```

Para YAML, com o `yq` (versão 4):

```bash
yq -i '.["x-api-hub"].dependsOn = ["estoque", "pagamentos"]' openapi.yaml
```

Depois, publique o arquivo final com [`POST /api/v1/specs`](/referencia/api).

## Conferindo o resultado

1. Publique a spec (pelo CI ou manualmente).
2. Abra o serviço e vá até a aba **Integrações**: as ligações declaradas aparecem em **Outros serviços do hub**, com o selo **declarado na spec**.
3. Ou abra o [Mapa de ligações](/uso/mapa) e foque no serviço.
4. Se um slug não gerou ligação, confira `unknownDependencies` na resposta da API e o slug do serviço em [Editar e arquivar serviços](/admin/editar-servico).

## Veja também

- [Mapear dependências](/receitas/mapear-dependencias)
- [API HTTP](/referencia/api)
- [Mapa de ligações](/uso/mapa)
- [Ingestão de specs (arquitetura)](/arquitetura/ingestao-de-specs)
