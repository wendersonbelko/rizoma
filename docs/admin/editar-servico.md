---
description: "Como editar um serviço no Rizoma: dados, time, visibilidade, situação e tags; a origem da spec (CI, arquivo no repositório, URL ou importação manual); arquivar e restaurar."
---

# Editar e arquivar serviços

A tela de edição de um serviço concentra o que muda ao longo da vida dele: nome, time, visibilidade, situação, tags, de onde vem a spec e o arquivamento. Esta página é para quem mantém serviços do próprio time e para quem administra o hub.

## Para que serve

Use a edição quando o serviço muda de dono, passa a ser restrito ao time, é marcado como descontinuado, troca a forma de publicar a spec ou sai de circulação. Cadastrar um serviço novo é tarefa do assistente **Novo serviço**, em [Serviços e repositórios](/admin/servicos-e-vinculos).

## Quem vê

| Ação | Permissão |
|---|---|
| Abrir a edição e alterar dados e origem da spec | Editar serviços do próprio time |
| Arquivar e restaurar | Arquivar e restaurar serviços |

Sem a permissão de editar qualquer serviço, você só edita serviços do time do qual participa; para os demais a tela responde "não encontrada". Por padrão, MAINTAINER edita o próprio time, e ADMIN e OWNER editam qualquer serviço. O painel de arquivamento só aparece para quem tem a permissão de arquivar (ADMIN e OWNER, por padrão). Veja o conceito de "próprio time" na [visão geral](/admin/).

Para abrir a tela, use o link **Editar serviço** no cabeçalho da [página do serviço](/uso/servico), ou **Editar** na lista **Serviços que você mantém**. O endereço é `/services/<slug>/edit`.

## O que aparece na tela

![Tela Editar serviço](/prints/10-editar-servico.png)

*A tela de edição de um serviço. Na versão atual há também o painel Origem da spec.*

No topo, o nome do serviço (link de volta para a página dele) e o título **Editar serviço**. Depois vêm três painéis: o formulário de dados, **Origem da spec** e **Arquivar serviço** (ou **Serviço arquivado**).

### Dados do serviço

| Campo | O que faz |
|---|---|
| **Nome** | De 2 a 80 caracteres. |
| **Slug** | O identificador na URL e nas dependências declaradas. Veja a regra abaixo. |
| **Descrição** | Até 500 caracteres; aparece no Catálogo e no cabeçalho do serviço. |
| **Time responsável** | O time dono do serviço. Quem pode editar qualquer serviço vê também **Sem time**; os demais só veem os próprios times. |
| **Quem pode ver** | **Toda a empresa** ou **Só o time responsável** (RN-30). |
| **Situação** | **Experimental**, **Em produção** ou **Descontinuado**. |
| **Tags** | Separadas por vírgula, no máximo 10, de até 30 caracteres, em minúsculas. |

Clique em **Salvar alterações**. A resposta é "Alterações salvas." A mudança fica na [Auditoria](/admin/auditoria), com os campos alterados e os valores de antes e depois.

**Slug imutável depois da primeira spec (RN-31).** Enquanto o serviço não publicou nenhuma spec, você pode ajustar o slug. Depois da primeira spec, o campo fica travado, com o aviso "Congelado: o serviço já publicou spec e outros serviços podem depender dele." O slug vira parte de URLs, de dependências declaradas em outras specs (`x-api-hub.dependsOn`) e de integrações no CI, então mudá-lo quebraria essas referências. Se você trocar o slug antes da primeira spec, o hub abre a edição no endereço novo, e os links antigos deixam de funcionar.

**Time (RN-33).** Um serviço tem no máximo um time. Sem a permissão de editar qualquer serviço, ele não sai do seu time nem vai para um time do qual você não faz parte ("Escolha um dos seus times como responsável.").

**Situação.** É uma informação de ciclo de vida:

| Situação | Efeito |
|---|---|
| **Experimental** | Selo de atenção no Catálogo. |
| **Em produção** | O padrão. Não ganha selo no Catálogo. |
| **Descontinuado** | Selo vermelho no Catálogo e texto em vermelho no cabeçalho do serviço. A documentação continua disponível. |

**Visibilidade (RN-30).** Com **Só o time responsável**, o serviço some do Catálogo, do mapa e de qualquer URL para quem não é do time e não tem a permissão de ver serviços restritos de outros times.

## Origem da spec

O painel **Origem da spec** define como a spec chega ao hub. Cada serviço escolhe uma origem (RN-93):

| Origem | Como funciona |
|---|---|
| **CI envia** (padrão) | O pipeline faz `POST /api/v1/specs` a cada deploy com um token de publicação. O ambiente vem da branch. |
| **Arquivo no repositório** | O hub lê um arquivo (por exemplo, `openapi.yaml`) na branch de leitura de cada ambiente. |
| **URL** | O hub busca a spec numa URL. `{env}` na URL vira o identificador do ambiente. |
| **Importação manual** | Alguém do time envia o JSON ou YAML pela tela. |

Escolha a origem, preencha os campos que aparecem e clique em **Salvar origem**. A resposta é "Origem da spec salva." A mudança fica na auditoria, sem nenhum cabeçalho ou credencial.

### CI envia

Sem campos extras. Gere um token na aba **Tokens** de [Serviços e repositórios](/admin/servicos-e-vinculos) e configure o pipeline. Os passos estão em [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions) e em [Publicar pelo GitLab CI](/receitas/publicar-pelo-gitlab-ci).

### Arquivo no repositório

| Campo | Como preencher |
|---|---|
| **Repositório** | Um repositório cadastrado (GitHub, GitLab ou Bitbucket). Os que estão em provedores sem integração configurada aparecem desabilitados. Se nenhuma integração existir, o campo pede que você fale com quem administra em **Configurações**. |
| **Caminho do arquivo** | O caminho dentro do repositório. Vem preenchido com `openapi.yaml`. Aceita letras, números, `.`, `_`, `-` e `/`, até 300 caracteres. |

A **branch de leitura** vem de cada ambiente, em [Configurações](/admin/configuracoes) (seção **Ambientes**). Se um ambiente não tiver branch de leitura, a sincronização dele falha com o aviso de que ela não está configurada. Repositórios do tipo **Outro** não aparecem na lista, porque não permitem leitura direta: para eles, use URL, CI ou importação. Veja [Ler a spec do repositório](/receitas/spec-do-repositorio).

### URL

| Campo | Como preencher |
|---|---|
| **URL da spec** | Um endereço `http` ou `https`. Use `{env}` para o ambiente: `https://pedidos.{env}.suaempresa.internal/openapi.json`. |
| **Cabeçalhos (JSON, opcional)** | Um objeto JSON com valores em texto, como `{"Authorization": "Bearer ..."}`. Ficam cifrados. Se já há cabeçalhos salvos, o campo avisa e, deixado em branco, mantém os atuais. |

O hub protege a leitura contra SSRF (RN-94): bloqueia `localhost`, endereços de loopback, endereços link-local e o serviço de metadados de nuvem; redes privadas são permitidas, já que serviços internos são o caso de uso. A leitura tem limite de 5 MB e de tempo, e o hub não segue redirecionamentos. Veja [Ler a spec de uma URL](/receitas/spec-por-url).

Se você trocar a origem para uma diferente de **URL**, os cabeçalhos salvos são apagados.

### Importação manual

Sem campos extras. A spec é enviada pela aba **Configurações** do serviço. Veja [Importar a spec manualmente](/receitas/importar-spec-manualmente).

### Sincronizar

Nas origens **Arquivo no repositório** e **URL**, o botão **Sincronizar agora** da aba **Configurações** busca a spec de cada ambiente na hora, para quem pode publicar specs no serviço. Um cron também pode chamar `POST /api/v1/sync`, com o token gerado em **Configurações → Repositórios**, para atualizar todos os serviços com essas origens (RN-95). O cabeçalho do serviço mostra a "Última leitura" e o erro da última tentativa, se houve. A última publicação também mostra um resumo do que mudou em relação à versão anterior.

## Arquivar e restaurar

### Arquivar um serviço

O painel **Arquivar serviço** só aparece para quem tem a permissão de arquivar. Ele explica o efeito: o serviço "some do catálogo e do mapa", todos os tokens de publicação são revogados e o histórico de specs é mantido. Se outros serviços dependem dele, o painel avisa quantos ("Atenção: 2 serviços dependem deste.").

1. Abra **Editar serviço** do serviço a arquivar.
2. No painel **Arquivar serviço**, clique em **Arquivar serviço**.

O botão não pede confirmação. O hub leva você de volta a **Serviços e repositórios**.

O que acontece (RN-32):

- o serviço deixa de aparecer no Catálogo e no mapa;
- todos os tokens dele são revogados, e o CI passa a receber 401;
- as specs publicadas continuam guardadas;
- o serviço continua na lista **Serviços que você mantém**, com o selo "arquivado em" e a data, para quem pode gerenciá-lo.

### Restaurar um serviço

1. Em **Serviços e repositórios**, na lista **Serviços que você mantém**, clique em **Restaurar** no serviço arquivado (ou abra **Editar serviço** por ele).
2. No painel **Serviço arquivado**, clique em **Restaurar serviço**.

O serviço volta ao Catálogo e ao mapa, e o hub abre a página dele.

::: warning Restaurar não reativa os tokens
Os tokens revogados no arquivamento continuam revogados. Gere um token novo na aba **Tokens** e atualize o segredo no CI do serviço.
:::

## Regras importantes

- **Slug (RN-31).** É único e imutável depois que o serviço tem spec publicada.
- **Arquivar (RN-32).** Só quem tem a permissão de arquivar. Tira do catálogo e do mapa, revoga tokens e mantém o histórico. Restaurar não reativa tokens.
- **Um time por serviço (RN-33).** Sem a permissão de editar qualquer serviço, o serviço não sai do seu time.
- **Visibilidade (RN-30).** Serviço restrito ao time some para quem está fora dele.
- **Origem da spec (RN-93 a RN-95).** Uma origem por serviço; leitura por URL protegida contra SSRF; sincronização manual ou por cron.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Serviços e repositórios](/admin/servicos-e-vinculos): tokens, vínculos e o assistente de novo serviço.
- [Tirar o /docs público do ar](/receitas/tirar-docs-do-ar): deixe o hub como única vitrine das specs.
- [Times](/admin/times): mude o time responsável criando ou ajustando times.
