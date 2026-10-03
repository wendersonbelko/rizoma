---
description: "As integrações externas do Rizoma (APIs de terceiros, filas, tópicos, webhooks, bancos): a listagem com filtro por tipo, o detalhe com endereços por ambiente, como criar, editar e excluir."
---

# Integrações externas

Uma integração externa é qualquer dependência que não é um serviço seu: a API de um provedor de pagamentos, uma fila, um tópico de eventos, um webhook, um banco de dados. Esta página mostra como consultar, cadastrar, editar e excluir integrações, e é para quem usa o catálogo e para quem mantém serviços.

## Para que serve

O cadastro central de integrações evita que cada serviço descreva a mesma dependência de um jeito. Cada integração guarda o tipo, o provedor, uma descrição em Markdown e o **endereço em cada ambiente** (a URL de homologação, o nome da fila de produção, o host do banco). Depois, cada serviço declara como usa a integração, e o resultado aparece na aba **Integrações** do serviço e no [Mapa de ligações](/uso/mapa).

## Quem vê

| Ação | Permissão |
|---|---|
| Ver a listagem e o detalhe | Ver o catálogo (todos os papéis). |
| Cadastrar, editar e excluir integrações | Editar vínculos, repositórios e integrações compartilhadas (MAINTAINER, ADMIN e OWNER, por padrão). |
| Ligar uma integração a um serviço | Editar o serviço, para serviços do próprio time. |

As integrações são **compartilhadas**: quem pode cadastrar edita e exclui qualquer uma, não só as dos serviços do próprio time. No detalhe, a lista de serviços que usam a integração respeita a visibilidade dos serviços (RN-30).

## A listagem

O item **Integrações externas** do menu abre a lista, com o título **Integrações externas** e a frase "APIs de terceiros, filas, tópicos, webhooks e bancos usados pelos serviços."

### Filtro por tipo

Logo abaixo do cabeçalho há pílulas de filtro: **Todas** e uma pílula para cada tipo que já tem integrações cadastradas, com a contagem (por exemplo, "Fila (3)"). Clique para restringir a lista; a pílula ativa fica destacada. Os tipos existentes são:

| Tipo | Exemplos |
|---|---|
| **API externa** | Uma API HTTP de terceiro |
| **Fila** | Uma fila de mensagens |
| **Tópico / evento** | Um tópico de eventos |
| **Webhook** | Um webhook enviado ou recebido |
| **Banco de dados** | Um banco compartilhado |
| **Cache** | Um cache |
| **Armazenamento** | Um bucket ou storage |
| **E-mail / SMS** | Um serviço de mensagens a clientes |
| **Outro** | Qualquer dependência que não se encaixe nos tipos anteriores |

### Tabela

| Coluna | O que mostra |
|---|---|
| **Integração** | O nome (link para o detalhe) e o provedor, quando há. |
| **Tipo** | O tipo, num selo. |
| **Usada por** | Até três frases no formato "Loja publica em Fila pedido.criado": o serviço, o que ele faz e o nome desta integração. Acima disso, "+2 serviços". Sem nenhum, "Nenhum serviço ligado". Some em telas estreitas. |

A lista é ordenada pelo nome e paginada: "Mostrando 1–10 de 45 integrações", **Por página** (10, 20, 50 ou 100) e os números de página. A página, o tamanho e o filtro ficam na URL (`?kind=QUEUE&page=2`).

Sem integrações, aparece "Nenhuma integração cadastrada" (ou "Nenhuma integração deste tipo", se há um filtro ativo). Quem pode cadastrar usa **Nova integração**, no cabeçalho da página.

## O detalhe de uma integração

Clique no nome de uma integração para abrir `/integrations/<slug>`.

### Cabeçalho

- o link **Integrações externas**, para voltar à lista;
- o nome, o tipo e o provedor (por exemplo, "Fila · AWS SQS");
- o link **Editar** (ou **Fechar edição**, quando o formulário está aberto), para quem pode editar;
- o link **Documentação oficial ↗**, quando a integração tem uma URL cadastrada.

### Descrição e endereços por ambiente

Abaixo do cabeçalho vem a descrição, escrita em Markdown (contrato, formato das mensagens, limites, contatos), e a tabela **Endereços por ambiente**, com as colunas **Ambiente** e **Endereço**. Ambientes sem endereço mostram "não informado". Como o endereço muda de um ambiente para outro, é ele que aparece na aba **Integrações** do serviço, conforme o ambiente escolhido lá.

### Serviços que usam

A seção **Serviços que usam** mostra a contagem no título e o link **Ver no mapa**, que abre o [Mapa de ligações](/uso/mapa) focado nesta integração. A tabela tem as colunas **Serviço** (link para a aba de integrações do serviço, com a observação do vínculo) e **Relação** (por exemplo, "consome Stripe"). Serviços arquivados e serviços que você não pode ver ficam de fora, e a lista é paginada. Sem nenhum, aparece "Nenhum serviço usa esta integração", com o complemento "Ou nenhum que você tenha permissão para ver."

## O que dá para fazer

### Cadastrar uma integração

1. Na listagem, clique em **Nova integração**. O modal abre por cima da lista, sem rolagem, em três passos: **Identificação**, **Detalhes** e **Endereços**.
2. Preencha os campos, avançando com **Avançar**:

   | Campo | Como preencher |
   |---|---|
   | **Nome** | O nome da integração, de 2 a 80 caracteres. |
   | **Identificador** | O slug que vai na URL. É sugerido a partir do nome; use letras minúsculas, números e hífen (2 a 63 caracteres). Precisa ser único. |
   | **Tipo** | Um dos tipos da tabela acima. |
   | **Provedor / tecnologia** | Texto livre, como "AWS SQS", "Kafka", "Stripe" ou "PostgreSQL". |
   | **Documentação oficial (URL)** | Opcional. |
   | **Descrição (Markdown)** | Contrato, formato das mensagens, limites, contato. |
   | **Endereço em cada ambiente** | Um campo por ambiente: URL, nome da fila ou tópico, ARN, host. |

3. Clique em **Cadastrar integração**. O hub abre o detalhe da nova integração.

::: warning Não coloque senhas nos endereços
O endereço é texto aberto, visível para todo mundo que vê o catálogo. Guarde senhas e chaves nas [variáveis de ambiente](/uso/variaveis) do serviço, como segredos.
:::

Se o identificador já existir, o hub responde "Já existe uma integração com esse identificador."

### Editar uma integração

1. No detalhe, clique em **Editar**.
2. No modal **Editar integração**, altere os campos. Deixar um endereço em branco o remove daquele ambiente.
3. Clique em **Salvar integração**. A resposta é "Integração salva." Se você mudar o identificador, o hub abre o detalhe no novo endereço.

Trocar o identificador altera a URL da integração, então links salvos com o identificador antigo deixam de funcionar.

### Excluir uma integração

Excluir é permanente e remove também as ligações da integração com os serviços. Por isso o hub pede uma confirmação digitada.

1. No detalhe, clique em **Excluir integração**. O modal explica o efeito, por exemplo "Remove a integração e as 3 ligações com serviços."
2. Digite `EXCLUIR` (em maiúsculas) no campo.
3. Clique em **Excluir**. O hub volta para a lista.

Se o texto não estiver certo, a página mostra "Confirmação incorreta." e nada é excluído.

### Ligar a integração a um serviço

O cadastro da integração não a liga a nenhum serviço. A ligação é feita na aba **Integrações** da [página do serviço](/uso/servico), no modal **Ligar integração externa**, onde você escolhe a relação do serviço com ela.

Cada tipo aceita só as relações que fazem sentido para ele (RN-81):

| Tipo | Relações possíveis |
|---|---|
| **API externa** | consome, fornece |
| **Fila** e **Tópico / evento** | publica em, assina |
| **Webhook** | envia webhook para, recebe webhook de |
| **Banco de dados**, **Cache** e **Armazenamento** | lê de, grava em |
| **E-mail / SMS** | consome |
| **Outro** | todas as anteriores |

## Regras importantes

- **Endereço por ambiente (RN-80).** Cada integração tem um endereço por ambiente, e cada serviço declara a relação dele com a integração.
- **Relações por tipo (RN-81).** O formulário de ligação só oferece as relações válidas para o tipo.
- **Auditoria.** Cadastrar, editar, excluir, ligar e desligar integrações fica registrado na [Auditoria](/admin/auditoria).
- **Markdown seguro (RN-S18).** A descrição e as observações são renderizadas sem HTML cru e sem links perigosos.
- **Compartilhamento.** Quem tem permissão para editar integrações edita todas elas, independente do time.

Veja o passo a passo completo em [Cadastrar uma integração externa](/receitas/integracao-externa).

## Próximos passos

- [Página do serviço](/uso/servico): ligue a integração a um serviço e veja o endereço no ambiente certo.
- [Mapa de ligações](/uso/mapa): veja quem usa cada integração.
- [Variáveis de ambiente](/uso/variaveis): onde guardar as credenciais da integração.
