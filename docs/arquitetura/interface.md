---
description: Como a interface do Rizoma é montada — componentes únicos, modal-padrão, paginação pela URL, tema por pessoa, busca ⌘K, tour e os testes que impedem tabela feita à mão.
---

# Interface e design system

A interface é um conjunto pequeno de peças. Listagem, vazio, aviso, selo, aba, modal e zona de perigo não são redesenhados em cada tela. Os testes em `apps/web/test/unit/design-system.test.ts` falham se alguém montar `<table>` à mão, uma lista com divisórias à mão, ou uma `DataTable` de listagem sem paginação.

Todo o texto visível é português do Brasil. Botão e título levam maiúscula só na primeira letra. O botão diz o efeito, em verbo e objeto ("Criar serviço", "Gerar token"), e não "OK". Plural usa `plural()` e `countLabel()` (`packages/core/src/text.ts`). Data e número usam `pt-BR`.

## Peças

| Peça | Onde | Uso |
|---|---|---|
| `DataTable` e células | `components/table.tsx` | Toda listagem tabular. O cabeçalho fixo cola na rolagem da página; só a lista do mapa rola por dentro |
| `CardList` | `components/card-list.tsx` | Item que não cabe numa linha |
| `Pagination` | `components/pagination.tsx` | Página e tamanho na URL (`?page=` e `?size=`) |
| `EmptyState` | `components/empty-state.tsx` | Lista vazia, com a ação que tira do vazio |
| `Badge`, `Notice`, `Panel`, `Field`, `Button` | `components/ui.tsx` | Selo, faixa, formulário e botão |
| `TabNav` | `components/tab-nav.tsx` | Abas pela URL |
| `FormModal` e `ModalActions` | `components/form-modal.tsx` | O modal-padrão: criar ou editar uma entidade, fora da lista |
| `DirtyForm` | `components/save-bar.tsx` | Formulário de edição que só mostra a barra de salvar quando há mudança |
| `DangerZone` e `DangerAction` | `components/danger-zone.tsx` | Ação destrutiva, num estilo só |
| `UndoButton` | `components/undo-button.tsx` | Remoção reversível, com **Desfazer** por alguns segundos |
| `Breadcrumb` | `components/breadcrumb.tsx` | Trilha "Catálogo › serviço › Editar" nas páginas de detalhe |
| `NameSlugFields` | `components/name-slug-fields.tsx` | Nome e endereço (slug) gerado, em texto pequeno |
| `CommandPalette` e `QuickCreate` | `components/command-palette.tsx`, `components/quick-create.tsx` | Busca global ⌘K e o botão **+ Novo** |
| `UserMenu` e `ThemeSwitch` | `components/user-menu.tsx`, `components/theme-switch.tsx` | Menu da conta, com o tema da pessoa e o **Sair** |
| `FilterChips` | `components/filter-chips.tsx` | Um filtro por vez, na URL |
| `Markdown` | `components/markdown.tsx` | Regras de negócio, sem HTML cru |

Uma linha de tabela é um componente próprio (`*-row.tsx`). A página não desenha a linha.

## Navegação

O menu lateral vem de `HUB_NAV` (`packages/core/src/hub-nav.ts`), em quatro grupos: **Explorar** (Catálogo, Mapa de ligações, Integrações externas), **Cadastros** (Serviços, Repositórios, Vínculos, Tokens de CI, Times), **Pessoas** (Pessoas e acesso, Permissões) e **Sistema** (Auditoria, Configurações). A regra é uma só: o item do menu tem o mesmo nome do título da página que ele abre. A visibilidade de cada item é a mesma que a página exige (`requireNavAccess`), então ninguém vê um item que leva a um 404.

Páginas de detalhe usam `Breadcrumb` em vez de um link solto para a lista. No topo da barra lateral ficam o botão **Buscar** (**Ctrl+K**, **⌘K** no Mac) e o **+ Novo**; no pé, o menu da conta.

### Busca global e atalhos de criação

A busca abre por **Ctrl+K**/**⌘K** ou pelo botão, num `<dialog>` modal com campo `combobox`. Tem três seções: **Ir para** (itens do menu que a pessoa vê), **Serviços** (Server Action; busca por nome, slug, descrição ou endpoint, a partir de 2 letras, respeitando RN-30) e **Criar**. A classificação do que casa vive em `packages/core/src/command-search.ts`.

Os atalhos de **Criar** e o **+ Novo** vêm de `CREATE_SHORTCUTS` (`packages/core/src/create-shortcuts.ts`), filtrados pela mesma permissão do botão de criar da tela. Cada atalho aponta para a página do cadastro com o `#id` do modal-padrão (`#new-service`, `#new-repository`, `#new-link`, `#new-token`, `#new-integration`, `#new-team`, `#invite`), e o `FormModal` abre quando o hash aparece. Esconder o atalho não é autorização: a Server Action de cada cadastro confere de novo.

## Paginação e filtros

Os filtros e a página ficam na query string, para o link ser compartilhável e o voltar do navegador funcionar. A consulta aplica o filtro no SQL, inclusive a visibilidade (RN-30), para o total da paginação ser o que a pessoa realmente pode ver. Os tamanhos são 10, 20, 50 e 100.

Em tela estreita o menu vira uma barra no topo e as colunas marcadas com `hideBelow` somem.

## Tema e marca

Dois temas fixos vivem em `packages/core/src/themes.ts`: Claro e Escuro. Cada pessoa escolhe o dela no menu da conta (**Claro**, **Escuro** ou **Sistema**, que segue o sistema operacional). A escolha vai para `User.themePreference` (vale em qualquer aparelho) e para o cookie `rizoma-theme`, que o servidor lê para pintar o `<html>` já no tema certo, sem piscar.

O admin define só a **marca**: o nome do sistema e a cor de destaque, guardada em `Installation.themeOverrides` como `{ accent }`. As duas paletas nascem dessa cor, então claro e escuro ficam juntos e legíveis. O layout escreve `--color-*` e o Tailwind lê essas variáveis (RN-110). Uma cor de destaque que deixaria links e botões abaixo de 4,5:1 é recusada (RN-112). Veja [Aparência](/admin/aparencia).

Os tokens são `paper`, `sheet`, `raised`, `field`, `ink`, `muted`, `line`, `line-strong`, `accent`, `accent-ink`, `wait`, `danger`, `overlay` e `shadow`. Três deles existem por causa dos modais e das bordas:

- `raised` é o terceiro degrau de elevação (fundo, painel e modal ou pop-over), para o modal não se confundir com a página no tema escuro.
- `line-strong` é a borda de campo, com pelo menos 3:1 de contraste (WCAG 1.4.11). `line` fica sutil, para divisórias.
- `overlay` e `shadow` pintam o fundo atrás do modal e a sombra dos pop-overs.

Nenhuma tela usa cor fixa. O renderizador da spec (Scalar) segue o tema da pessoa.

## Tour

No primeiro acesso o tour (`driver.js`) é um panorama único, no Catálogo: cobre o menu completo e cada um dos quatro grupos, a busca, o **+ Novo** e o botão **?**. Ele não percorre as outras telas. O hub fica bloqueado até a pessoa concluir. A busca e o **+ Novo** ficam desligados durante qualquer tour. O botão **?** de cada tela reexplica aquela tela e oferece o tour dela. Veja [Primeiro acesso](/uso/primeiro-acesso).

## Formulários

### O modal-padrão

Criar ou editar uma entidade (serviço, repositório, vínculo, token, time, pessoa, integração, provedor de login, ambiente) abre um `FormModal`. A lista fica na tela; o formulário não. Todos os modais têm a mesma forma:

- cabeçalho com o título e o botão ×, corpo com rolagem própria e rodapé fixo (`ModalActions`);
- **Cancelar** à esquerda e a ação principal à direita, com verbo e objeto;
- Esc, clique fora, × e **Cancelar** pedem "Descartar o que você digitou?" quando algo foi digitado. Um campo com `data-dirty-ignore` (a frase de confirmação de uma ação destrutiva) não conta como digitação;
- o foco abre no primeiro campo editável e volta ao botão que abriu o modal;
- o `id` do modal abre pelo endereço (`#new-service`), e o hash é limpo ao fechar;
- campos obrigatórios levam `*` e começam vazios, e os opcionais ficam em **Detalhes opcionais**. O endereço (slug) aparece como texto pequeno abaixo do nome, com **editar endereço**.

O modal de um segredo ou de um convite permanece aberto depois do sucesso (o do token mostra o valor com **Copiar token**), para a pessoa copiar o valor.

### Edição e salvar

Formulário de edição ou configuração usa `DirtyForm`: a barra "Alterações não salvas", com **Descartar** e **Salvar**, só aparece quando algo mudou, e a página avisa antes de sair com edição pendente. A edição do serviço salva dados e origem da spec num formulário só. Configuração da instalação que é o próprio conteúdo da seção (organização, SMTP, regras de acesso) continua na página, cada formulário salvando sozinho.

### Ações destrutivas

Todas usam o mesmo estilo. `DangerZone` reúne, no fim da página, um `DangerAction` por ação: botão com contorno vermelho que abre uma confirmação. Ação reversível (arquivar um serviço) pede só a confirmação. Ação irreversível pede digitar o nome do recurso, ou uma palavra que a Server Action confere (`ENCERRAR`). Remoção de uma linha que dá para recriar (vínculo, variável, canal, membro) usa `UndoButton`, com **Desfazer** durante alguns segundos.

### Client e server

Formulário com estado (slug que acompanha o nome, erros ao lado do campo) é Client Component. A mutação é Server Action. Função não atravessa a fronteira: o que a página de servidor passa ao cliente são dados, não callbacks. O texto de ajuda do slug, por exemplo, é uma string com `{slug}`, montada dentro do componente cliente.

## Veja também

- [Padrões de código](/contribuindo/padroes-de-codigo)
- [Criar uma tela nova](/contribuindo/guias/nova-tela)
- [Testes](/contribuindo/testes)
