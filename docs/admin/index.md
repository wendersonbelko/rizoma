---
description: "Visão geral do backoffice do Rizoma: as telas de administração, a permissão de cada uma, quais papéis têm acesso por padrão, o que é \"próprio time\" e por onde começar."
---

# Visão geral

O backoffice do Rizoma é o conjunto de telas dos grupos **Cadastros**, **Pessoas** e **Sistema** do menu lateral, mais a edição de serviços. É por elas que você cadastra serviços, monta times, decide quem entra, ajusta permissões, marca e configurações, e confere a auditoria. Esta página é o mapa: quem vê cada tela, o que "próprio time" significa e por onde começar.

## O menu lateral

O menu tem quatro grupos, e o item do menu tem sempre o mesmo nome da página que abre:

| Grupo | Itens | Para que serve |
|---|---|---|
| **Explorar** | **Catálogo**, **Mapa de ligações**, **Integrações externas** | Ler. É o que todo mundo usa. |
| **Cadastros** | **Serviços**, **Repositórios**, **Vínculos**, **Tokens de CI**, **Times** | O que cada pessoa mantém. |
| **Pessoas** | **Pessoas e acesso**, **Permissões** | Quem entra e o que cada papel pode. |
| **Sistema** | **Auditoria**, **Configurações** | O registro e o ajuste do próprio hub. |

Só aparecem os itens que você pode abrir. No topo da barra lateral há ainda o botão **Buscar** (Ctrl+K ou ⌘K), que acha telas, serviços e atalhos de criação, e o botão **+ Novo**, que abre direto o cadastro que você pode criar. No pé, o bloco com o seu avatar, nome e papel abre um menu com a **Aparência** (o tema Claro, Escuro ou Sistema, que é escolha sua) e o **Sair**.

## As telas de administração

Cada tela tem uma permissão própria. Quem não a tem não vê o item no menu, e o endereço responde "não encontrada". Os papéis da última coluna são os **padrões**: quem administra pode mudar a matriz em [Permissões](/admin/permissoes).

| Tela | Grupo do menu | Endereço | Permissão exigida | Papéis com acesso por padrão |
|---|---|---|---|---|
| [**Serviços**](/admin/servicos-e-vinculos) | Cadastros | `/admin/services` | Cadastrar serviços para o próprio time **ou** editar serviços do próprio time | Mantenedor, Administrador, Proprietário |
| [**Repositórios**](/admin/servicos-e-vinculos) | Cadastros | `/admin/repositories` | Cadastrar repositórios e integrações externas compartilhadas | Mantenedor, Administrador, Proprietário |
| [**Vínculos**](/admin/servicos-e-vinculos) | Cadastros | `/admin/links` | A mesma de Repositórios | Mantenedor, Administrador, Proprietário |
| [**Tokens de CI**](/admin/servicos-e-vinculos) | Cadastros | `/admin/tokens` | Gerar e revogar tokens de CI (próprio time) | Mantenedor, Administrador, Proprietário |
| [Editar e arquivar serviços](/admin/editar-servico) | (abre pela página do serviço) | `/services/<slug>/edit` | Editar serviços do próprio time (arquivar exige outra permissão) | Mantenedor (próprio time), Administrador, Proprietário |
| [**Times**](/admin/times) | Cadastros | `/admin/teams` | Criar times e gerenciar membros | Administrador, Proprietário |
| [**Pessoas e acesso**](/admin/pessoas-e-acesso) | Pessoas | `/admin/people` | Aprovar e recusar solicitações de acesso **ou** convidar, mudar papéis e suspender | Administrador, Proprietário |
| [**Permissões**](/admin/permissoes) | Pessoas | `/admin/permissions` | Editar a matriz de permissões | Proprietário |
| [**Auditoria**](/admin/auditoria) | Sistema | `/admin/audit` | Ver e exportar a auditoria | Administrador, Proprietário |
| [**Configurações**](/admin/configuracoes) | Sistema | `/admin/settings` | Configurações **ou** mudar a marca do sistema; cada aba pede a sua | Proprietário (as três primeiras abas); Administrador e Proprietário (aba **Aparência**) |
| [Recuperação de OWNER](/admin/recuperacao-de-owner) | | Linha de comando, no servidor | Acesso ao servidor | Quem administra o servidor |

::: info Por padrão, só o Proprietário mexe nas Permissões e na maior parte das Configurações
Essas telas controlam o próprio hub: quem entra, como entra e o que cada papel pode fazer. Por isso, na matriz padrão, o Administrador não tem a permissão de configurações nem a de editar a matriz. Como são permissões administrativas, só podem ser dadas ao papel Administrador, nunca ao Mantenedor ou ao Leitor (RN-28). **Configurações** é a única tela com abas de permissões diferentes: **Organização e acesso**, **Conexões** e **Ambientes e sessões** pedem a permissão de configurações, e **Aparência** (o nome do sistema e a cor de destaque) pede a de mudar a marca. Por isso o Administrador abre Configurações e vê só a aba **Aparência**.
:::

::: info Os endereços antigos continuam valendo
A tela antiga `/admin/catalog` (que tinha abas e se chamava "Serviços e vínculos") virou as páginas Serviços, Repositórios, Vínculos e Tokens de CI: o endereço velho redireciona, inclusive os valores de `?t=`. O mesmo vale para `/admin/appearance`, que virou a aba **Aparência** de Configurações, e para os valores antigos de `?s=` em `/admin/settings`.
:::

Dentro das páginas de **Cadastros**, algumas ações pedem mais do que a página:

| Página ou ação | Permissão exigida |
|---|---|
| **Serviços**, lista "Serviços que você mantém" | Cadastrar ou editar serviços do próprio time (a da página) |
| **Serviços**, botão **Novo serviço** | Cadastrar serviços para o próprio time |
| **Repositórios** e **Vínculos** | Cadastrar repositórios e integrações externas compartilhadas (a da página) |
| **Tokens de CI** | Gerar e revogar tokens de CI (a da página), só dos serviços do próprio time |
| Arquivar e restaurar um serviço | Arquivar e restaurar serviços |

## Os papéis padrão

O hub tem quatro papéis. Os três últimos são configuráveis; o Proprietário sempre tem tudo. Nas telas, os papéis aparecem com o nome em português; os termos em maiúsculas (`OWNER`, `ADMIN`, `MAINTAINER`, `VIEWER`) valem só em textos técnicos, como a linha de comando e o banco.

| Papel | O que faz por padrão |
|---|---|
| **Proprietário** (OWNER) | Tudo, sempre. A instalação nunca fica sem pelo menos um Proprietário ativo (RN-25). |
| **Administrador** (ADMIN) | Tudo, menos as três primeiras abas de **Configurações** e a tela **Permissões**. Mexe na **Aparência**. |
| **Mantenedor** (MAINTAINER) | Cadastra serviços para o próprio time, edita o que é do time (dados, regras, variáveis, integrações), publica specs, gera tokens de CI e cadastra repositórios, integrações e vínculos. |
| **Leitor** (VIEWER) | Lê o catálogo, o mapa e as variáveis, sem revelar segredos. |

A lista completa das 21 permissões está em [Papéis e permissões](/referencia/permissoes).

## Sem permissão, a tela não existe

As rotas administrativas respondem "não encontrada" (404) para quem não tem a permissão, em vez de "acesso negado" (RN-23). Assim o hub não revela quais telas existem. Vale também para a exportação da auditoria (`/api/admin/audit`), para a edição de um serviço de outro time e para uma aba de **Configurações** que a sua permissão não cobre.

Toda checagem acontece no servidor (RN-20). Esconder um botão ou um item de menu não é controle de acesso, só conveniência: mesmo que alguém monte o endereço à mão ou reenvie um formulário, o servidor confere a permissão a cada ação. A busca (**Buscar**) e o **+ Novo** seguem a mesma regra: só mostram o que a sua permissão deixa abrir ou criar.

## O que é "próprio time"

Várias permissões do papel Mantenedor trazem o aviso "próprio time". Elas só valem para os **serviços cujo time responsável é um dos times de que você faz parte**. A permissão **Editar qualquer serviço, inclusive variáveis, segredos e regras** (Administrador e Proprietário, por padrão) remove essa restrição (RN-22).

| O que você quer fazer | Escopo |
|---|---|
| Cadastrar um serviço | Só para um time seu (ou qualquer time, com a permissão de editar qualquer serviço). |
| Editar dados, situação, visibilidade e tags de um serviço | Serviços do seu time. |
| Mudar a origem da spec, importar e sincronizar specs | Serviços do seu time. |
| Escrever regras de negócio | Serviços do seu time. |
| Editar, copiar e revelar variáveis | Serviços do seu time. |
| Gerar e revogar tokens de CI | Serviços do seu time. A lista **Tokens de CI** só mostra os tokens deles. |
| Ligar integrações externas a um serviço | Serviços do seu time. |
| Criar ou remover um vínculo a partir de um serviço | O serviço de origem ("De") precisa ser do seu time. |
| Cadastrar repositórios e integrações externas | **Global**: qualquer pessoa com a permissão edita qualquer um. |
| Gerenciar times, pessoas, permissões, marca e configurações | **Global**. |

Um serviço não sai do próprio time nem vai para um time do qual você não faz parte, a menos que você possa editar qualquer serviço (RN-33). Só entram em times pessoas com acesso ativo (RN-34).

## Regras que valem em todas as telas

- **Ninguém altera o próprio papel** nem se suspende (RN-24).
- **A instalação nunca fica sem Proprietário** (RN-25).
- **Mudanças de permissão valem na próxima página** que cada pessoa abrir, sem precisar sair e entrar de novo.
- **Tudo fica na [Auditoria](/admin/auditoria)**: quem fez, quando, com o quê. Valores de segredos nunca entram.
- **Toda listagem é paginada** do mesmo jeito: "Mostrando 1–10 de 87", seletor **Por página** (10, 20, 50 ou 100) e números de página, com `?page=` e `?size=` na URL. O cabeçalho da tabela fica fixo enquanto você rola a página.

### Como as telas criam e editam

Todas as telas seguem o mesmo desenho, para você saber o que esperar:

- **Criar** abre um **modal padrão**: título e **×** no alto, corpo com rolagem e um rodapé fixo com **Cancelar** à esquerda e a ação principal à direita (verbo e objeto: "Criar serviço", "Gerar token"). Campos obrigatórios têm `*`; o que é opcional fica em **Detalhes opcionais**. Esc, clique fora, **×** e **Cancelar** perguntam "Descartar o que você digitou?" se algo foi digitado.
- **Editar ou configurar** num formulário de página mostra uma barra **Alterações não salvas**, com **Descartar** e **Salvar**, só quando há mudança, e avisa antes de você sair com mudança pendente.
- **Atalhos de criação** (**Buscar** e **+ Novo**) abrem o modal certo pelo fragmento do endereço (`#new-service`, `#new-link` e assim por diante).

### Como as telas pedem confirmação

Ações que apagam ou desligam algo seguem poucos padrões:

| Padrão | Onde aparece |
|---|---|
| **Desfazer** por alguns segundos: o item some, e a ação só é executada de fato se você não clicar em **Desfazer**. Para o que é reversível | Remover um vínculo em **Vínculos**; remover uma pessoa de um time; excluir uma variável; remover uma integração ou um canal de um serviço |
| **Zona de perigo ou botão com contorno vermelho**, que abre um modal de confirmação | Arquivar um serviço; desligar uma forma de login, uma origem de repositório ou o envio de e-mail; cancelar a janela de recuperação; suspender uma pessoa; restaurar as permissões padrão |
| **Confirmação digitada**, dentro do mesmo modal, para o que não tem volta | Excluir uma integração (o nome dela); excluir uma página de regras (o título); remover um ambiente (o nome); encerrar todas as sessões (`ENCERRAR`) |
| **Um clique, sem confirmação** | Revogar um token |

## Por onde começar

Numa instalação nova, depois de concluir o [assistente](/instalacao/assistente), uma ordem que costuma funcionar:

1. **Confira as Configurações.** Revise as abas **Organização e acesso**, **Conexões** (formas de login, e-mail e repositórios) e **Ambientes e sessões**. Se só há um Proprietário, considere ter um segundo.
2. **Crie os times** em **Times**, e adicione as pessoas a eles. Serviços, permissões "do próprio time" e o mapa dependem disso.
3. **Cuide das pessoas** em **Pessoas e acesso**: decida as solicitações pendentes e convide quem não entra por vínculo automático.
4. **Cadastre os serviços** em **Serviços**, e depois os repositórios em **Repositórios**, os vínculos em **Vínculos** e os tokens para o CI em **Tokens de CI**. A checklist **Próximos passos** da página de cada serviço novo mostra o que falta.
5. **Ajuste as Permissões**, se os papéis padrão não servirem à sua empresa.
6. **Personalize a marca** na aba **Aparência** de Configurações, com o nome do sistema e a cor de destaque.
7. **Acompanhe a Auditoria** de tempos em tempos.

O tour guiado do primeiro acesso é um panorama único, no Catálogo, que passa pelos quatro grupos do menu, pela busca, pelo **+ Novo** e pelo menu da conta. Cada tela, inclusive as de administração, tem o próprio tour, pelo botão **?**. Veja [Primeiro acesso e tour](/uso/primeiro-acesso).

## Próximos passos

- [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos): o Novo serviço em um passo, repositórios, vínculos e tokens.
- [Times](/admin/times): times e membros.
- [Pessoas e acesso](/admin/pessoas-e-acesso): solicitações, convites e papéis.
- [Papéis e permissões](/referencia/permissoes): a referência completa das 21 permissões.
