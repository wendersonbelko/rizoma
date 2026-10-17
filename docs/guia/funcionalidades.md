---
description: O catálogo completo do que o Rizoma faz, organizado por área, com a permissão necessária e o link da página detalhada.
---

# Tudo o que o sistema faz

Esta página lista, por área, tudo o que o Rizoma faz hoje. Para cada área você vê o que ela resolve, quem pode usar (a permissão necessária) e onde ler mais. Use-a para avaliar o produto ou para descobrir um recurso que você ainda não conhecia.

::: info Como ler as permissões
Os nomes entre crases, como `catalog:read`, são as permissões do sistema. Cada pessoa tem um papel (Proprietário, Administrador, Mantenedor ou Leitor; nos textos técnicos, `OWNER`, `ADMIN`, `MAINTAINER` e `VIEWER`) e cada papel tem um conjunto de permissões. A matriz é editável, então os "padrões" abaixo podem ser diferentes na sua instalação. A lista completa está em [Papéis e permissões](/referencia/permissoes).
:::

## Visão rápida

| Área | O que resolve | Onde fica no menu |
|---|---|---|
| [Catálogo e documentação](#catálogo-e-documentação) | Achar uma API e ler a spec | **Catálogo** e a busca **Buscar** (Ctrl+K) |
| [Ambientes e versões](#ambientes-e-versões) | Um contrato por ambiente, com histórico | **Configurações → Ambientes e sessões** |
| [Origens da spec e publicação](#origens-da-spec-e-publicação) | Levar a spec até o hub | **Serviços**, **Repositórios**, **Vínculos** e **Tokens de CI** |
| [Mapa de ligações](#mapa-de-ligações) | Ver quem depende de quem | **Mapa de ligações** |
| [Integrações externas](#integrações-externas) | Documentar APIs de terceiros, filas e bancos | **Integrações externas** |
| [Variáveis e segredos](#variáveis-e-segredos) | Guardar a configuração de cada ambiente | Aba **Variáveis de ambiente** do serviço |
| [Regras de negócio](#regras-de-negócio) | Documentar o que o serviço faz e por quê | Aba **Regras de negócio** do serviço |
| [Times](#times) | Dizer quem é dono de quê | **Times** |
| [Login e acesso](#login-e-acesso) | Deixar entrar só quem é da empresa | **Pessoas e acesso** |
| [Papéis e permissões](#papéis-e-permissões) | Controlar o que cada pessoa faz | **Permissões** |
| [Auditoria](#auditoria) | Saber quem fez o quê | **Auditoria** |
| [Aparência](#aparência) | Deixar o hub com a cara da empresa | **Configurações → Aparência** e o menu do avatar |
| [Instalação e operação](#instalação-e-operação) | Instalar, atualizar e recuperar | Assistente e linha de comando |
| [Experiência de uso](#experiência-de-uso) | Aprender e usar sem treinamento | Em todas as telas |

## Catálogo e documentação

A tela inicial lista todos os serviços cadastrados, com busca e um resumo de cada um. Ao abrir um serviço, você vê a documentação da API renderizada.

- **Lista compacta de serviços**, uma linha por serviço: um ponto de saúde (cheio quando há spec atual em produção, anel âmbar quando não há), o nome com o selo do tipo e uma linha de descrição, o time, a versão publicada em cada ambiente (ou "Sem spec") e os vínculos ("1 ↗ · 2 ↙ · 1 externa"). Quem gerencia o serviço vê também o link **Editar**. Uma legenda abaixo da lista explica o ponto de saúde.
- **Busca** ("Buscar por nome, slug ou endpoint") e **filtros** por **Time**, **Tipo** (API, Frontend ou Worker) e **Situação**, mais os chips **Sem spec** e **Meus serviços** e o filtro por tag. Tudo é aplicado na consulta e preservado na paginação.
- **Busca global (Ctrl+K ou ⌘K):** o botão **Buscar** da barra lateral abre uma busca única, com as seções **Ir para** (as telas do menu), **Serviços** (por nome, slug, descrição ou endpoint, a partir de 2 letras) e **Criar** (os atalhos de cadastro que a sua permissão deixa usar). O botão **+ Novo** da barra lateral abre os mesmos atalhos de criação.
- **Tipo do sistema:** API, frontend ou worker. As tags e o que o serviço oferece e usa ficam na página dele.
- **Página do serviço** com cabeçalho (time, repositórios, origem da spec e situação), uma trilha **Catálogo › nome do serviço** e um seletor de ambiente que filtra todas as abas. Enquanto faltam passos de cadastro, quem gerencia o serviço vê o selo **Rascunho** e uma checklist de próximos passos.
- **Documentação da API** renderizada com o Scalar, a partir de OpenAPI 3.0, 3.1 ou Swagger 2.0 em JSON ou YAML.
- **Histórico de versões** do ambiente escolhido: a mais recente é a padrão e as 20 anteriores ficam navegáveis.
- **Situação do serviço:** experimental, em produção ou descontinuado. O descontinuado aparece destacado.
- **Visibilidade:** "Toda a empresa" ou "Só o time responsável". Serviços restritos não aparecem no catálogo, no mapa nem por endereço direto para quem não é do time.
- O renderizador roda **sem "testar requisição"**, sem telemetria e com as fontes servidas pelo próprio hub.

![Página de um serviço com a documentação da API](/prints/05-servico-documentacao.png)

*Página de um serviço. O menu e o cabeçalho evoluíram desde este print; a documentação continua igual.*

**Quem pode usar:** qualquer pessoa ativa com `catalog:read` (todo papel tem). Serviços restritos exigem fazer parte do time ou ter `catalog:read_private`.

Leia mais: [Catálogo](/uso/catalogo) e [Página do serviço](/uso/servico).

## Ambientes e versões

Cada ambiente tem o seu próprio contrato. A mesma API pode estar na versão 2.4.0 em produção e na 2.5.0-rc.1 em homologação, e o hub mostra as duas.

- **Ambientes configuráveis:** nome, identificador (slug), cor, regras de branch, marcação "É produção" e "Branch de leitura" (em **Avançado**). A instalação já vem com `dev`, `hml` e `prod`.
- **Regras de branch** com curingas: `main`, `release/*`, `feature/**`, `hotfix-*`. A primeira regra que casar, na ordem dos ambientes, define o ambiente.
- **Versão por ambiente:** a spec é guardada por serviço, por ambiente e por conteúdo. Reenviar exatamente a mesma spec no mesmo ambiente não cria versão nova.
- Um ambiente só pode ser removido se **não tiver specs nem variáveis**, e remover pede para digitar o nome dele, na zona de perigo da aba. Para mudar o nome, edite o campo **Nome**.

**Quem pode usar:** ver ambientes, qualquer pessoa. Configurar, `settings:manage` (por padrão, só o Proprietário), na aba **Ambientes e sessões** de Configurações.

Leia mais: [Ambientes por branch](/receitas/ambientes-por-branch) e [Configurações](/admin/configuracoes).

## Origens da spec e publicação

Cada serviço escolhe de onde vem a sua spec. Você pode misturar origens diferentes entre serviços.

| Origem | Como funciona |
|---|---|
| **Enviada pelo CI** (padrão) | O pipeline faz `POST /api/v1/specs` com um token do serviço. O ambiente vem da branch. |
| **Arquivo no repositório** | O hub lê o arquivo (por exemplo `openapi.yaml`) na "branch de leitura" de cada ambiente. GitHub, GitLab ou Bitbucket. |
| **Lida de uma URL** | O hub busca a spec numa URL. Um `{env}` na URL vira o identificador do ambiente. Cabeçalhos como `Authorization` ficam cifrados. |
| **Importação manual** | Alguém do time envia o JSON ou YAML pela tela. |

- **Tokens de CI** (página **Tokens de CI**), um por serviço: começam com `ahub_`, aparecem uma única vez, só o hash é guardado, têm validade de 1 a 365 dias e podem ser revogados.
- **Sincronização:** o botão **Sincronizar agora**, o webhook `POST /api/v1/hooks` e a rota `POST /api/v1/sync` (token gerado em **Configurações → Conexões**, no bloco **Repositórios**) atualizam os serviços que leem de repositório ou URL.
- **Validação:** aceita OpenAPI 3.0, 3.1 e Swagger 2.0, JSON ou YAML, até 5 MB, com `info` e ao menos `paths`, `webhooks` ou `components`. Limite de 30 publicações por minuto por token.
- **Proteção contra SSRF** na leitura por URL: localhost, loopback, endereços link-local e serviços de metadados de nuvem são bloqueados. Redes privadas são permitidas.
- **Dependências na própria spec:** `x-api-hub.dependsOn: [estoque, pagamentos]` vira ligações "consome a API de" no mapa.
- **Aviso de contrato quebrado:** quando a publicação remove um path ou método, e o SMTP está salvo, o hub manda e-mail para Proprietários e Administradores ativos, para as pessoas ativas do time do serviço e para as pessoas ativas dos times que consomem o serviço ou chamam o endpoint removido. Sem SMTP, o aviso fica só na página do serviço.
- **Novo serviço em um passo**: nome, time e tipo bastam, e o resto (descrição, tags e visibilidade) fica em **Detalhes opcionais**. Depois de criar, a página do serviço mostra a checklist **Próximos passos**: vincular o repositório (papel Código-fonte), escolher como a spec chega e, quando a origem é o CI, gerar o token. Os cadastros ficam nas páginas **Serviços**, **Repositórios**, **Vínculos** e **Tokens de CI**, no grupo **Cadastros** do menu.

**Quem pode usar:** cadastrar serviço, `service:create` (no próprio time). Trocar a origem, `service:edit`. Gerar e revogar tokens, `token:manage`. Importar e sincronizar, `spec:publish`. Publicar pelo CI exige só o token, não uma pessoa.

Leia mais: [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos), [Editar e arquivar serviços](/admin/editar-servico), [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions), [Ler a spec do repositório](/receitas/spec-do-repositorio), [Ler a spec de uma URL](/receitas/spec-por-url), [API HTTP](/referencia/api) e [Extensão x-api-hub](/referencia/extensao-x-api-hub).

## Mapa de ligações

Um grafo interativo que mostra como as peças se conectam: serviços, integrações externas, repositórios, times e pessoas.

- **Abre em foco:** o mapa já abre centrado no item pedido (`?focus=`) ou, sem pedido, no serviço mais conectado. Os itens ao alcance do foco ficam nítidos e o resto fica esmaecido (a 25% de opacidade), mas continua clicável. Uma legenda fixa explica a forma de cada tipo.
- **Filtros por tipo** de item (serviços, integrações, repositórios, times, pessoas), no menu **Tipos**.
- **Foco na vizinhança:** o seletor **Foco** (com busca pelo nome) escolhe o item central, e **1º grau**, **2º grau** e **Tudo** definem o alcance (`?depth=`). Um clique num item troca o foco; duplo clique abre o serviço, a integração ou o repositório.
- **Modo Mapa ou Lista:** a lista é uma tabela paginada, navegável por teclado, com as mesmas ligações e a ação **Focar no mapa**. No modo Mapa há também o botão **Imprimir**.
- **Criar vínculos a partir do mapa** pelo botão **+ Vínculo** (só no modo Mapa): abre a página **Vínculos** com o modal **Novo vínculo**, já com o item em foco no campo **De**.
- **Tipos de vínculo entre serviços:** consome a API de, publica eventos em, assina eventos de, compartilha biblioteca com, depende de. Entre serviço e repositório: código-fonte, SDK cliente, infraestrutura, contrato.
- Remover um vínculo mostra um **Desfazer** por alguns segundos.
- Respeita a visibilidade: serviços restritos ao time não vazam pelo mapa.

![Mapa de ligações com serviços, repositórios, times e pessoas](/prints/06-mapa-completo.png)

*De uma versão anterior da interface. Hoje o mapa abre em foco, com os controles Foco, 1º grau, 2º grau e Tudo, e não tem mais o "Selecionar até N".*

**Quem pode usar:** ver, `graph:read`. Criar e remover vínculos, `link:edit`. Para um vínculo que sai de um serviço, é preciso ser do time dele (ou ter `service:edit_any`).

Leia mais: [Mapa de ligações](/uso/mapa), [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos) e [Mapear dependências](/receitas/mapear-dependencias).

## Integrações externas

Tudo o que os seus serviços usam e que não é um serviço do hub: uma API de terceiros, uma fila, um banco.

- **Tipos:** API externa, Fila, Tópico / evento, Webhook, Banco de dados, Cache, Armazenamento, E-mail / SMS e Outro.
- **Relações por tipo:** a API aceita "consome" e "fornece"; fila e tópico, "publica em" e "assina"; webhook, "envia" e "recebe"; banco, cache e armazenamento, "lê de" e "grava em"; e-mail e SMS, "consome".
- **Endereço por ambiente:** a URL, o nome da fila ou o endereço do banco em cada ambiente.
- **Descrição em Markdown**, provedor e link para a documentação oficial.
- **Nova integração** abre um modal de dois passos, **Identificar** (nome e tipo) e **Endereçar** (os endereços por ambiente, que podem ficar para depois).
- Uma integração é **compartilhada**: vários serviços podem usar a mesma, e cada página mostra quem mais a usa.
- **Excluir** uma integração é irreversível, então pede para digitar o nome dela.
- Aparecem como nós no mapa.

**Quem pode usar:** ver, `catalog:read`. Cadastrar uma integração, `link:edit`. Ligar a um serviço, `service:edit` (no próprio time).

Leia mais: [Integrações externas](/uso/integracoes) e [Cadastrar uma integração externa](/receitas/integracao-externa).

## Variáveis e segredos

Cada serviço guarda as variáveis de ambiente de cada ambiente, com um lugar seguro para os segredos.

- **Por serviço e por ambiente**, com descrição em Markdown.
- **Segredos cifrados** com AES-256-GCM. O valor não aparece na tela.
- **Revelar um segredo** exige `envvars:reveal`, fazer parte do time do serviço, e fica registrado na auditoria. O valor nunca vai para a auditoria.
- **Proteção contra descuido:** um nome com cara de segredo (`*_KEY`, `*_SECRET`, `*_TOKEN`, `*_PASSWORD` e semelhantes) em texto aberto pede confirmação.
- **Editar um segredo com o valor em branco mantém o valor atual.** Excluir uma variável mostra um **Desfazer** por alguns segundos.
- **Baixar `.env`:** o arquivo sai com os segredos em branco e um comentário indicando que o valor vem de quem mantém o serviço.
- **Copiar entre ambientes:** copia as chaves. Chaves que já existem no destino não são sobrescritas e os segredos chegam vazios.

**Quem pode usar:** ver, `envvars:read`. Editar, `envvars:edit`. Revelar, `envvars:reveal`. As duas últimas valem para os serviços do próprio time, a menos que a pessoa tenha `service:edit_any`.

Leia mais: [Variáveis de ambiente](/uso/variaveis) e [Segredos, .env e cópia entre ambientes](/receitas/segredos-e-env).

## Regras de negócio

Além da spec, cada serviço tem páginas em Markdown escritas pelo time: como o serviço funciona, quais regras aplica e quais são os pontos de atenção.

- Várias páginas por serviço (título de 2 a 80 caracteres, até 200 mil caracteres por página).
- Markdown com tabelas, listas de tarefas e código. HTML cru e links perigosos (`javascript:`) são removidos.
- As páginas valem para todos os ambientes do serviço.
- **Excluir** uma página é irreversível, então pede para digitar o título dela.

**Quem pode usar:** ler, `catalog:read`. Escrever, `docs:edit` (no próprio time).

Leia mais: [Regras de negócio](/uso/regras-de-negocio).

## Times

Um time é a unidade de responsabilidade. Ele dá nome a quem mantém cada serviço e define onde as permissões "do próprio time" valem.

- Criar times com nome, identificador (slug) e descrição.
- Adicionar pessoas pelo login do GitHub ou pelo e-mail, como **líder** ou **membro**. Só quem já tem acesso ativo entra num time.
- Um serviço tem no máximo **um time responsável**.
- Quem não tem `service:edit_any` só cria e edita serviços, variáveis, integrações e regras dos times de que participa.

**Quem pode usar:** `team:manage` (por padrão, Administrador e Proprietário), na página **Times** do grupo **Cadastros**.

Leia mais: [Times](/admin/times).

## Login e acesso

O hub é fechado. A pessoa entra com uma conta da empresa e o sistema decide o que fazer com ela.

- **Formas de login:** GitHub, Google, Microsoft (Entra ID), GitLab (inclusive próprio), Facebook, OIDC genérico (Keycloak, Okta, Auth0) e e-mail e senha. Você pode ativar várias ao mesmo tempo.
- **Vínculo com a empresa:** GitHub por organização; Google, GitLab e OIDC por domínio de e-mail verificado; Microsoft por tenant ou domínio. Facebook e e-mail e senha nunca comprovam vínculo.
- **Liberação automática:** quem comprova vínculo entra como Leitor. Sem a liberação automática, todos passam por aprovação.
- **Quem não comprova vínculo** pede acesso (e escreve uma justificativa de 10 a 500 caracteres) ou é barrado, conforme a política. Convites continuam valendo.
- **Aprovação com prazo:** o acesso de terceiros pode vencer sozinho.
- **Revalidação:** o vínculo é conferido no login e a cada N horas (padrão 12). Quem perde o vínculo é suspenso e volta sozinho se o recuperar.
- **Convite por e-mail** (link de uso único, 7 dias) e **link de nova senha** (1 hora). Com SMTP salvo, o hub envia o link e ainda o mostra para copiar. Sem SMTP, você copia o link.
- **Cadastro aberto**, se você liberar, sempre cria uma solicitação pendente.
- **Sessões:** ao suspender uma pessoa, trocar a senha ou usar **Encerrar todas as sessões**, o acesso cai na próxima requisição. Senhas usam scrypt, com bloqueio de 15 minutos depois de 5 erros seguidos.

![Tela de login](/prints/03-login.png)

*Tela de login. Os botões mudam conforme as formas de login que você ativou.*

**Quem pode usar:** aprovar e recusar solicitações de acesso, `access:decide`. Convidar, mudar papéis e suspender, `user:manage`. Configurar formas de login e regras de acesso, `settings:manage`.

Leia mais: [Provedores de login](/instalacao/provedores-de-login), [Pessoas e acesso](/admin/pessoas-e-acesso) e [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros).

## Papéis e permissões

Quatro papéis e 21 permissões, agrupadas em Catálogo, Variáveis de ambiente, Serviços e Administração.

- **Proprietário** (`OWNER`): sempre tem tudo. A instalação nunca fica com menos de um Proprietário.
- **Administrador** (`ADMIN`): por padrão, tudo menos `settings:manage` e `roles:manage`.
- **Mantenedor** (`MAINTAINER`): por padrão, cria e edita o que é do próprio time, publica specs e gera tokens.
- **Leitor** (`VIEWER`): por padrão, lê o catálogo, o mapa e as variáveis (sem revelar segredos).
- **Matriz editável** na tela **Permissões**. Ver o catálogo é obrigatório para todos, e as permissões administrativas só podem ir para o Administrador.
- Ninguém altera o próprio papel. Rotas administrativas respondem 404 para quem não tem a permissão.
- Toda mudança na matriz fica na auditoria.

**Quem pode usar:** `roles:manage` (por padrão, só o Proprietário).

Leia mais: [Permissões](/admin/permissoes), [Papéis e permissões](/referencia/permissoes) e [Papel com permissões sob medida](/receitas/papel-personalizado).

## Auditoria

Um registro das ações que importam, para responder "quem fez isso, e quando?".

- **O que entra:** login e saída, decisões de acesso, mudanças de papel e de permissão, times, serviços, vínculos, repositórios, tokens, publicações de spec, configurações, recuperação de OWNER e as ações do assistente de instalação. Revelar um segredo e baixar o `.env` também são registrados, sem nunca guardar o valor.
- **Filtros** por pessoa, tipo (grupos como Login e saída, Acesso, Pessoas, Times, Serviços, Vínculos, Tokens, Configurações), período e alvo.
- **Frases legíveis** ("Vínculo criado: A consome B"). Clicar na frase abre o registro, com o código técnico e o JSON.
- **Baixar CSV** com até 10.000 linhas, com proteção contra injeção de fórmula em planilhas. A própria exportação é registrada.

![Tela de auditoria](/prints/11-auditoria.png)

*Auditoria com filtros. A tabela hoje usa o componente padrão de listagem.*

**Quem pode usar:** `audit:read` (por padrão, Administrador e Proprietário).

Leia mais: [Auditoria](/admin/auditoria).

## Aparência

O hub pode ter o nome e a cor da sua empresa, e cada pessoa escolhe o tema que prefere.

- **Marca da instalação**, na aba **Aparência** de Configurações: o **Nome do sistema** (até 40 caracteres), que aparece no menu, na aba do navegador, no login e nos convites, e a **Cor de destaque**, usada em botões, links e no item ativo do menu. A logo do hub é a mesma do site.
- **Cor segura:** uma cor que deixaria links e botões ilegíveis (abaixo de 4,5:1 de contraste) é recusada antes de salvar, com o motivo.
- **Prévia** da marca nos dois temas, lado a lado, antes de salvar. O nome e a cor valem para todas as pessoas.
- **Tema por pessoa:** **Claro**, **Escuro** ou **Sistema** (que segue o computador), no menu do avatar, no pé da barra lateral. A escolha vale na hora, fica na conta da pessoa e acompanha o leitor da documentação da API.

**Quem pode usar:** a marca, `appearance:manage` (por padrão, Administrador e Proprietário). O tema não pede permissão.

Leia mais: [Aparência](/admin/aparencia).

## Instalação e operação

O hub se instala, se atualiza e se recupera sem editar o banco à mão.

- **Assistente de instalação** em 10 etapas: bem-vindo, banco de dados, formas de login, e-mail, organização, repositórios, regras de acesso, ambientes, primeiro administrador e revisão. O progresso fica salvo, e o assistente se tranca depois de concluído.
- **Docker Compose** com PostgreSQL, um container de migração que roda antes do app e o app com sistema de arquivos somente leitura, usuário sem privilégios e `no-new-privileges`.
- **Healthcheck** em `GET /api/health`.
- **Recuperação de OWNER** por linha de comando (`pnpm admin:recover`), para quando todos os administradores perdem o acesso.
- **Configurações** pós-instalação, em quatro abas: **Organização e acesso**, **Conexões** (formas de login, e-mail e repositórios), **Ambientes e sessões** e **Aparência**. Os detalhes técnicos, como a porta do SMTP e o token do cron, ficam em **Avançado**.
- **Somente PostgreSQL** hoje.

**Quem pode usar:** quem administra o servidor (instalação, atualização, backup e recuperação) e, dentro do hub, `settings:manage`.

Leia mais: [Visão geral da instalação](/instalacao/), [Assistente de instalação](/instalacao/assistente), [Produção com Docker](/instalacao/docker) e [Recuperação de OWNER](/admin/recuperacao-de-owner).

## Experiência de uso

Ninguém precisa de treinamento para começar. O próprio hub ensina.

- **Tour obrigatório** no primeiro acesso: um panorama único, no Catálogo, que passa pelos quatro grupos do menu, pela busca, pelo **+ Novo** e pelo menu da conta. O hub fica bloqueado até a pessoa concluir.
- **Botão flutuante ?** em toda tela: explica a tela atual e oferece **Iniciar tour desta tela** quando você quiser rever. Cada tela de cadastro e de administração tem o próprio tour.
- **Modais e formulários padronizados:** criar abre um modal com **Cancelar** à esquerda e a ação principal à direita, e pergunta "Descartar o que você digitou?" antes de perder o que foi digitado. Nos formulários de edição, a barra **Alterações não salvas** só aparece quando há mudança.
- **Tabelas padronizadas:** toda listagem usa o mesmo componente, com cabeçalho fixo que acompanha a rolagem da página, ações por linha e estados vazios consistentes.
- **Paginação padronizada:** rodapé com "Mostrando 1–10 de 137 serviços", seletor **Por página** (10, 20, 50 ou 100) e números de página. Os parâmetros `?page=` e `?size=` ficam na URL e preservam os filtros.
- **Celular:** o menu vira uma barra no topo e as tabelas escondem as colunas menos importantes.
- **Busca e atalhos:** **Buscar** (Ctrl+K ou ⌘K) acha telas, serviços e atalhos de criação, e **+ Novo** abre o cadastro que a sua permissão deixa criar.
- **Acessibilidade:** dois temas com contraste conferido, cor de destaque recusada quando fica ilegível e lista do mapa navegável por teclado.
- **Toda a interface em português do Brasil.**

![O catálogo em um celular](/prints/14-celular-catalogo.png)

*O catálogo em tela de celular.*

Leia mais: [Primeiro acesso e tour](/uso/primeiro-acesso).

## O que ainda não existe

Estes itens não fazem parte do hub hoje. Estão no [roadmap](/arquitetura/roadmap):

- Limite de requisições compartilhado entre várias instâncias (hoje é em memória, para uma instância).
- Outros bancos além de PostgreSQL, como banco do próprio hub.

## Próximos passos

- [Início rápido](/guia/inicio-rapido): coloque o hub no ar e veja essas funcionalidades funcionando.
- [Conceitos principais](/guia/conceitos): entenda os termos usados nesta página.
- [Passo a passo](/receitas/): receitas para cenários comuns, como publicar pelo CI.
