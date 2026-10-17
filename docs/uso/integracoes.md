---
description: "As integrações externas do Rizoma (APIs de terceiros, filas, tópicos, webhooks, bancos): a listagem com filtro por tipo, o detalhe com endereços por ambiente, como criar em dois passos, editar e excluir digitando o nome."
---

# Integrações externas

Uma integração externa é qualquer dependência que não é um serviço seu: a API de um provedor de pagamentos, uma fila, um tópico de eventos, um webhook, um banco de dados. Esta página mostra como consultar, cadastrar, editar e excluir integrações, e é para quem usa o catálogo e para quem mantém serviços.

## Para que serve

O cadastro central de integrações evita que cada serviço descreva a mesma dependência de um jeito. Cada integração guarda o tipo, o provedor, uma descrição em Markdown e o **endereço em cada ambiente** (a URL de homologação, o nome da fila de produção, o host do banco). Depois, cada serviço declara como usa a integração (um vínculo), e o resultado aparece na aba **Integrações** do serviço e no [Mapa de ligações](/uso/mapa).

## Quem vê

| Ação | Permissão |
|---|---|
| Ver a listagem e o detalhe | Ver o catálogo (todos os papéis). |
| Cadastrar, editar e excluir integrações | Editar vínculos, repositórios e integrações compartilhadas (Mantenedor, Administrador e Proprietário, por padrão). |
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
| **Usada por** | Até três frases no formato "Loja publica em Fila pedido.criado": o serviço, o que ele faz e o nome desta integração. Acima disso, "+2 serviços". Sem nenhum, "Nenhum serviço vinculado". Some em telas estreitas. |

A lista é ordenada pelo nome e paginada: "Mostrando 1–10 de 45 integrações", **Por página** (10, 20, 50 ou 100) e os números de página. A página, o tamanho e o filtro ficam na URL (`?kind=QUEUE&page=2`). Um `kind` que não existe é ignorado.

Sem integrações, aparece "Nenhuma integração cadastrada" (ou "Nenhuma integração deste tipo", se há um filtro ativo). Quem pode cadastrar usa **Nova integração**, no cabeçalho da página (ou no botão que aparece nesse vazio).

## O detalhe de uma integração

Clique no nome de uma integração para abrir `/integrations/<slug>`.

### Cabeçalho

- o caminho **Integrações externas › nome da integração**. Clique em **Integrações externas** para voltar à lista;
- o nome, o tipo e o provedor (por exemplo, "Fila · AWS SQS");
- o botão **Editar**, para quem pode editar;
- o link **Documentação oficial ↗**, quando a integração tem uma URL cadastrada.

### Descrição e endereços por ambiente

Abaixo do cabeçalho vem a descrição, escrita em Markdown (contrato, formato das mensagens, limites, contatos), e a tabela **Endereços por ambiente**, com as colunas **Ambiente** e **Endereço**. Ambientes sem endereço mostram "não informado". Como o endereço muda de um ambiente para outro, é ele que aparece na aba **Integrações** do serviço, conforme o ambiente escolhido lá.

### Serviços que usam

A seção **Serviços que usam (N)** mostra a contagem no título e o link **Ver no mapa**, que abre o [Mapa de ligações](/uso/mapa) em foco nesta integração. A tabela tem as colunas **Serviço** (link para a aba de integrações do serviço, com a observação do vínculo) e **Relação** (por exemplo, "consome Stripe"). Serviços arquivados e serviços que você não pode ver ficam de fora, e a lista é paginada. Sem nenhum, aparece "Nenhum serviço usa esta integração", com o complemento "Ou nenhum que você tenha permissão para ver."

### Zona de perigo

No fim do detalhe, quem pode editar vê a **Zona de perigo**, com a ação **Excluir integração**. Veja [Excluir uma integração](#excluir-uma-integracao).

## O que dá para fazer

### Cadastrar uma integração

O cadastro é um modal em dois passos, **Identificar** e **Endereçar**. Só o nome e o tipo são obrigatórios; o resto pode ficar para depois.

1. Na listagem, clique em **Nova integração**. O modal abre por cima da lista. Você também chega aqui pelo botão **+ Novo** do menu lateral, pelo atalho **Ctrl+K** ("Nova integração") ou pelo endereço `/integrations#new-integration`.
2. No primeiro passo, **Identificar**, preencha:

   | Campo | Como preencher |
   |---|---|
   | **Nome da integração** | Obrigatório, de 2 a 80 caracteres. Por exemplo, "Stripe" ou "fila pedido.criado". |
   | Endereço (slug) | Texto pequeno abaixo do nome, como `/integrations/stripe · editar endereço`. É gerado a partir do nome. Clique em **editar endereço** para mudar; use letras minúsculas, números e hífen (2 a 63 caracteres). Precisa ser único. |
   | **Tipo** | Obrigatório. Um dos tipos da tabela acima. |
   | **Provedor ou tecnologia** | Texto livre, como "AWS SQS", "Kafka", "Stripe" ou "PostgreSQL". |
   | **Detalhes opcionais** | **Documentação oficial (URL)** e **Descrição (Markdown)**: contrato, formato das mensagens, limites, contato. |

3. Clique em **Continuar** (ou aperte Enter num campo). Se faltar o nome ou o tipo, o hub avisa "Informe o nome da integração." ou "Escolha o tipo da integração." e fica no primeiro passo.
4. No segundo passo, **Endereçar**, preencha o **Endereço em cada ambiente**: um campo por ambiente, com URL, nome da fila ou do tópico, ARN ou host. Pode deixar em branco e preencher depois. **Voltar** leva ao primeiro passo sem perder o que você digitou.
5. Clique em **Criar integração**. O hub abre o detalhe da nova integração.

**Cancelar**, o ×, o Esc e o clique fora fecham o modal; se você digitou algo, o hub pergunta "Descartar o que você digitou?".

::: warning Não coloque senhas nos endereços
O endereço é texto aberto, visível para todo mundo que vê o catálogo. Guarde senhas e chaves nas [variáveis de ambiente](/uso/variaveis) do serviço, como segredos.
:::

Se o endereço (slug) já existir, o hub responde "Já existe uma integração com este endereço." e abre o campo para você escolher outro.

### Editar uma integração

1. No detalhe, clique em **Editar**.
2. No modal **Editar integração**, altere os campos. Aqui não há passos: nome, tipo, provedor, detalhes e endereços ficam numa tela só. Deixar um endereço em branco o remove daquele ambiente.
3. Clique em **Salvar integração**. Se você mudar o endereço (slug), o hub abre o detalhe no novo endereço.

Trocar o endereço altera a URL da integração, então links salvos com o endereço antigo deixam de funcionar.

### Excluir uma integração {#excluir-uma-integracao}

Excluir é permanente e remove também os vínculos da integração com os serviços. Por isso o hub pede que você digite o nome da integração.

1. No fim do detalhe, na **Zona de perigo**, clique em **Excluir integração**. O modal explica o efeito, por exemplo "Remove a integração, os endereços cadastrados e os 3 vínculos com serviços. Não dá para desfazer."
2. O campo pede "Digite" o nome da integração "para confirmar". Digite o nome exatamente como aparece no título. O botão vermelho **Excluir integração** só habilita quando o texto confere.
3. Clique em **Excluir integração**. O hub volta para a lista.

Se o nome digitado não bater, o hub responde "O nome digitado não confere com o da integração." e nada é excluído.

### Ligar a integração a um serviço

O cadastro da integração não a liga a nenhum serviço. A ligação é feita na aba **Integrações** da [página do serviço](/uso/servico), no modal **Ligar integração externa**, onde você escolhe a relação do serviço com ela. Nessa aba, os botões **PostgreSQL** e **RabbitMQ** são atalhos que cadastram a integração e já a ligam.

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
