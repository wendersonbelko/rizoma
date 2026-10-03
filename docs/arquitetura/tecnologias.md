---
description: As bibliotecas do Rizoma e o papel de cada uma — Next.js, React, Prisma, PostgreSQL, Auth.js, Tailwind, Scalar, Turborepo e VitePress.
---

# Tecnologias

O hub é um monorepo TypeScript. As versões abaixo são as declaradas nos `package.json` (intervalos `^` acompanham a linha menor compatível). Node 22 ou mais novo e pnpm 10 são exigidos na raiz.

## Aplicação

| Peça | Versão no repositório | Para que serve |
|---|---|---|
| Next.js | 16 | Telas, Server Actions, rotas de API e o assistente. O build de produção usa `output: standalone`. |
| React | 19 | Interface. Componentes de formulário com estado são Client Components; a página que busca dados continua no servidor. |
| Auth.js (`next-auth`) | 5 beta | Login. Provedores vêm do banco. A sessão é JWT. |
| `@auth/prisma-adapter` | 2 | Liga as contas do Auth.js ao Prisma. Os tokens OAuth passam por um adaptador que os cifra. |
| Tailwind CSS | 4 | Estilos. As cores vêm de variáveis CSS (`--color-*`) escolhidas pelo tema. |
| Zod | 4 | Validação compartilhada entre tela e API, em `packages/core`. |
| Scalar (`@scalar/api-reference-react`) | 0.9 | Renderiza a spec. Sobe sem telemetria e sem "testar requisição". |
| React Flow (`@xyflow/react`) e Dagre | 12 e 1 | O mapa de ligações e o layout do grafo. |
| react-markdown e remark-gfm | 10 e 4 | Regras de negócio em Markdown, sem HTML cru. |
| driver.js | 1 | O tour do primeiro acesso. |
| Fontes | Schibsted Grotesk e JetBrains Mono | Texto e código, servidos pelo próprio app (`@fontsource`). |

## Dados e regras

| Peça | Versão | Para que serve |
|---|---|---|
| PostgreSQL | 16 (imagem `postgres:16-alpine` no Compose) | Único banco suportado. O schema usa listas e JSON nativos. |
| Prisma | 6 | Schema, migrações e client. O client fala com o Postgres pelo adapter `pg`. |
| `packages/core` | regras puras | Sem Prisma e sem React. Testado com Vitest. YAML da spec é lido com a biblioteca `yaml`. |

## Ferramentas do repositório

| Peça | Para que serve |
|---|---|
| pnpm 10 | Pacotes e workspaces (`apps/*`, `packages/*`, `docs`). |
| Turborepo | `pnpm dev`, `build`, `test` e `typecheck` em todos os pacotes. |
| TypeScript 5.9 | Checagem estrita. O `core` exporta os fontes direto, sem passo de compilação separado. |
| Vitest 3 | Testes unitários do `core` e da interface, e os de integração do `web` contra um Postgres real. |
| VitePress 1 | Este site. Mermaid entra pelo `vitepress-plugin-mermaid`. |
| Docker Compose | Postgres em desenvolvimento e, com o profile `app`, a imagem de produção mais a migração. |

## O que ficou de fora de propósito

Não há Redis, fila, serviço de e-mail nem API gateway no processo. O limite de requisições é um mapa em memória. Convites são links copiados à mão. Essas ausências estão no [roadmap](/arquitetura/roadmap).

## Veja também

- [Estrutura do monorepo](/arquitetura/monorepo)
- [Decisões de arquitetura](/arquitetura/decisoes)
- [Variáveis de ambiente](/instalacao/variaveis-de-ambiente)
