---
description: Como a interface do Rizoma é montada — componentes únicos, paginação pela URL, temas, tour e os testes que impedem tabela feita à mão.
---

# Interface e design system

A interface é um conjunto pequeno de peças. Listagem, vazio, aviso, selo e aba não são redesenhados em cada tela. Os testes em `apps/web/test/unit/design-system.test.ts` falham se alguém montar `<table>` à mão, uma lista com divisórias à mão, ou uma `DataTable` de listagem sem paginação.

Todo o texto visível é português do Brasil. Botão e título levam maiúscula só na primeira letra. Plural usa `plural()` e `countLabel()` (`packages/core/src/text.ts`). Data e número usam `pt-BR`.

## Peças

| Peça | Onde | Uso |
|---|---|---|
| `DataTable` e células | `components/table.tsx` | Toda listagem tabular |
| `CardList` | `components/card-list.tsx` | Item que não cabe numa linha |
| `Pagination` | `components/pagination.tsx` | Página e tamanho na URL (`?page=` e `?size=`) |
| `EmptyState` | `components/empty-state.tsx` | Lista vazia, com a ação que tira do vazio |
| `Badge`, `Notice`, `Panel`, `Field`, `Button` | `components/ui.tsx` | Selo, faixa, formulário e botão |
| `TabNav` | `components/tab-nav.tsx` | Abas pela URL |
| `FormModal` | `components/form-modal.tsx` | Criar ou editar uma entidade, fora da lista |
| `FilterChips` | `components/filter-chips.tsx` | Um filtro por vez, na URL |
| `Markdown` | `components/markdown.tsx` | Regras de negócio, sem HTML cru |

Uma linha de tabela é um componente próprio (`*-row.tsx`). A página não desenha a linha.

## Paginação e filtros

Os filtros e a página ficam na query string, para o link ser compartilhável e o voltar do navegador funcionar. A consulta aplica o filtro no SQL, inclusive a visibilidade (RN-30), para o total da paginação ser o que a pessoa realmente pode ver. Os tamanhos são 10, 20, 50 e 100.

Em tela estreita o menu vira uma barra no topo e as colunas marcadas com `hideBelow` somem.

## Tema

Dois temas vivem em `packages/core/src/themes.ts`: Claro (padrão) e Escuro. As cores são as mesmas da documentação. O admin escolhe um e pode sobrescrever cores. O layout escreve `--color-*` e o Tailwind lê essas variáveis (RN-110). Combinação abaixo de 4,5:1 é recusada (RN-112). Veja [Aparência](/admin/aparencia).

## Tour

No primeiro acesso o tour (`driver.js`) é um panorama do menu, no Catálogo. O hub fica bloqueado até a pessoa concluir. O botão **?** de cada tela reexplica aquela tela e oferece o tour dela. Veja [Primeiro acesso](/uso/primeiro-acesso).

## Formulários

Criar ou editar uma entidade (serviço, time, pessoa, token, provedor de login, ambiente) abre um `FormModal`. A lista fica na tela; o formulário não. Configuração da instalação que é o próprio conteúdo da seção (organização, SMTP, regras de acesso) continua na página. O modal de um segredo ou de um convite permanece aberto depois do sucesso, para a pessoa copiar o valor.

Formulário com estado (slug que acompanha o nome, erros ao lado do campo) é Client Component. A mutação é Server Action. Função não atravessa a fronteira: o que a página de servidor passa ao cliente são dados, não callbacks. O texto de ajuda do slug, por exemplo, é uma string com `{slug}`, montada dentro do componente cliente.

## Veja também

- [Padrões de código](/contribuindo/padroes-de-codigo)
- [Criar uma tela nova](/contribuindo/guias/nova-tela)
- [Testes](/contribuindo/testes)
