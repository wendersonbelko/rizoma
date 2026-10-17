---
description: "A aba Regras de negócio de um serviço no Rizoma: páginas em Markdown escritas pelo time, como criar, editar e excluir, o que o Markdown aceita e quem pode editar."
---

# Regras de negócio

A aba **Regras de negócio** de um serviço guarda a documentação que a spec OpenAPI não cobre: o que o serviço faz, as regras que ele aplica, os pontos de atenção e o glossário. São páginas em Markdown, escritas e mantidas pelo time responsável. Esta página é para quem lê essas regras e para quem as escreve.

::: info Não confunda com os códigos RN-xx
Esta aba é a documentação de negócio **de cada serviço**. Os códigos RN-01, RN-02… que aparecem em outras páginas desta documentação são as regras do **próprio Rizoma**, listadas em [Regras de negócio (referência)](/referencia/regras-de-negocio).
:::

## Para que serve

Uma spec descreve endpoints, parâmetros e respostas, mas não explica por que um pedido só pode ser cancelado em certas condições ou o que acontece quando o estoque acaba. Essas regras vivem na cabeça de quem escreveu o serviço. A aba as coloca ao lado da documentação da API, no mesmo lugar em que quem consome procura.

## Quem vê

| Ação | Permissão |
|---|---|
| Ler as páginas | Ver o catálogo e enxergar o serviço (RN-30). Todos os papéis. |
| Criar, editar e excluir páginas | Editar regras de negócio, mais fazer parte do time responsável pelo serviço (Mantenedor, Administrador e Proprietário, por padrão). |

Quem tem a permissão de editar qualquer serviço (Administrador e Proprietário, por padrão) edita as regras de qualquer serviço, mesmo sem ser do time. Serviços arquivados não aceitam edição. Veja [Papéis e permissões](/referencia/permissoes).

## O que aparece na tela

A aba tem duas colunas:

- **À esquerda**, a lista de páginas do serviço, com o título de cada uma. A página aberta fica destacada. Quem pode editar vê também **+ Nova página**. Uma nota lembra que "As regras valem para todos os ambientes.": o seletor de ambiente não muda o conteúdo desta aba.
- **À direita**, a página aberta: o título, a data ("Atualizado em 24/09/2026"), o conteúdo em Markdown já formatado e, para quem edita, o link **Editar** ao lado da data e, no fim, a **Zona de perigo** com a ação **Excluir esta página**.

Uma página sem conteúdo mostra "Página vazia." A página aberta por padrão é a primeira da lista. O endereço guarda a página aberta, por exemplo `/services/pedidos-api?tab=rules&doc=regras-de-negocio`.

Criar e editar abrem num modal que depende do endereço: **+ Nova página** acrescenta `edit=new` e **Editar** acrescenta `edit=1`. Ao fechar o modal, você volta para a aba, na página que estava lendo.

Quando o serviço ainda não tem nenhuma página, a aba mostra "Nenhuma regra de negócio documentada" e a sugestão de descrever como o serviço funciona, as regras que ele aplica e os pontos de atenção. Quem pode editar vê o botão **Escrever a primeira página**.

## O que dá para fazer

### Criar uma página

1. Na aba **Regras de negócio**, clique em **+ Nova página** (ou em **Escrever a primeira página**).
2. No modal **Nova página**, preencha o **Título da página** (obrigatório, de 2 a 80 caracteres), por exemplo "Regras de cobrança".
3. Escreva o conteúdo. O editor já vem com um modelo, que você troca ou completa:

   ```markdown
   ## Como funciona

   Explique o fluxo principal em poucas frases.

   ## Regras de negócio

   - **RN-01** — ...
   - **RN-02** — ...

   ## Pontos de atenção

   > Coisas que costumam dar problema em produção.

   ## Glossário

   | Termo | Significado |
   |---|---|
   | | |
   ```

4. Clique em **Criar página**. O hub salva e abre a página criada.

O rodapé do modal tem **Cancelar** à esquerda e **Criar página** à direita. Se você digitou algo, **Cancelar**, o **×**, o Esc e o clique fora perguntam "Descartar o que você digitou?" antes de fechar.

O endereço da página (`doc=`) é gerado a partir do título e não muda depois, mesmo que você renomeie a página. Se já existir uma página com o mesmo título, o hub acrescenta um número ao final do endereço (`regras-2`).

### Editar uma página

1. Abra a página e clique em **Editar**, ao lado da data.
2. No modal **Editar:** com o título da página, altere o título e o conteúdo.
3. Clique em **Salvar página**. Para desistir, use **Cancelar**.

### Escrever com pré-visualização

O editor tem três modos, alternados pelos botões acima do texto:

| Modo | O que mostra |
|---|---|
| **Escrever** | Só o campo de texto, em fonte monoespaçada. |
| **Lado a lado** | O texto à esquerda e a pré-visualização à direita. Só aparece quando há espaço na tela. |
| **Visualizar** | Só a pré-visualização, do jeito que o leitor vai ver. |

A pré-visualização usa o mesmo renderizador da página publicada, então o que você vê é o que sai. O limite de cada página é de 200 mil caracteres.

### Excluir uma página

Excluir é permanente: o texto foi escrito à mão e não há **Desfazer**. Por isso o hub pede que você digite o título da página.

1. No fim da página, na **Zona de perigo**, clique em **Excluir página**. O modal explica o efeito: "A página e o texto dela são apagados do hub. Se o repositório do serviço estiver conectado, o arquivo dela também sai de lá. Não dá para desfazer."
2. O campo pede "Digite" o título da página "para confirmar". Digite o título exatamente como aparece. O botão vermelho **Excluir página** só habilita quando o texto confere.
3. Clique em **Excluir página**. A aba volta a mostrar a primeira página da lista.

Se o texto não bater, o hub responde "Digite o título da página exatamente como está para confirmar." e nada é excluído. A exclusão fica registrada na [Auditoria](/admin/auditoria).

### Ordem das páginas

As páginas aparecem na ordem em que foram criadas. O hub ainda não tem uma forma de reordená-las.

## Markdown suportado

O hub usa Markdown com as extensões do GitHub (GFM). Você pode usar:

| Recurso | Exemplo |
|---|---|
| Títulos | `## Regras de cancelamento` |
| Negrito, itálico e tachado | `**negrito**`, `*itálico*`, `~~tachado~~` |
| Listas e listas numeradas | `- item` e `1. item` |
| Listas de tarefas | `- [ ] pendente` e `- [x] feito` |
| Tabelas | colunas separadas por barras verticais, com uma linha de traços logo abaixo do cabeçalho |
| Citações | `> Atenção com o prazo` |
| Código em linha e em bloco | `` `codigo` `` e blocos com três crases |
| Links | `[texto](https://exemplo.com)` |

Links para fora do hub abrem em outra aba; links internos (`/services/…`) e âncoras (`#trecho`) abrem na mesma.

### O que não funciona

- **HTML cru.** Etiquetas HTML dentro do texto não são interpretadas (RN-S18). Use as construções do Markdown.
- **Links perigosos.** Endereços com `javascript:` e `data:` são removidos.
- **Imagens de outros sites.** A política de segurança do hub só carrega imagens do próprio hub, de `data:` e dos avatares do GitHub, então uma imagem hospedada fora não aparece.

## Regras importantes

- **Quem edita (RN-22).** Precisa da permissão de editar regras e fazer parte do time do serviço, salvo a permissão de editar qualquer serviço.
- **Valem para todos os ambientes.** Diferente da spec e das variáveis, as regras não são separadas por ambiente.
- **Markdown seguro (RN-S18).** Todo Markdown do hub é renderizado sem HTML cru e sem esquemas de link perigosos.
- **Histórico.** O hub guarda só a versão atual de cada página e a data da última atualização. Para manter histórico de mudanças, mantenha uma cópia do texto num repositório.
- **Cópia no repositório.** Se o serviço tem um repositório de código-fonte ligado e o token do hub consegue gravar nele, salvar uma página grava o arquivo `docs/<endereço da página>.md` no repositório, e excluir a página remove esse arquivo. Se o arquivo no repositório divergiu, o hub não sobrescreve nada: o conflito aparece na aba **Configurações** do serviço.

## Próximos passos

- [Página do serviço](/uso/servico): as outras abas do serviço.
- [Variáveis de ambiente](/uso/variaveis): a configuração por ambiente.
- [Papéis e permissões](/referencia/permissoes): quem pode editar o quê.
