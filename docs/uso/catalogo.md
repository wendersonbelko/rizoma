---
description: "A tela inicial do Rizoma, o Catálogo de APIs: busca, filtro por tag, colunas da tabela, ambientes com a versão publicada, ligações, visibilidade e paginação."
---

# Catálogo

O Catálogo é a tela inicial do hub: a lista de todos os serviços cadastrados, com busca, o time responsável, a versão publicada em cada ambiente e um resumo das ligações. Esta página é para quem consulta o hub no dia a dia e quer achar rápido o serviço certo.

## Para que serve

Use o Catálogo para descobrir quais APIs existem na empresa, quem cuida de cada uma e em que versão ela está em cada ambiente. De cada linha você chega direto à documentação do serviço, ou ao ambiente que interessa.

## Quem vê

Toda pessoa com acesso ativo vê o Catálogo. A permissão necessária é a de ver o catálogo, obrigatória para todos os papéis, então não dá para retirá-la de ninguém.

Nem todo serviço aparece para todo mundo (RN-30):

- serviços com visibilidade **Toda a empresa** aparecem para qualquer pessoa ativa;
- serviços com visibilidade **Só o time responsável** aparecem apenas para as pessoas do time e para quem tem a permissão de ver serviços restritos de outros times;
- serviços **arquivados** não aparecem no Catálogo.

A visibilidade é decidida na consulta, então a contagem e a paginação refletem só o que você pode ver.

## O que aparece na tela

![Catálogo de APIs](/prints/04-catalogo.png)

*O Catálogo. A tabela atual tem as colunas Serviço, Time, Ambientes e Ligações.*

### Cabeçalho e busca

O título da página é **Catálogo de APIs**. Abaixo dele, o hub mostra quantos serviços você vê (por exemplo, "137 serviços") e lembra que "a versão de cada ambiente aparece ao lado".

O campo **Buscar por nome, slug ou descrição** filtra a lista. Digite o termo e aperte Enter. A busca:

- procura no nome e na descrição sem diferenciar maiúsculas de minúsculas;
- procura no slug do serviço (o identificador que aparece na URL, como `pedidos-api`);
- volta para a página 1 quando você faz uma nova busca, mantendo o **Por página** escolhido.

### Filtro por tag

Cada serviço pode ter tags, mostradas como pílulas com `#` (por exemplo, `#checkout`). Clique numa tag para listar só os serviços com ela. Enquanto o filtro está ativo, aparece a faixa "Filtrando pela tag" com a tag e o link **Remover filtro**. A tag pode ser combinada com a busca por texto.

### Colunas da tabela

Os serviços aparecem em ordem alfabética pelo nome.

| Coluna | O que mostra |
|---|---|
| **Serviço** | O nome (link para a página do serviço), a situação quando não é "Em produção", a descrição em uma linha e as tags. |
| **Time** | O time responsável, ou "sem time" em cinza. |
| **Ambientes** | Um chip por ambiente que já tem spec publicada, com o identificador do ambiente e a versão da spec. Se nenhum ambiente tem spec, aparece o selo **sem spec**. |
| **Ligações** | Quantas ligações saem e chegam ("2 saem · 1 chega") e, se houver, quantas integrações externas o serviço usa. Some em telas estreitas. |

Detalhes das colunas:

- **Situação.** Serviços em produção não ganham selo, porque é o normal. **Experimental** aparece em destaque de atenção e **Descontinuado** em vermelho.
- **Chips de ambiente.** A cor identifica o ambiente, e o ambiente de produção leva um escudo, para não depender só da cor. Clicar num chip abre a página do serviço já nesse ambiente.
- **Versão.** É o número que a spec declara em `info.version`, da versão mais recente publicada naquele ambiente.
- **Ligações.** "Saem" são as dependências do serviço (ele consome ou publica); "chegam" são os serviços que dependem dele. Para ver o desenho completo, use o [Mapa de ligações](/uso/mapa).

### Paginação

No rodapé da tabela fica a barra de paginação, igual em todas as listagens do hub:

- "Mostrando 21–40 de 137 serviços" indica o trecho atual e o total;
- **Por página** oferece 10, 20, 50 ou 100 itens (o padrão do Catálogo é 10);
- os botões **Anterior** e **Próxima** e os números de página levam a outra parte da lista.

A barra aparece mesmo quando só há uma página. A página e o tamanho vão para a URL (`?page=2&size=50`), junto com a busca (`?q=pagamentos`) e a tag (`?tag=checkout`), então você pode copiar o endereço e mandar para alguém, e os filtros continuam ao trocar de página.

### Estados vazios

| Situação | O que aparece |
|---|---|
| Nenhum serviço cadastrado ainda | "O catálogo ainda está vazio". Quem pode cadastrar vê o botão **+ Cadastrar meu primeiro serviço**; os demais leem "Peça a um mantenedor ou administrador para cadastrar o primeiro serviço." |
| A busca ou a tag não acha nada | "Nenhum serviço corresponde à busca", com a dica de tentar outro termo ou remover a tag e o botão **Limpar filtros**. |

## O que dá para fazer

### Achar um serviço

1. Digite parte do nome, do slug ou da descrição no campo de busca e aperte Enter.
2. Se a lista ainda estiver grande, clique numa tag para restringir.
3. Clique no nome do serviço para abrir a [página do serviço](/uso/servico).

### Abrir a documentação de um ambiente específico

1. Localize o serviço na tabela.
2. Na coluna **Ambientes**, clique no chip do ambiente (por exemplo, `hml 2.3.1`).
3. A página do serviço abre já nesse ambiente, na aba **Documentação da API**.

### Cadastrar o primeiro serviço

Quando o catálogo está vazio e você tem permissão, o botão **+ Cadastrar meu primeiro serviço** leva ao assistente **Novo serviço**, em [Serviços e repositórios](/admin/servicos-e-vinculos).

### Usar no celular

A tabela se adapta a telas estreitas: a coluna **Ligações** some e o menu vira uma barra horizontal no topo.

![Catálogo no celular](/prints/14-celular-catalogo.png)

*O Catálogo numa tela de celular.*

## Regras importantes

- **Visibilidade (RN-30).** Serviço restrito ao time não existe para quem está fora dele: não aparece na lista, no mapa nem por URL direta.
- **Arquivados.** Saem do Catálogo e do mapa. Só quem pode gerenciar o serviço ainda o abre.
- **Um serviço, um time.** Cada serviço tem no máximo um time responsável, mostrado na coluna **Time**.
- **Sem spec.** O selo **sem spec** só quer dizer que nenhum ambiente recebeu uma spec ainda. A [página do serviço](/uso/servico) explica como ela chega (CI, arquivo no repositório, URL ou importação manual).

## Próximos passos

- [Página do serviço](/uso/servico): o que há dentro de cada serviço.
- [Mapa de ligações](/uso/mapa): as dependências entre serviços, integrações e times.
- [Integrações externas](/uso/integracoes): as APIs de terceiros, filas e bancos usados pelos serviços.
