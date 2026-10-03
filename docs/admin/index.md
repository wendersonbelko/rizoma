---
description: "Visão geral do backoffice do Rizoma: as telas de administração, a permissão de cada uma, quais papéis têm acesso por padrão, o que é \"próprio time\" e por onde começar."
---

# Visão geral

O backoffice do Rizoma é o conjunto de telas do grupo **Administração** do menu lateral, mais a edição de serviços. É por elas que você cadastra serviços, monta times, decide quem entra, ajusta permissões, aparência e configurações, e confere a auditoria. Esta página é o mapa: quem vê cada tela, o que "próprio time" significa e por onde começar.

## As telas de administração

Cada tela tem uma permissão própria. Quem não a tem não vê o item no menu, e o endereço responde "não encontrada". Os papéis da última coluna são os **padrões**: quem administra pode mudar a matriz em [Permissões](/admin/permissoes).

| Tela | Endereço | Permissão exigida | Papéis com acesso por padrão |
|---|---|---|---|
| [**Serviços e repositórios**](/admin/servicos-e-vinculos) | `/admin/catalog` | Editar vínculos, repositórios e integrações compartilhadas | MAINTAINER, ADMIN, OWNER |
| [Editar e arquivar serviços](/admin/editar-servico) | `/services/<slug>/edit` | Editar serviços do próprio time (arquivar exige outra permissão) | MAINTAINER (próprio time), ADMIN, OWNER |
| [**Times**](/admin/times) | `/admin/teams` | Criar times e gerenciar membros | ADMIN, OWNER |
| [**Pessoas e acesso**](/admin/pessoas-e-acesso) | `/admin/people` | Aprovar e recusar pedidos **ou** convidar, mudar papéis e suspender | ADMIN, OWNER |
| [**Auditoria**](/admin/auditoria) | `/admin/audit` | Ver e exportar a auditoria | ADMIN, OWNER |
| [**Permissões**](/admin/permissoes) | `/admin/permissions` | Editar a matriz de permissões | OWNER |
| [**Aparência**](/admin/aparencia) | `/admin/appearance` | Mudar título e tema do sistema | ADMIN, OWNER |
| [**Configurações**](/admin/configuracoes) | `/admin/settings` | Configurações: login, ambientes, repositórios e regras de acesso | OWNER |
| [Recuperação de OWNER](/admin/recuperacao-de-owner) | Linha de comando, no servidor | Acesso ao servidor | Quem administra o servidor |

::: info Por padrão, só o OWNER mexe em Configurações e Permissões
Essas duas telas controlam o próprio hub: quem entra, como entra e o que cada papel pode fazer. Por isso, na matriz padrão, o ADMIN não as tem. Como são permissões administrativas, só podem ser dadas ao papel ADMIN, nunca a MAINTAINER ou VIEWER (RN-28).
:::

Dentro de **Serviços e repositórios**, cada aba tem ainda a sua permissão:

| Aba ou ação | Permissão exigida |
|---|---|
| **Serviços**, lista "Serviços que você mantém" | Editar vínculos (a da tela) |
| **Serviços**, assistente **Novo serviço** | Cadastrar serviços para o próprio time |
| **Repositórios** e **Vínculos** | Editar vínculos, repositórios e integrações compartilhadas |
| **Tokens** | Gerar e revogar tokens de CI (próprio time) |
| Arquivar e restaurar um serviço | Arquivar e restaurar serviços |

## Os papéis padrão

O hub tem quatro papéis. Os três últimos são configuráveis; o OWNER sempre tem tudo.

| Papel | O que faz por padrão |
|---|---|
| **OWNER** | Tudo, sempre. A instalação nunca fica sem pelo menos um OWNER ativo (RN-25). |
| **ADMIN** | Tudo, menos **Configurações** e **Permissões**. |
| **MAINTAINER** | Cadastra serviços para o próprio time, edita o que é do time (dados, regras, variáveis, integrações), publica specs, gera tokens de CI e cadastra repositórios, integrações e vínculos. |
| **VIEWER** | Lê o catálogo, o mapa e as variáveis, sem revelar segredos. |

A lista completa das 21 permissões está em [Papéis e permissões](/referencia/permissoes).

## Sem permissão, a tela não existe

As rotas administrativas respondem "não encontrada" (404) para quem não tem a permissão, em vez de "acesso negado" (RN-23). Assim o hub não revela quais telas existem. Vale também para a exportação da auditoria (`/api/admin/audit`) e para a edição de um serviço de outro time.

Toda checagem acontece no servidor (RN-20). Esconder um botão ou um item de menu não é controle de acesso, só conveniência: mesmo que alguém monte o endereço à mão ou reenvie um formulário, o servidor confere a permissão a cada ação.

## O que é "próprio time"

Várias permissões do papel MAINTAINER trazem o aviso "próprio time". Elas só valem para os **serviços cujo time responsável é um dos times de que você faz parte**. A permissão **Editar qualquer serviço, inclusive variáveis, segredos e regras** (ADMIN e OWNER, por padrão) remove essa restrição (RN-22).

| O que você quer fazer | Escopo |
|---|---|
| Cadastrar um serviço | Só para um time seu (ou qualquer time, com a permissão de editar qualquer serviço). |
| Editar dados, situação, visibilidade e tags de um serviço | Serviços do seu time. |
| Mudar a origem da spec, importar e sincronizar specs | Serviços do seu time. |
| Escrever regras de negócio | Serviços do seu time. |
| Editar, copiar e revelar variáveis | Serviços do seu time. |
| Gerar e revogar tokens de CI | Serviços do seu time. |
| Ligar integrações externas a um serviço | Serviços do seu time. |
| Criar um vínculo a partir de um serviço | O serviço de origem ("De") precisa ser do seu time. |
| Cadastrar repositórios e integrações externas | **Global**: qualquer pessoa com a permissão edita qualquer um. |
| Gerenciar times, pessoas, permissões, aparência e configurações | **Global**. |

Um serviço não sai do próprio time nem vai para um time do qual você não faz parte, a menos que você possa editar qualquer serviço (RN-33). Só entram em times pessoas com acesso ativo (RN-34).

## Regras que valem em todas as telas

- **Ninguém altera o próprio papel** nem se suspende (RN-24).
- **A instalação nunca fica sem OWNER** (RN-25).
- **Mudanças de permissão valem na próxima página** que cada pessoa abrir, sem precisar sair e entrar de novo.
- **Tudo fica na [Auditoria](/admin/auditoria)**: quem fez, quando, com o quê. Valores de segredos nunca entram.
- **Toda listagem é paginada** do mesmo jeito: "Mostrando 1–10 de 87", seletor **Por página** (10, 20, 50 ou 100) e números de página, com `?page=` e `?size=` na URL.

### Como as telas pedem confirmação

Ações destrutivas seguem três padrões, para você saber o que esperar:

| Padrão | Onde aparece |
|---|---|
| **Desfazer** por alguns segundos: o item some, e a ação só é executada de fato se você não clicar em **Desfazer** | Remover um vínculo em **Vínculos**; remover uma pessoa de um time |
| **Confirmação digitada** | Excluir uma integração (`EXCLUIR`); encerrar todas as sessões (`ENCERRAR`) |
| **Um clique, sem confirmação** | Revogar um token, excluir uma variável ou uma página de regras, remover a ligação de uma integração, suspender uma pessoa, restaurar as permissões padrão |

## Por onde começar

Numa instalação nova, depois de concluir o [assistente](/instalacao/assistente), uma ordem que costuma funcionar:

1. **Confira as Configurações.** Revise organização, formas de login, repositórios, ambientes e regras de acesso. Se só há um OWNER, considere ter um segundo.
2. **Crie os times** em **Times**, e adicione as pessoas a eles. Serviços, permissões "do próprio time" e o mapa dependem disso.
3. **Cuide das pessoas** em **Pessoas e acesso**: decida pedidos pendentes e convide quem não entra por vínculo automático.
4. **Cadastre os serviços** em **Serviços e repositórios**, com repositórios, vínculos e tokens para o CI.
5. **Ajuste as Permissões**, se os papéis padrão não servirem à sua empresa.
6. **Personalize a Aparência**, com o título e o tema.
7. **Acompanhe a Auditoria** de tempos em tempos.

O tour guiado do hub também passa por estas telas no primeiro acesso: veja [Primeiro acesso e tour](/uso/primeiro-acesso).

## Próximos passos

- [Serviços e repositórios](/admin/servicos-e-vinculos): o assistente de novo serviço, repositórios, vínculos e tokens.
- [Times](/admin/times): times e membros.
- [Pessoas e acesso](/admin/pessoas-e-acesso): pedidos, convites e papéis.
- [Papéis e permissões](/referencia/permissoes): a referência completa das 21 permissões.
