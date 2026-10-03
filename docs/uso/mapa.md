---
description: "O Mapa de ligações do Rizoma: tipos de nó, filtros, foco e distância, modo Lista, como criar um vínculo pelo botão + e como a visibilidade afeta o que você vê."
---

# Mapa de ligações

O Mapa de ligações desenha as dependências entre serviços, integrações externas, repositórios, times e pessoas. Esta página é para quem quer entender quem depende de quem, avaliar o impacto de uma mudança ou registrar um vínculo novo sem sair da tela.

## Para que serve

O mapa responde a perguntas como "quem consome a API de Pedidos?", "que serviços usam esta fila?" e "de que time é este serviço?". Você pode ver tudo de uma vez, focar num item e nos vizinhos dele, ou trocar o desenho por uma tabela que também funciona só com teclado.

## Quem vê

A tela exige a permissão de ver o mapa, que os papéis VIEWER, MAINTAINER, ADMIN e OWNER têm por padrão. Sem ela, o item **Mapa de ligações** nem aparece no menu.

O botão **+** abre o cadastro de vínculos e exige a permissão de editar vínculos (MAINTAINER, ADMIN e OWNER, por padrão). O campo **De** só aceita serviços do seu time. O mapa respeita a visibilidade dos serviços (RN-30): serviços restritos a um time somem para quem está fora dele, junto com as ligações deles.

## O que aparece na tela

![Mapa de ligações completo](/prints/06-mapa-completo.png)

*O mapa completo. A versão atual também tem o filtro Integrações externas, o botão + e a câmera de print no canto do mapa.*

A tela tem o título **Mapa de ligações**, uma barra de controles, a área do mapa (ou da lista) e uma dica no rodapé.

### Tipos de nó

Cada tipo de item tem um desenho e uma cor próprios, que seguem o tema escolhido em [Aparência](/admin/aparencia):

| Tipo de nó | Aparência | O que representa |
|---|---|---|
| **Serviços** | Retângulo arredondado, cheio na cor de destaque | Um sistema do catálogo: API, frontend ou worker. O tipo aparece no nó. |
| **Integrações externas** | Retângulo arredondado com borda tracejada | Uma API de terceiro, fila, tópico, webhook, banco, cache ou outro. |
| **Repositórios** | Retângulo de cantos retos | Um repositório de código cadastrado. |
| **Times** | Oval escura | Um time. |
| **Pessoas** | Oval clara | Uma pessoa ativa que participa de pelo menos um time, identificada por `@usuario` ou e-mail. |

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
| Serviço e repositório | Linha tracejada, sem rótulo (o papel aparece na lista) |
| Time e serviço, pessoa e time | Linha suave, sem rótulo |

Nas integrações externas, a seta aponta para o serviço quando o dado sai da integração (consome, assina, lê de, recebe webhook de) e para a integração no sentido contrário.

### Barra de controles

| Controle | O que faz |
|---|---|
| **Mapa** / **Lista** | Alterna entre o desenho e a tabela. |
| Caixas **Serviços**, **Integrações externas**, **Repositórios**, **Times**, **Pessoas** | Escolhem quais tipos de item aparecem. Por padrão, só **Pessoas** vem desmarcada. |
| Caixas **API**, **Frontend**, **Worker** | Restringem os sistemas por tipo. As três começam marcadas. |
| **Distância** | Só aparece quando há um item focado. Vai de 1 a 4 e define até quantos "saltos" de distância a vizinhança mostra. |
| **Mostrar tudo** | Só aparece quando há um item focado. Remove o foco e volta à visão completa. |

Quando você cria um vínculo, um aviso na cor de destaque ("Vínculo criado.") aparece ao lado dos controles por alguns segundos.

## O que dá para fazer

### Explorar e focar

1. Abra **Mapa de ligações** no menu. O mapa mostra tudo o que você pode ver.
2. Arraste o fundo para mover o mapa e use os botões de zoom no canto inferior esquerdo (aumentar, diminuir e ajustar à tela).
3. **Clique** num item para focar nele: o mapa passa a mostrar só o item e a vizinhança dele. O item focado ganha um contorno de destaque.
4. Ajuste a **Distância** para ver vizinhos dos vizinhos (até 4).
5. **Duplo clique** abre o item: a página do serviço, o detalhe da integração ou o repositório numa nova aba. Times e pessoas não têm página própria.
6. Clique em **Mostrar tudo** para sair do foco.

![Mapa focado em um serviço](/prints/07-mapa-foco-pedidos.png)

*O mapa focado em um serviço, com a distância 1 e o link Mostrar tudo.*

Você também chega ao mapa já focado pelos links **Ver no mapa**, na aba **Integrações** de um serviço e no detalhe de uma integração. O foco vai para a URL (`?focus=s:<id>` para serviços e `?focus=x:<id>` para integrações), então dá para compartilhar o link.

::: tip Filtro escondendo o foco
Se você desmarcar o tipo do item focado (por exemplo, focar num serviço e desmarcar **Serviços**), o foco deixa de valer e o mapa mostra tudo o que sobrou.
:::

### Usar o modo Lista

O modo **Lista** mostra as mesmas ligações do mapa numa tabela que dá para percorrer só com o teclado e com leitor de tela. Os filtros de tipo, o foco e a distância valem nas duas visões.

A tabela tem uma linha por ligação, em ordem alfabética pelo item de origem:

| Coluna | O que mostra |
|---|---|
| **De** | O item de origem, com o tipo embaixo. O nome é link para o serviço, a integração ou o repositório. |
| **Relação** | A relação ("consome", "publica em"…). Ligações de time, pessoa e repositório aparecem com o nome técnico, como `OWNS`, `MEMBER` e `SOURCE`. |
| **Para** | O item de destino. |
| **Focar no mapa** | Foca no item de **De** e volta para o modo **Mapa**. |

O rodapé tem a mesma paginação de todas as listagens: "Mostrando 1–10 de 87 ligações", **Por página** (10, 20, 50 ou 100) e os números de página. A paginação da lista é feita no navegador e volta para a página 1 sempre que você muda um filtro ou o foco. Sem ligações para os filtros atuais, aparece "Nenhuma ligação com esses filtros", com a sugestão de marcar mais tipos ou clicar em **Mostrar tudo**.

### Tirar um print

No modo **Mapa**, a câmera no canto superior direito baixa uma imagem PNG das ligações que estão na tela naquele momento: os filtros, o foco e a distância valem para o desenho. No modo **Lista**, a câmera não aparece. O hub pergunta "Tem certeza que deseja tirar um print?" antes de gerar o arquivo. O print leva nome, tipo e o sentido de cada seta, e fica registrado na auditoria ("Print do mapa gerado").

### Criar um vínculo pelo botão +

Quem tem a permissão de editar vínculos vê um botão redondo **+** no canto superior direito da área do mapa. No modo **Lista**, esse botão não aparece. Ele abre a aba **Vínculos** de [Serviços e repositórios](/admin/servicos-e-vinculos), no formulário **Novo vínculo**.

1. Clique nos itens que quer usar como ponto de partida. Se houver mais de um, vale o **último** da seleção.
2. Clique no botão **+**.
3. Se esse último item for um serviço ou um repositório, o campo **De** já vem preenchido com ele. Time, pessoa e integração não entram nesse campo: o formulário abre em branco.
4. Complete o **Para** e o tipo de ligação naquela tela e clique em **Criar vínculo**.

O hub recusa o vínculo nestes casos:

- o mesmo item nos dois lados ("Um item não pode ser ligado a ele mesmo.", RN-52);
- um vínculo que já existe ("Esse vínculo já existe.");
- um serviço de origem que não é do seu time ("Você só cria vínculos a partir de serviços dos seus times."). Escolha outro lado em **De**.

Para remover um vínculo, use a aba **Vínculos** em [Serviços e repositórios](/admin/servicos-e-vinculos).

## Regras importantes

- **Visibilidade (RN-30).** Serviços restritos ao time desaparecem do mapa, com as ligações deles, para quem está fora do time.
- **Arquivados.** Serviços arquivados não entram no mapa.
- **Vizinhança (RN-55).** Focar num item mostra só os itens até a distância escolhida, e as ligações entre eles.
- **Ligações detectadas (RN-53 e RN-54).** Dependências declaradas na spec com `x-api-hub.dependsOn` viram ligações "consome" marcadas como declaradas na spec. Você pode removê-las, mas elas voltam na próxima publicação se continuarem declaradas.
- **Sem duplicatas (RN-52).** A mesma ligação (origem, destino e tipo) não se repete.
- **Permissão no servidor.** Esconder o botão **+** não é o controle de acesso: o servidor confere a permissão a cada criação.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Integrações externas](/uso/integracoes): o que são os nós tracejados do mapa.
- [Serviços e repositórios](/admin/servicos-e-vinculos): cadastre e remova vínculos numa tabela.
- [Mapear dependências](/receitas/mapear-dependencias): um passo a passo para deixar o mapa útil.
