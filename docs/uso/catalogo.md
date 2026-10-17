---
description: "A tela inicial do Rizoma, o Catálogo: busca, filtros por time, tipo e situação, atalhos Sem spec e Meus serviços, ponto de saúde, ambientes com a versão publicada, vínculos, link Editar, visibilidade e paginação."
---

# Catálogo

O Catálogo é a tela inicial do hub: a lista de todos os serviços cadastrados, com busca, filtros, o time responsável, a versão publicada em cada ambiente e um resumo dos vínculos. Esta página é para quem consulta o hub no dia a dia e quer achar rápido o serviço certo.

## Para que serve

Use o Catálogo para descobrir quais APIs existem na empresa, quem cuida de cada uma e em que versão ela está em cada ambiente. De cada linha você chega direto à documentação do serviço, ou ao ambiente que interessa.

## Quem vê

Toda pessoa com acesso ativo vê o Catálogo. A permissão necessária é a de ver o catálogo, obrigatória para todos os papéis, então não dá para retirá-la de ninguém.

Nem todo serviço aparece para todo mundo (RN-30):

- serviços com visibilidade **Toda a empresa** aparecem para qualquer pessoa ativa;
- serviços com visibilidade **Só o time responsável** aparecem apenas para as pessoas do time e para quem tem a permissão de ver serviços restritos de outros times;
- serviços **arquivados** não aparecem no Catálogo.

A visibilidade é decidida na consulta, então a contagem, os filtros e a paginação refletem só o que você pode ver.

## O que aparece na tela

![Catálogo de APIs, de uma versão anterior da interface](/prints/04-catalogo.png)

*O Catálogo, numa versão anterior da interface. Hoje a tela tem filtros acima da lista, um ponto de saúde antes do nome e o link Editar no fim da linha.*

### Cabeçalho e busca

O título da página é **Catálogo**. Abaixo dele, o hub mostra quantos serviços você vê (por exemplo, "137 serviços") e lembra que "a versão de cada ambiente aparece ao lado". Com algum filtro ligado, a frase vira "12 serviços com estes filtros".

O campo de busca, com o texto "Buscar por nome, slug ou endpoint", filtra a lista. Digite o termo e aperte Enter. A busca:

- procura no nome e na descrição sem diferenciar maiúsculas de minúsculas;
- procura no slug do serviço (o identificador que aparece na URL, como `pedidos-api`);
- procura nos endpoints da spec: digite um caminho (`/pedidos`) ou o método com o caminho (`GET /pedidos`) para achar quem oferece aquela operação;
- volta para a página 1 quando você faz uma nova busca, mantendo o **Por página** escolhido.

### Filtros

Abaixo da busca ficam os filtros. Os três seletores aplicam a escolha na hora, sem botão **Aplicar**:

| Filtro | Opções |
|---|---|
| **Todos os times** | Os times que têm pelo menos um serviço que você vê, mais **Sem time** quando existe algum serviço sem time. |
| **Todos os tipos** | **API**, **Frontend** e **Worker**. |
| **Todas as situações** | **Experimental**, **Em produção** e **Descontinuado**. |

Ao lado dos seletores há dois atalhos em forma de pílula (a ativa fica destacada; clique de novo para desligar):

- **Sem spec**: só os serviços que não têm spec atual em nenhum ambiente, os mesmos que mostram o selo **Sem spec** na linha;
- **Meus serviços**: só os serviços dos times de que você participa. Quem não está em nenhum time não vê este atalho.

Os filtros se combinam entre si e com a busca. Quando algum está ligado, aparece o link **Limpar filtros**, que tira todos e mantém o **Por página** escolhido.

### Filtro por tag

Cada serviço pode ter tags (por exemplo, `#checkout`). Elas aparecem no cabeçalho da [página do serviço](/uso/servico), e clicar numa tag lá abre o Catálogo só com os serviços que a têm. Enquanto o filtro está ativo, aparece a pílula **Tag #checkout ×**: clique nela para tirar. A tag pode ser combinada com a busca e com os outros filtros.

### O endereço guarda os filtros

Cada filtro tem um parâmetro na URL, em inglês, então você pode copiar o endereço e mandar a lista já filtrada para alguém:

| Parâmetro | Valores | Exemplo |
|---|---|---|
| `q` | O texto da busca | `?q=pagamentos` |
| `team` | O slug do time, ou `_none` para serviços sem time | `?team=pagamentos` |
| `kind` | `API`, `FRONTEND` ou `WORKER` | `?kind=WORKER` |
| `lifecycle` | `experimental`, `production` ou `deprecated` | `?lifecycle=deprecated` |
| `nospec` | `1` para só os serviços sem spec | `?nospec=1` |
| `mine` | `1` para só os serviços dos seus times | `?mine=1` |
| `tag` | A tag | `?tag=checkout` |

Um valor que não existe (um `kind` desconhecido, por exemplo) é ignorado. Trocar qualquer filtro volta a lista para a página 1, e os filtros continuam ao trocar de página.

### A lista

Os serviços aparecem em ordem alfabética pelo nome, numa linha compacta cada um:

| Coluna | O que mostra |
|---|---|
| **Serviço** | O ponto de saúde, o nome (link para a página do serviço), o selo do tipo (**API**, **Frontend** ou **Worker**), o selo da situação quando não é "Em produção" e uma linha da descrição. |
| **Time** | O time responsável, ou "sem time" em cinza. |
| **Ambientes** | Uma pílula por ambiente que já tem spec atual, com o identificador do ambiente e a versão da spec. Se nenhum ambiente tem spec, aparece o selo **Sem spec**. |
| **Vínculos** | Um resumo como "1 ↗ · 2 ↙ · 1 externa": quantos vínculos saem, quantos chegam e quantas integrações externas o serviço usa. Some em telas estreitas. |
| Ações (sem título na tela) | O link **Editar**, só para quem pode gerenciar aquele serviço. |

Detalhes das colunas:

- **Ponto de saúde.** Um ponto cheio quer dizer que o serviço tem spec atual no ambiente de produção. Um anel âmbar (vazio) quer dizer que não tem. Como a cor sozinha não basta, a forma também muda. Uma legenda abaixo da tabela explica os dois ("Tem spec atual em produção" e "Sem spec em produção"). Se a instalação não marcou nenhum ambiente como produção, vale a spec atual de qualquer ambiente, e a legenda diz só "Tem spec atual" e "Sem spec".
- **Situação.** Serviços em produção não ganham selo, porque é o normal. **Experimental** aparece em destaque de atenção e **Descontinuado** em vermelho.
- **Pílulas de ambiente.** A cor identifica o ambiente, e o ambiente de produção leva um escudo, para não depender só da cor. Clicar numa pílula abre a página do serviço já nesse ambiente.
- **Versão.** É o número que a spec declara em `info.version`, da versão mais recente publicada naquele ambiente.
- **Vínculos.** A seta ↗ conta as dependências do serviço (ele consome ou publica); a seta ↙ conta os serviços que dependem dele. Passe o mouse sobre o resumo para ver a explicação por extenso. Para ver o desenho completo, use o [Mapa de ligações](/uso/mapa).
- **Editar.** Leva a `/services/<slug>/edit`, a edição do serviço, sem passar pela lista de gestão do admin. Só aparece se o seu papel tem a permissão de editar serviços e o serviço é de um time seu (ou você pode editar qualquer serviço). A coluna não existe para quem não tem a permissão.

As tags e a lista do que o serviço oferece e usa não aparecem mais na linha: ficam na página do serviço.

### Paginação

No rodapé da tabela fica a barra de paginação, igual em todas as listagens do hub:

- "Mostrando 21–40 de 137 serviços" indica o trecho atual e o total;
- **Por página** oferece 10, 20, 50 ou 100 itens (o padrão do Catálogo é 10);
- os botões **Anterior** e **Próxima** e os números de página levam a outra parte da lista.

A barra aparece mesmo quando só há uma página. A página e o tamanho vão para a URL (`?page=2&size=50`), junto com os filtros da seção anterior.

### Estados vazios

| Situação | O que aparece |
|---|---|
| Nenhum serviço cadastrado ainda | "O catálogo ainda está vazio". Quem pode cadastrar vê o botão **Cadastrar meu primeiro serviço**; os demais leem "Peça a um mantenedor ou administrador para cadastrar o primeiro serviço." |
| A busca ou algum filtro não acha nada | "Nenhum serviço corresponde aos filtros", com a dica "Tente outro termo ou tire algum filtro." e o botão **Limpar filtros**. |

## O que dá para fazer

### Achar um serviço

1. Digite parte do nome, do slug, da descrição ou de um endpoint no campo de busca e aperte Enter.
2. Se a lista ainda estiver grande, escolha um **time**, um **tipo** ou uma **situação**, ou ligue **Sem spec** ou **Meus serviços**.
3. Clique no nome do serviço para abrir a [página do serviço](/uso/servico).

De qualquer tela, o atalho **Ctrl+K** (**⌘K** no Mac) abre a busca global, que também acha serviços pelo nome, slug ou endpoint. Veja [Buscar e criar rápido](/uso/primeiro-acesso).

### Abrir a documentação de um ambiente específico

1. Localize o serviço na tabela.
2. Na coluna **Ambientes**, clique na pílula do ambiente (por exemplo, `hml 2.3.1`).
3. A página do serviço abre já nesse ambiente, na aba **Documentação da API**.

### Ver o que está sem spec

1. Clique em **Sem spec**.
2. A lista mostra só os serviços sem spec atual em nenhum ambiente. Eles têm o anel âmbar antes do nome.
3. Abra um deles: a [página do serviço](/uso/servico) mostra os próximos passos para ele aparecer completo.

### Editar um serviço da lista

Se você gerencia o serviço, clique em **Editar** no fim da linha. A edição abre numa tela própria, descrita em [Editar e arquivar serviços](/admin/editar-servico).

### Cadastrar o primeiro serviço

Quando o catálogo está vazio e você tem permissão, o botão **Cadastrar meu primeiro serviço** leva à página **Serviços** e já abre o formulário **Novo serviço**. Veja [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos).

### Usar no celular

A tabela se adapta a telas estreitas: a coluna **Vínculos** some e o menu vira uma barra horizontal no topo.

![Catálogo no celular, de uma versão anterior da interface](/prints/14-celular-catalogo.png)

*O Catálogo numa tela de celular, numa versão anterior da interface.*

## Regras importantes

- **Visibilidade (RN-30).** Serviço restrito ao time não existe para quem está fora dele: não aparece na lista, no mapa nem por URL direta.
- **Arquivados.** Saem do Catálogo e do mapa. Só quem pode gerenciar o serviço ainda o abre.
- **Um serviço, um time.** Cada serviço tem no máximo um time responsável, mostrado na coluna **Time**.
- **Sem spec.** O selo **Sem spec** só quer dizer que nenhum ambiente recebeu uma spec ainda. A [página do serviço](/uso/servico) explica como ela chega (CI, arquivo no repositório, URL ou importação manual).
- **Filtros em SQL.** Os filtros são aplicados na consulta, então o total e a paginação são sempre os reais.

## Próximos passos

- [Página do serviço](/uso/servico): o que há dentro de cada serviço.
- [Mapa de ligações](/uso/mapa): as dependências entre serviços, integrações e times.
- [Integrações externas](/uso/integracoes): as APIs de terceiros, filas e bancos usados pelos serviços.
