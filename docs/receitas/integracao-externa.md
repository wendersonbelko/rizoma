---
description: Cadastre uma API de terceiros, uma fila ou um banco como integração externa, informe o endereço por ambiente e ligue-a aos serviços com a relação certa.
---

# Cadastrar uma integração externa

Uma integração externa é tudo o que um serviço usa e que não é outro serviço do hub: a API de um fornecedor (como o Stripe), uma fila (SQS, RabbitMQ), um tópico, um webhook, um banco. Esta receita mostra como cadastrá-la uma vez, com o endereço de cada ambiente, ligá-la aos serviços com a relação correta, descobrir quem a usa e vê-la no mapa. É para quem mantém serviços.

## Antes de começar

- Para cadastrar e editar integrações, você tem `link:edit`. Com os papéis padrão, MAINTAINER, ADMIN e OWNER têm.
- Para ligar uma integração a um serviço, você tem `service:edit` e é do time responsável pelo serviço (ou tem `service:edit_any`).
- Os ambientes já estão configurados (**Configurações → Ambientes**): o cadastro tem um campo de endereço por ambiente.
- Você sabe onde guardar credenciais. O endereço da integração é visível a todo mundo que vê o catálogo, então **não coloque senhas nem chaves nele**. Use as [variáveis de ambiente](/uso/variaveis) do serviço, que aceitam segredos cifrados. Veja [Segredos, .env e cópia entre ambientes](/receitas/segredos-e-env).

## Passo a passo

### 1. Cadastre a integração

1. No menu, abra **Integrações externas**.
2. Clique em **Nova integração**.
3. No modal, preencha:

| Campo | O que informar |
|---|---|
| **Nome** | Como o time chama a integração (por exemplo, `Stripe`). |
| **Identificador** | Gerado a partir do nome. Aparece na URL `/integrations/stripe`. |
| **Tipo** | **API externa**, **Fila**, **Tópico / evento**, **Webhook**, **Banco de dados**, **Cache**, **Armazenamento**, **E-mail / SMS** ou **Outro**. O tipo define as relações possíveis no passo 2. |
| **Provedor / tecnologia** | `Stripe`, `AWS SQS`, `RabbitMQ`, `PostgreSQL`… |
| **Documentação oficial (URL)** | Link para a documentação do fornecedor. |
| **Descrição (Markdown)** | Contrato, formato das mensagens, limites, quem é o contato. |
| **Endereço em cada ambiente** | Um campo por ambiente: URL, nome da fila ou do tópico, ARN, host. Deixe em branco onde não existe. |

4. Clique em **Cadastrar integração**. O hub abre a página da integração.

Exemplos de preenchimento:

| Integração | Tipo | Provedor | Endereço (exemplos) |
|---|---|---|---|
| Stripe | **API externa** | Stripe | `https://api.stripe.com` em todos os ambientes; o que muda por ambiente é a chave, que fica numa variável de ambiente |
| Fila de pedidos criados | **Fila** | AWS SQS | dev: `pedidos-criados-dev`; prod: `arn:aws:sqs:sa-east-1:123456789012:pedidos-criados` |
| Fila do checkout | **Fila** | RabbitMQ | `amqp://rabbit.hml.suaempresa.internal:5672/checkout` (sem usuário e senha) |
| Banco de pedidos | **Banco de dados** | PostgreSQL | `pg-pedidos.hml.suaempresa.internal:5432/pedidos` |

### 2. Ligue a integração ao serviço

1. Abra o serviço e vá à aba **Integrações**.
2. Clique em **Ligar integração** e, no modal, escolha a **Integração** (a lista é agrupada por tipo).
3. Em **Este serviço…**, escolha a relação. O hub só oferece as que fazem sentido para o tipo (RN-81, em [Regras de negócio](/referencia/regras-de-negocio)):

| Tipo | Relações |
|---|---|
| **API externa** | consome, fornece |
| **Fila** e **Tópico / evento** | publica em, assina |
| **Webhook** | envia webhook para, recebe webhook de |
| **Banco de dados**, **Cache** e **Armazenamento** | lê de, grava em |
| **E-mail / SMS** | consome |
| **Outro** | todas as relações acima |

4. Se quiser, escreva uma **Observação (Markdown)**, por exemplo `publica pedido.criado depois do pagamento aprovado`.
5. Clique em **Ligar integração**.

O mesmo serviço pode ter mais de uma relação com a mesma integração (por exemplo, **lê de** e **grava em** um banco). A mesma relação repetida é recusada. Para desfazer uma ligação, use **Remover** na linha dela.

### 3. Veja quem usa a integração

Abra **Integrações externas** e clique na integração. A seção **Serviços que usam** lista cada serviço com a relação (por exemplo, `publica em Fila de pedidos criados`) e a observação. A lista mostra só serviços que você pode ver e que não estão arquivados.

Na lista de **Integrações externas**, os filtros por tipo (**Todas**, **Fila (2)**…) ajudam a achar o que você procura. Na aba **Integrações** de um serviço, a coluna **Também usam** mostra quem mais depende da mesma integração.

### 4. Veja no mapa

Na página da integração, clique em **Ver no mapa**, ou abra o **Mapa de ligações** e clique no nó da integração (borda tracejada, filtro **Integrações externas**). O mapa mostra os serviços ligados a ela e o sentido do fluxo: quando o dado entra no serviço (**consome**, **assina**, **lê de**, **recebe webhook de**), a seta vai da integração para o serviço; nos demais casos, do serviço para a integração. Duplo clique no nó abre a página da integração.

O mapa não cria ligações com integrações externas; elas nascem pela aba **Integrações** do serviço, como no passo 2.

### 5. Mantenha atualizado

Na página da integração, clique em **Editar**, altere os campos no modal (inclusive os endereços por ambiente) e clique em **Salvar integração**. Apagar o texto de um endereço remove o endereço daquele ambiente. Para excluir, clique em **Excluir integração** e digite `EXCLUIR`: a exclusão apaga também as ligações com os serviços.

## Como saber que deu certo

- A página da integração mostra a tabela **Endereços por ambiente**, com `não informado` só onde você deixou em branco.
- Na aba **Integrações** do serviço, a tabela **Integrações externas** tem uma linha com a integração, a **Relação** e o **Endereço** do ambiente selecionado. Troque o ambiente no seletor do topo para conferir os outros.
- A integração mostra o serviço em **Serviços que usam**.
- No mapa, existe uma aresta entre o serviço e a integração.
- Em **Auditoria**, aparecem `Integração cadastrada: stripe` e `Integração vinculada ao serviço`.

## Problemas comuns

| Mensagem ou sintoma | Causa e solução |
|---|---|
| Não existe o botão **Nova integração** | Falta `link:edit`. |
| `Já existe uma integração com esse identificador.` | Escolha outro **Identificador** (ou reuse a integração que já existe). |
| **Ligar integração** não aparece | Falta `service:edit`, ou o serviço é de outro time. |
| `Nenhuma integração cadastrada ainda.` no painel | Cadastre a integração primeiro (passo 1). |
| A relação que eu queria não aparece em **Este serviço…** | A relação não faz sentido para o **Tipo** escolhido. Corrija o tipo da integração em **Editar**, ou use **Outro**, que aceita todas. |
| `Essa ligação já existe.` | O serviço já tem essa relação com a integração. |
| **Serviços que usam** vem vazio | Nenhum serviço está ligado, ou os que estão são restritos a outros times ou arquivados. |
| O endereço aparece como `não informado` num ambiente | Edite a integração e preencha o campo daquele ambiente. |

## Veja também

- [Integrações externas](/uso/integracoes): o que o menu mostra.
- [Mapear dependências](/receitas/mapear-dependencias): ligações entre serviços e repositórios.
- [Segredos, .env e cópia entre ambientes](/receitas/segredos-e-env)
- [Mapa de ligações](/uso/mapa)
