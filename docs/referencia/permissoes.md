---
description: As 21 permissões do Rizoma e a matriz padrão de Proprietário, Administrador, Mantenedor e Leitor, os itens de menu que cada permissão libera e as travas que a tela de Permissões não deixa quebrar.
---

# Papéis e permissões

Esta página é a referência das 21 permissões e do que cada papel pode fazer **por padrão**. A tela [Permissões](/admin/permissoes) deixa a empresa ajustar a matriz. As travas abaixo continuam valendo depois de qualquer ajuste.

A checagem acontece no servidor. A interface só esconde botões. Quem não tem a permissão de uma rota administrativa recebe "não encontrada" (RN-23), para a resposta não confirmar que a rota existe.

## Papéis

Na interface, os papéis aparecem sempre pelo nome em português. O código (`OWNER`, `VIEWER`…) fica nos textos técnicos: comandos, banco e API.

| Papel (código) | Na tela | Para quem |
|---|---|---|
| `OWNER` | Proprietário | Quem instalou o hub e quem recebeu o papel de outro Proprietário. Sempre tem todas as permissões. A instalação precisa ter pelo menos um. |
| `ADMIN` | Administrador | Administração do dia a dia. Por padrão não muda login, ambientes, repositórios, regras de acesso nem a própria matriz. |
| `MAINTAINER` | Mantenedor | Quem mantém os serviços do próprio time: cadastra, edita, publica spec, gera token e cuida de variáveis. |
| `VIEWER` | Leitor | Quem consulta o catálogo, o mapa e as variáveis (sem ver o valor dos segredos). É o papel de quem entra pela liberação automática. |

Dentro de um time, a pessoa ainda tem um papel à parte, **Líder** ou **Membro**. Ele organiza a lista de [Times](/admin/times), mas não concede permissões.

Ninguém altera o próprio papel (RN-24). Um Administrador só concede até Mantenedor (RN-13). Só um Proprietário concede ou retira o papel de Proprietário, e nunca o último (RN-25).

## A matriz padrão

Marca significa que o papel nasce com a permissão. `catalog:read` é obrigatória para todos e não pode ser desmarcada. As permissões da área **Administração** só podem ser dadas ao Administrador (o Proprietário as tem sempre).

| Permissão | O que permite | Proprietário | Administrador | Mantenedor | Leitor |
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
| `access:decide` | Aprovar e recusar solicitações de acesso | sim | sim | | |
| `user:manage` | Convidar pessoas, mudar papéis e suspender | sim | sim | | |
| `audit:read` | Ver e exportar a auditoria | sim | sim | | |
| `appearance:manage` | Mudar o nome do sistema e a cor de destaque (aba Aparência) | sim | sim | | |
| `settings:manage` | Configurações: organização e regras de acesso, conexões (login, e-mail, repositórios), ambientes e sessões | sim | | | |
| `roles:manage` | Editar esta matriz | sim | | | |

As sete permissões da área **Administração** (`team:manage`, `access:decide`, `user:manage`, `audit:read`, `appearance:manage`, `settings:manage` e `roles:manage`) são administrativas: a validação da matriz recusa dá-las a Mantenedor ou Leitor (RN-26 a RN-29).

::: info Como a matriz da tela chama algumas permissões
Na matriz da tela, `access:decide` ainda se chama "Aprovar e recusar pedidos de acesso" e `appearance:manage`, "Mudar título e tema do sistema". As duas descrevem o que a tabela acima diz. O tema Claro, Escuro ou Sistema é escolha de cada pessoa, pelo menu do avatar, e não depende de permissão.
:::

## Qual permissão abre cada tela

Cada item do menu aparece só para quem tem a permissão da tela. Sem ela, o endereço responde "não encontrada". A lista segue os quatro grupos da barra lateral.

| Grupo | Item do menu | Endereço | Aparece para quem tem |
|---|---|---|---|
| Explorar | **Catálogo** | `/` | Todos |
| Explorar | **Mapa de ligações** | `/graph` | `graph:read` |
| Explorar | **Integrações externas** | `/integrations` | Todos |
| Cadastros | **Serviços** | `/admin/services` | `service:create` ou `service:edit` |
| Cadastros | **Repositórios** | `/admin/repositories` | `link:edit` |
| Cadastros | **Vínculos** | `/admin/links` | `link:edit` |
| Cadastros | **Tokens de CI** | `/admin/tokens` | `token:manage` |
| Cadastros | **Times** | `/admin/teams` | `team:manage` |
| Pessoas | **Pessoas e acesso** | `/admin/people` | `access:decide` ou `user:manage` |
| Pessoas | **Permissões** | `/admin/permissions` | `roles:manage` |
| Sistema | **Auditoria** | `/admin/audit` | `audit:read` |
| Sistema | **Configurações** | `/admin/settings` | `settings:manage` (abas **Organização e acesso**, **Conexões** e **Ambientes e sessões**) ou `appearance:manage` (aba **Aparência**) |

Quem tem só `appearance:manage` abre **Configurações**, mas vê apenas a aba **Aparência**. Dentro de **Pessoas e acesso**, decidir solicitações pede `access:decide`, e convidar, mudar papéis, suspender e gerar link de nova senha pedem `user:manage`. A busca (Ctrl+K ou ⌘K) e o botão **+ Novo** mostram só os atalhos que a pessoa pode usar.

## Próprio time

Sem `service:edit_any`, criar e editar um serviço exige a permissão correspondente **e** participar do time responsável (RN-22). O mesmo vale para variáveis, regras de negócio, publicação manual e tokens: a permissão diz "próprio time".

`service:edit_any` libera qualquer serviço, inclusive variáveis, segredos e regras. Quem a tem também vê e edita serviços sem time.

## Visibilidade

`catalog:read` mostra serviços marcados como **Toda a empresa**. Um serviço **Só o time responsável** só aparece para quem está no time ou para quem tem `catalog:read_private` (RN-30). Fora isso, o serviço some do catálogo, do mapa e da URL.

## O que a tela não deixa fazer

- Tirar permissão do Proprietário. A coluna é somente leitura.
- Desmarcar `catalog:read`.
- Dar permissão administrativa a Mantenedor ou Leitor. Nessas colunas, a linha mostra só um traço (—).
- Um Administrador remover do próprio papel a permissão de editar a matriz, se a tiver recebido.

Marcar e desmarcar não grava nada: as mudanças ficam numa barra no rodapé ("N mudanças não salvas"), e **Revisar e salvar** mostra quem ganha e quem perde cada permissão antes de gravar. Salvar grava a matriz inteira de uma vez e registra a mudança na [auditoria](/admin/auditoria). Quem já personalizou a matriz não recebe permissões novas automaticamente: é preciso marcá-las na tela, a menos que uma migração faça isso.

## Veja também

- [Permissões (tela)](/admin/permissoes): como revisar, salvar e restaurar o padrão.
- [Papel com permissões sob medida](/receitas/papel-personalizado): um cenário completo.
- [Criar uma permissão](/contribuindo/guias/nova-permissao): para quem mexe no código.
