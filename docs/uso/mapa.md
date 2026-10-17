---
description: "O Mapa de ligações do Rizoma, que abre em foco: Foco, alcance (1º grau, 2º grau, Tudo), Tipos, legenda, esmaecimento, endereço com ?focus= e ?depth=, modo Lista, print e o atalho + Vínculo."
---

# Mapa de ligações

O Mapa de ligações desenha as dependências entre serviços, integrações externas, repositórios, times e pessoas. Ele abre **em foco**: um item no centro, com os vizinhos nítidos e o resto esmaecido. Esta página é para quem quer entender quem depende de quem, avaliar o impacto de uma mudança ou registrar um vínculo novo sem sair da tela.

## Para que serve

O mapa responde a perguntas como "quem consome a API de Pedidos?", "que serviços usam esta fila?" e "de que time é este serviço?". Você escolhe um item, vê os vizinhos dele, aumenta o alcance para ver os vizinhos dos vizinhos, ou deixa tudo nítido. Também pode trocar o desenho por uma tabela que funciona só com teclado.

## Quem vê

A tela exige a permissão de ver o mapa, que os papéis Leitor, Mantenedor, Administrador e Proprietário têm por padrão. Sem ela, o item **Mapa de ligações** nem aparece no menu.

O atalho **+ Vínculo** exige a permissão de editar vínculos (Mantenedor, Administrador e Proprietário, por padrão). No formulário que ele abre, o campo **De** só lista os serviços que você mantém. O mapa respeita a visibilidade dos serviços (RN-30): serviços restritos a um time somem para quem está fora dele, junto com os vínculos deles.

## O que aparece na tela

![Mapa de ligações, de uma versão anterior da interface](/prints/06-mapa-completo.png)

*O mapa, numa versão anterior da interface, sem foco. Hoje o mapa abre em foco, com os controles Foco, alcance e Tipos, a legenda no canto e os botões + Vínculo e câmera no alto, à direita.*

A tela tem o título **Mapa de ligações**, a frase "Um clique troca o foco; duplo clique abre o item. O que está fora do foco fica esmaecido, não some.", uma barra de controles e a área do mapa (ou da lista).

### Tipos de nó

Cada tipo de item tem uma forma própria, que a legenda do canto repete. As cores seguem o tema (Claro ou Escuro) e a cor de destaque da marca, definida em [Aparência](/admin/aparencia).

| Tipo de nó | Forma | O que representa |
|---|---|---|
| **Serviços** | Retângulo arredondado com borda contínua | Um sistema do catálogo: API, frontend ou worker. O tipo aparece abaixo do nome. |
| **Integrações externas** | Retângulo arredondado com borda tracejada | Uma API de terceiro, fila, tópico, webhook, banco, cache ou outro. O tipo aparece abaixo do nome. |
| **Repositórios** | Retângulo de cantos retos | Um repositório de código cadastrado. |
| **Times** | Oval | Um time. |
| **Pessoas** | Oval com borda grossa | Uma pessoa ativa que participa de pelo menos um time, identificada pelo nome, por `@usuario` ou por e-mail. |

### Tipos de ligação

As setas mostram o sentido da dependência e, na maioria dos casos, um rótulo:

| Ligação | Rótulo no mapa |
|---|---|
| Serviço consome a API de outro serviço | consome, ou consome via HTTP, gRPC ou WebSocket |
| Serviço publica eventos em outro | publica em |
| Serviço assina eventos de outro | assina |
| Serviços compartilham biblioteca | compartilha lib |
| Serviço depende de outro | depende de |
| Serviço e integração externa | consome, fornece, publica em, assina, lê de, grava em, envia webhook para, recebe webhook de |
| Serviço e repositório | Linha tracejada, rotulada com o papel do repositório (Código-fonte, SDK cliente, Infraestrutura ou Contrato) |
| Time e serviço | mantém |
| Pessoa e time | é membro de |

Nas integrações externas, a seta aponta para o serviço quando o dado sai da integração (consome, assina, lê de, recebe webhook de) e para a integração no sentido contrário.

### Barra de controles

| Controle | O que faz |
|---|---|
| **Mapa** / **Lista** | Alterna entre o desenho e a tabela. |
| **Foco ▾** | Abre uma lista com busca para escolher o item que fica no centro. |
| **1º grau** · **2º grau** · **Tudo** | Define o alcance do foco: só os vizinhos diretos, também os vizinhos deles, ou todos os itens nítidos. |
| **Tipos ▾** | Escolhe quais tipos de item entram no mapa. Avisa "1 oculto" ou "N ocultos" quando algum tipo está de fora. |

À direita da barra, um resumo diz o que está em foco: "87 itens" (com **Tudo** ou sem foco), "12 de 87 itens em foco" ou "Este item não tem ligações nos tipos exibidos.".

### Legenda

No canto inferior direito do mapa fica a legenda fixa: a forma de cada tipo de item que está no mapa, a amostra **Fora do foco** (o esmaecido) e a frase "A seta mostra o sentido da ligação." Ela não atrapalha o mouse: o mapa continua arrastável por baixo dela.

## O que dá para fazer

### Abrir o mapa em foco

O mapa já vem com um item em foco, escolhido assim:

- Se você chegou por um link com `?focus=` (por exemplo, o **Ver no mapa** da [página do serviço](/uso/servico)), o foco é o item do link.
- Sem `?focus=`, o foco é o **serviço mais conectado**: o que tem mais vínculos com serviços, repositórios e integrações (o time responsável não conta, porque todo serviço tem um). Em caso de empate, vale a ordem alfabética.
- Se ainda não existe nenhuma ligação, não há o que destacar e todos os itens ficam nítidos.

### Explorar e focar

1. Abra **Mapa de ligações** no menu. O foco aparece no botão **Foco ▾** e no contorno de destaque do item.
2. Os vizinhos até o alcance escolhido ficam nítidos. O resto fica a 25% de opacidade, sem sumir, e continua clicável: as setas fora do foco também esmaecem e perdem o rótulo.
3. **Clique** num item para levar o foco até ele. O mapa desliza até o novo foco.
4. **Duplo clique** abre o item: a página do serviço, o detalhe da integração ou o repositório no provedor (numa nova aba). Times e pessoas não têm página própria.
5. Arraste o fundo para mover o mapa e use os botões de zoom no canto inferior esquerdo (aumentar, diminuir e ajustar à tela). Os itens não se arrastam, e as posições não mudam quando o foco muda, para você aprender onde as coisas ficam.

O desenho não tem navegação por teclado. Quem usa teclado ou leitor de tela troca o foco por **Foco ▾** e lê as ligações no modo **Lista**.

### Escolher o foco por nome

1. Clique em **Foco ▾**. O botão mostra o item atual ("Foco Pedidos API").
2. Digite no campo **Buscar por nome**. A busca ignora acentos e maiúsculas e também acha pelo tipo ("integração" acha **Integrações externas**).
3. Escolha um item. A lista é agrupada por tipo (Serviços, Integrações externas, Repositórios, Times, Pessoas) e mostra o tipo do serviço ou da integração ao lado do nome. O foco atual leva um ✓.

Use **↑** e **↓** para percorrer, **Home** e **End** para ir ao começo e ao fim, **Enter** para escolher e **Esc** para fechar. A lista só tem itens dos tipos que estão no mapa. Se não achar nada, ela diz "Nada com “termo”. Confira os tipos em “Tipos”.".

### Ajustar o alcance

Os três botões ao lado do **Foco ▾** definem quantos "saltos" a partir do foco ficam nítidos:

| Botão | O que fica nítido |
|---|---|
| **1º grau** | O foco e os vizinhos diretos dele. |
| **2º grau** | Também os vizinhos dos vizinhos. |
| **Tudo** | Todos os itens, sem esmaecer. |

O padrão é **1º grau**. O alcance vale para o desenho, para a lista e para o print.

### Escolher o que aparece

**Tipos ▾** abre um menu com duas partes:

- **O que aparece no mapa**: **Serviços**, **Integrações externas**, **Repositórios**, **Times** e **Pessoas**. Por padrão, só **Pessoas** vem desmarcada.
- **Tipos de serviço**: **API**, **Frontend** e **Worker**. Só aparece com **Serviços** marcado, e as três começam marcadas.

::: tip Filtro escondendo o foco
Se você desmarcar o tipo do item focado (por exemplo, focar num serviço e desmarcar **Serviços**), o pedido de foco deixa de valer: o mapa volta ao serviço mais conectado, se ele ainda estiver à vista, ou mostra tudo nítido.
:::

### Compartilhar o mapa

O foco e o alcance vão para o endereço, sem recarregar a página: `?focus=<id>` e `?depth=2` ou `?depth=all`. Sem `?depth=`, vale o 1º grau. Os ids começam com uma letra que diz o tipo:

| Prefixo | Tipo | Exemplo |
|---|---|---|
| `s:` | Serviço | `?focus=s:<id>` |
| `r:` | Repositório | `?focus=r:<id>` |
| `x:` | Integração externa | `?focus=x:<id>` |
| `t:` | Time | `?focus=t:<id>` |
| `p:` | Pessoa | `?focus=p:<id>` |

Copie o endereço para mandar o mapa já no ponto em que você está. Você também chega ao mapa já focado pelos links **Ver no mapa**, na aba **Integrações** de um serviço e no detalhe de uma integração.

![Mapa focado em um serviço, de uma versão anterior da interface](/prints/07-mapa-foco-pedidos.png)

*O mapa focado em um serviço, numa versão anterior da interface, quando o foco ainda escondia o resto em vez de esmaecer.*

### Usar o modo Lista

O modo **Lista** mostra as ligações em foco numa tabela que dá para percorrer só com o teclado e com leitor de tela. Os filtros de tipo, o foco e o alcance valem nas duas visões: a lista traz as mesmas ligações que estão nítidas no mapa.

A tabela tem uma linha por ligação, em ordem alfabética pelo item de origem:

| Coluna | O que mostra |
|---|---|
| **De** | O item de origem, com o tipo embaixo. O nome é link para o serviço, a integração ou o repositório. |
| **Relação** | A relação, em português: "consome", "publica em", "mantém", "é membro de" ou o papel do repositório. |
| **Para** | O item de destino, com o tipo embaixo. |

Em cada item de **De** e de **Para** há o botão **Focar no mapa**, que leva o foco até ele e volta para o modo **Mapa**.

O cabeçalho da tabela fica fixo, e a lista rola dentro do próprio quadro, porque a página do mapa ocupa a altura da tela. O rodapé tem a mesma paginação de todas as listagens: "Mostrando 1–10 de 87 ligações", **Por página** (10, 20, 50 ou 100) e os números de página. A paginação da lista é feita no navegador e volta para a página 1 sempre que você muda um filtro ou o foco. Sem ligações para o foco atual, aparece "Nenhuma ligação neste foco", com a sugestão de escolher "2º grau" ou "Tudo", ou marcar mais tipos em "Tipos".

### Tirar um print

No modo **Mapa**, a câmera no canto superior direito, abaixo do **+ Vínculo**, baixa uma imagem PNG das ligações em foco: as que estão nítidas na tela naquele momento, com o foco, o alcance e os tipos escolhidos. No modo **Lista**, a câmera não aparece.

1. Clique na câmera. O hub pergunta "Tem certeza que deseja tirar um print?".
2. Clique em **Sim** para gerar o arquivo, ou em **Não** para desistir.

O print leva o nome e o tipo de cada item e o sentido de cada seta, e o registro de quem o gerou fica na [Auditoria](/admin/auditoria), com a frase "gerou um print do mapa de ligações". Se o hub não conseguir registrar, ele avisa "Não foi possível registrar o print. A imagem não foi gerada." e não baixa nada.

### Criar um vínculo pelo botão + Vínculo

Quem tem a permissão de editar vínculos vê o botão **+ Vínculo** no canto superior direito da área do mapa. No modo **Lista**, esse botão não aparece. Ele abre a página **Vínculos** com o formulário **Novo vínculo** já aberto.

1. Deixe em foco o item que será o ponto de partida.
2. Clique em **+ Vínculo**. Passe o mouse para ver "Novo vínculo a partir de" o nome do foco.
3. Se o item em foco for um serviço que você mantém ou um repositório, o campo **De** já vem preenchido com ele. Integração, time e pessoa não entram nesse campo: o formulário abre com **De** em branco. O campo **Para** sempre começa vazio.
4. Escolha o **Para** e o tipo de vínculo e clique em **Criar vínculo**. O botão só habilita com **De** e **Para** escolhidos.

O hub recusa o vínculo nestes casos:

- o mesmo item nos dois lados ("Um item não pode ser vinculado a ele mesmo. Escolha outro em Para.", RN-52). O campo **Para** já esconde o item escolhido em **De**;
- um vínculo que já existe ("Esse vínculo já existe.");
- um serviço de origem que não é do seu time ("Você só altera serviços dos seus times."). Escolha outro item em **De**.

Para remover um vínculo, use a página **Vínculos** em [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos): a remoção tem **Desfazer** por alguns segundos.

## Regras importantes

- **Visibilidade (RN-30).** Serviços restritos ao time desaparecem do mapa, com os vínculos deles, para quem está fora do time.
- **Arquivados.** Serviços arquivados não entram no mapa.
- **Vizinhança (RN-55).** O foco deixa nítidos só os itens até o alcance escolhido e as ligações entre eles. O resto esmaece.
- **Ligações detectadas (RN-53 e RN-54).** Dependências declaradas na spec com `x-api-hub.dependsOn` viram vínculos "consome" marcados como declarados na spec. Você pode removê-los, mas eles voltam na próxima publicação se continuarem declarados.
- **Sem duplicatas (RN-52).** O mesmo vínculo (origem, destino e tipo) não se repete.
- **Permissão no servidor.** Esconder o botão **+ Vínculo** não é o controle de acesso: o servidor confere a permissão a cada criação.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Integrações externas](/uso/integracoes): o que são os nós tracejados do mapa.
- [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos): cadastre e remova vínculos numa tabela.
- [Mapear dependências](/receitas/mapear-dependencias): um passo a passo para deixar o mapa útil.
