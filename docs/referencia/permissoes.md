---
description: As 21 permissões do Rizoma e a matriz padrão de OWNER, ADMIN, MAINTAINER e VIEWER, com as travas que a tela de Permissões não deixa quebrar.
---

# Papéis e permissões

Esta página é a referência das 21 permissões e do que cada papel pode fazer **por padrão**. A tela [Permissões](/admin/permissoes) deixa a empresa ajustar a matriz. As travas abaixo continuam valendo depois de qualquer ajuste.

A checagem acontece no servidor. A interface só esconde botões. Quem não tem a permissão de uma rota administrativa recebe "não encontrada" (RN-23), para a resposta não confirmar que a rota existe.

## Papéis

| Papel | Na tela | Para quem |
|---|---|---|
| `OWNER` | Owner | Quem instalou o hub e quem recebeu o papel de outro OWNER. Sempre tem todas as permissões. A instalação precisa ter pelo menos um. |
| `ADMIN` | Admin | Administração do dia a dia. Por padrão não muda login, ambientes, repositórios, regras de acesso nem a própria matriz. |
| `MAINTAINER` | Mantenedor | Quem mantém os serviços do próprio time: cadastra, edita, publica spec, gera token e cuida de variáveis. |
| `VIEWER` | Leitor | Quem consulta o catálogo, o mapa e as variáveis (sem ver o valor dos segredos). É o papel de quem entra pela liberação automática. |

Ninguém altera o próprio papel (RN-24). Um ADMIN só concede até MAINTAINER (RN-13). Só um OWNER concede ou retira OWNER, e nunca o último (RN-25).

## A matriz padrão

Marca significa que o papel nasce com a permissão. `catalog:read` é obrigatória para todos e não pode ser desmarcada. As permissões da área **Administração** só podem ser dadas a ADMIN (o OWNER as tem sempre).

| Permissão | O que permite | Owner | Admin | Mantenedor | Leitor |
|---|---|---|---|---|---|
| `catalog:read` | Ver catálogo, documentação e regras de negócio | sim | sim | sim | sim |
| `catalog:read_private` | Ver serviços restritos de outros times | sim | sim | | |
| `graph:read` | Ver o mapa de ligações | sim | sim | sim | sim |
| `envvars:read` | Ver variáveis (segredos ficam ocultos) | sim | sim | sim | sim |
| `envvars:reveal` | Revelar segredos dos serviços do próprio time | sim | sim | sim | |
| `envvars:edit` | Editar variáveis dos serviços do próprio time | sim | sim | sim | |
| `docs:edit` | Editar regras de negócio dos serviços do próprio time | sim | sim | sim | |
| `service:create` | Cadastrar serviços para o próprio time | sim | sim | sim | |
| `service:edit` | Editar serviços do próprio time | sim | sim | sim | |
| `service:edit_any` | Editar qualquer serviço, inclusive variáveis, segredos e regras | sim | sim | | |
| `service:archive` | Arquivar e restaurar serviços | sim | sim | | |
| `spec:publish` | Importar spec e sincronizar (próprio time) | sim | sim | sim | |
| `token:manage` | Gerar e revogar tokens de CI (próprio time) | sim | sim | sim | |
| `link:edit` | Cadastrar repositórios e integrações externas compartilhadas | sim | sim | sim | |
| `team:manage` | Criar times e gerenciar membros | sim | sim | | |
| `access:decide` | Aprovar e recusar pedidos de acesso | sim | sim | | |
| `user:manage` | Convidar pessoas, mudar papéis e suspender | sim | sim | | |
| `audit:read` | Ver e exportar a auditoria | sim | sim | | |
| `appearance:manage` | Mudar título e tema | sim | sim | | |
| `settings:manage` | Login, ambientes, repositórios e regras de acesso | sim | | | |
| `roles:manage` | Editar esta matriz | sim | | | |

As cinco últimas, mais `team:manage`, `access:decide`, `user:manage` e `audit:read`, são administrativas: a validação da matriz recusa dá-las a MAINTAINER ou VIEWER (RN-26 a RN-29).

## Próprio time

Sem `service:edit_any`, criar e editar um serviço exige a permissão correspondente **e** participar do time responsável (RN-22). O mesmo vale para variáveis, regras de negócio, publicação manual e tokens: a permissão diz "próprio time".

`service:edit_any` libera qualquer serviço, inclusive variáveis, segredos e regras. Quem a tem também vê e edita serviços sem time.

## Visibilidade

`catalog:read` mostra serviços marcados como **Toda a empresa**. Um serviço **Só o time responsável** só aparece para quem está no time ou para quem tem `catalog:read_private` (RN-30). Fora isso, o serviço some do catálogo, do mapa e da URL.

## O que a tela não deixa fazer

- Tirar permissão do OWNER. A coluna é somente leitura.
- Desmarcar `catalog:read`.
- Dar permissão administrativa a Mantenedor ou Leitor.
- Um ADMIN remover do próprio papel a permissão de editar a matriz, se a tiver recebido.

Salvar grava a matriz inteira de uma vez e registra a mudança na [auditoria](/admin/auditoria). Quem já personalizou a matriz não recebe permissões novas automaticamente: é preciso marcá-las na tela, a menos que uma migração faça isso.

## Veja também

- [Permissões (tela)](/admin/permissoes): como salvar e restaurar o padrão.
- [Papel com permissões sob medida](/receitas/papel-personalizado): um cenário completo.
- [Criar uma permissão](/contribuindo/guias/nova-permissao): para quem mexe no código.
