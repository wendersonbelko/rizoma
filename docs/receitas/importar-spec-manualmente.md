---
description: Envie ou cole a spec de um serviço direto pela tela, escolha o ambiente e entenda o aviso de origem diferente da configurada.
---

# Importar a spec manualmente

Esta receita mostra como publicar a spec de um serviço pela própria tela, sem CI, sem URL e sem repositório. Serve para serviços que ainda não têm pipeline, para uma correção urgente, para testar como a documentação fica ou para specs que alguém mantém à mão. É para quem mantém o serviço.

## Antes de começar

- Você tem `spec:publish` e é do time responsável pelo serviço (ou tem `service:edit_any`). Com os papéis padrão, MAINTAINER, ADMIN e OWNER têm a permissão. Sem ela, o painel de importação não aparece.
- O serviço não está arquivado.
- Você tem o arquivo `.json`, `.yaml` ou `.yml` (ou o texto) da spec: OpenAPI 3.0, 3.1 ou Swagger 2.0, com até 5 MB, com `info` e com `paths`, `webhooks` ou `components`.

## Passo a passo

### 1. Escolha o ambiente

Abra o serviço no **Catálogo**. No topo da página, o seletor de ambiente mostra em qual você está (produção leva um escudo e o texto **Você está vendo produção.**). A importação vai para o ambiente selecionado, então troque antes de importar.

### 2. Abra Configurações

Na página do serviço, abra a aba **Configurações**. O painel **Publicar spec** mostra o ambiente no canto. Clique em **Publicar spec**: o modal confirma o destino no título, **Publicar spec em** seguido do nome do ambiente.

### 3. Envie o arquivo ou cole o texto

O modal tem duas abas:

| Aba | Como usar |
|---|---|
| **Enviar arquivo** | Escolha um `.json`, `.yaml` ou `.yml` do seu computador. |
| **Colar conteúdo** | Cole o texto da spec (JSON ou YAML) na caixa. |

Se você preencher as duas, o arquivo vence.

### 4. Clique em Publicar spec

O resultado aparece ao lado do botão:

| Mensagem | Significado |
|---|---|
| `Versão 2.4.0 publicada em Produção.` | Nova versão salva como a atual daquele ambiente. |
| `Essa spec já existia (v2.4.0).` | O conteúdo é idêntico a uma versão que já existe no ambiente. Nenhuma versão nova foi criada. |

O número da versão vem de `info.version`. Se a spec foi escrita por você, atualize esse campo a cada mudança para o histórico ficar legível.

::: tip
Reimportar uma spec antiga é o jeito de voltar a uma versão anterior: se o conteúdo é idêntico a uma versão que já existe no ambiente, o hub apenas a marca de novo como a atual.
:::

### 5. Importe a spec inicial pelo assistente (alternativa)

Ao cadastrar um serviço em **Serviços e repositórios → Serviços → Novo serviço**, o passo 4 (**Spec inicial**) faz a mesma importação, com um seletor de **Ambiente** (o de produção vem escolhido). Os botões são **Importar e concluir** e **Pular e concluir**.

## Aviso de origem diferente da configurada

Todo serviço tem uma **Origem da spec** configurada em **Editar serviço** (**CI envia**, **Arquivo no repositório**, **URL** ou **Importação manual**). Como a importação manual funciona em qualquer serviço, é comum ela divergir da configuração. Nesse caso, a aba **Documentação da API** mostra um aviso amarelo:

> A versão atual em Produção veio de Importação manual, mas a origem configurada é Enviada pelo CI.

O aviso aparece quando a versão atual do ambiente que você está vendo veio de um jeito diferente do configurado. O hub não troca a configuração sozinho, porque isso poderia surpreender quem configurou o CI de propósito. Você decide:

- **Você vai continuar importando à mão.** Clique em **Revisar em Editar serviço**, escolha **Importação manual** em **Origem da spec** e clique em **Salvar origem**. O aviso some.
- **A spec deve voltar a vir da origem configurada.** Publique pela origem configurada (o pipeline do CI ou **Sincronizar agora**) uma spec com conteúdo diferente da importada. A nova versão passa a ser a atual, com a origem certa, e o aviso some.

O link **Revisar em Editar serviço** só aparece para quem pode publicar.

::: info
Se a origem configurada publicar exatamente o mesmo conteúdo que você importou, o hub responde `unchanged` e mantém a versão existente com a origem **Importação manual**: o aviso continua até chegar uma spec com conteúdo diferente.
:::

## Como saber que deu certo

- A mensagem `Versão ... publicada em ...` aparece ao lado do botão.
- Na aba **Documentação da API**, a spec aparece renderizada e o seletor de versões mostra a nova versão com o marcador de atual. Passe o mouse sobre ela para ver a data e a origem **Importação manual**.
- No **Catálogo**, o serviço mostra o selo do ambiente com a versão.
- Em **Auditoria**, o grupo **Publicação de specs** registra `Spec publicada manualmente em prod (v2.4.0)`.

## Problemas comuns

| Mensagem ou sintoma | Causa e solução |
|---|---|
| O botão **Publicar spec** não aparece | Falta `spec:publish`, ou você não é do time do serviço. Peça a quem administra. A aba **Configurações** continua visível. |
| `Escolha um arquivo .json/.yaml ou cole o conteúdo.` | Os dois campos estavam vazios. |
| `Arquivo maior que 5 MB.` | Reduza a spec (por exemplo, exemplos muito grandes). |
| `Não foi possível ler a spec: ...` | O arquivo tem erro de sintaxe JSON ou YAML. A mensagem aponta o problema. |
| Mensagem dizendo que o campo `openapi` ou `swagger` não foi encontrado | O arquivo não é OpenAPI 3.x nem Swagger 2.0. |
| Mensagem dizendo que falta `info`, ou `paths`, `webhooks` e `components` | A spec está incompleta: `info` é obrigatório, e é preciso ter ao menos um de `paths`, `webhooks` ou `components`. |
| `Você só altera serviços dos seus times.` | O serviço é de outro time. |
| Importou, mas a versão não aparece | Você importou em outro ambiente. Confira o seletor no topo da página. |
| Depois do próximo deploy, a versão importada deixou de ser a atual | Esperado: a versão atual de cada ambiente é sempre a última publicada, venha de onde vier. A importada continua no seletor de versões. Se o CI é a fonte da verdade, não importe à mão. |

## Veja também

- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions): automatize e deixe de importar à mão.
- [Editar serviço](/admin/editar-servico): a origem da spec de cada serviço.
- [Ler a spec do repositório](/receitas/spec-do-repositorio) e [Ler a spec de uma URL](/receitas/spec-por-url)
- [Página do serviço](/uso/servico)
