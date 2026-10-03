<!-- Título no formato dos commits: feat(catalog): adicionar filtro por tag -->

## O que muda e por quê

<!-- Descreva a mudança e o motivo. Relacione a issue, se houver: Closes #123 -->

## Como testar

<!-- Passos para quem revisa conferir a mudança. -->

## Prints

<!-- Para mudança visual: antes e depois (claro e escuro, se couber). Apague a seção se não houver. -->

## Checklist

Marque só o que vale para a sua mudança ([detalhes](https://wendersonbelko.github.io/rizoma/contribuindo/pull-requests)).

- [ ] `pnpm typecheck` passa sem erros.
- [ ] `pnpm lint` passa.
- [ ] `pnpm test` passa.
- [ ] Rodei `pnpm test:integration` (obrigatório se mexi em banco, acesso, permissões ou publicação de specs).
- [ ] Escrevi ou atualizei testes para a regra nova ou o bug corrigido.
- [ ] Segui os [padrões de código](https://wendersonbelko.github.io/rizoma/contribuindo/padroes-de-codigo) e usei os componentes do design system.
- [ ] Se mudei uma **tela do menu**, atualizei o tour em `apps/web/src/lib/tours.ts`.
- [ ] Se mudei o **schema do banco**, criei uma migração e não editei nenhuma migração já publicada.
- [ ] Se criei uma **permissão**, pensei em quem já usa uma matriz personalizada ([Criar uma permissão](https://wendersonbelko.github.io/rizoma/contribuindo/guias/nova-permissao)).
- [ ] Atualizei a **documentação** (`docs/`) e rodei `pnpm docs:build` sem links quebrados.
- [ ] Anexei **prints** para mudanças visuais.
- [ ] Toda ação administrativa nova chama `audit()` e nenhuma mensagem, log ou auditoria expõe segredos.
