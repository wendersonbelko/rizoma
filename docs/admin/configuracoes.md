---
description: "A tela Configurações do Rizoma e suas quatro abas: Organização e acesso, Conexões, Ambientes e sessões e Aparência, com os blocos Avançado e a zona de perigo."
---

# Configurações

A tela **Configurações** reúne o que define como o Rizoma funciona para a sua empresa: quem conta como "da empresa", como as pessoas entram, onde está o código, quais são os ambientes, quais são as regras de acesso e de sessão, e a marca do sistema. Esta página descreve as quatro abas, campo por campo, e o efeito de cada mudança. É para quem administra o hub.

## Para que serve

A maioria das opções foi definida no [assistente de instalação](/instalacao/assistente). Depois da instalação, o assistente se tranca e tudo passa a ser ajustado aqui, sem reiniciar o servidor: trocar o segredo de um provedor de login, acrescentar um domínio de e-mail, criar o ambiente de homologação, mudar a duração da sessão.

## Quem vê

O item **Configurações** do menu, no grupo **Sistema**, abre `/admin/settings`. A página abre para quem tem a permissão de configurações (login, ambientes, repositórios e regras de acesso) **ou** a de mudar a marca do sistema, e **cada aba pede a sua permissão**:

| Aba | `?s=` | Permissão exigida | Papéis com acesso por padrão |
|---|---|---|---|
| **Organização e acesso** | `organization` | Configurações (RN-74) | Proprietário |
| **Conexões** | `connections` | Configurações | Proprietário |
| **Ambientes e sessões** | `environments` | Configurações | Proprietário |
| **Aparência** | `appearance` | Mudar a marca do sistema | Administrador, Proprietário |

Por isso o Administrador, que por padrão não tem a permissão de configurações, abre **Configurações** e vê só a aba **Aparência**. Quem pede uma aba que não pode ver recebe "não encontrada", como no resto do hub. Como a permissão de configurações é administrativa, só pode ser dada ao papel Administrador, em [Permissões](/admin/permissoes).

::: warning O rótulo da permissão de aparência está desatualizado
Na matriz de [Permissões](/admin/permissoes), a permissão `appearance:manage` ainda aparece como "Mudar título e tema do sistema". Hoje ela vale só para a marca (nome e cor de destaque): o tema Claro, Escuro ou Sistema é escolha de cada pessoa. Veja [Aparência](/admin/aparencia).
:::

## O que aparece na tela

![Tela Configurações, de uma versão anterior](/prints/12-configuracoes.png)

*De uma versão anterior, com sete seções num menu ao lado. Hoje são quatro abas no alto da tela, como descrito abaixo.*

No topo, o título **Configurações** e uma linha de contexto: "Instalado em 17/08/2026. Proprietários: @marina-costa, @rafael-souza." Se houver menos de dois Proprietários, o hub acrescenta "Recomendado ter pelo menos dois Proprietários ativos." Isso evita que a perda de uma única conta tranque a administração (veja [Recuperação de OWNER](/admin/recuperacao-de-owner)). Quem só tem a permissão de aparência vê, no lugar, "Nome do sistema e cor de destaque."

Abaixo, as abas. A aba aberta fica no parâmetro `?s=` da URL. Sem `?s=`, abre a primeira aba que você pode ver.

::: info Os valores antigos de `?s=` continuam valendo
Antes eram sete seções. Os endereços antigos redirecionam para a aba nova e já descem até o bloco certo: `login`, `email` e `repositories` vão para **Conexões**; `access` vai para **Organização e acesso**; `sessions` vai para **Ambientes e sessões**. Os nomes em português de antes (`organizacao`, `repositorios`, `ambientes`, `acesso`, `sessoes`, `aparencia`) também funcionam. O endereço `/admin/appearance` redireciona para a aba **Aparência**.
:::

### Como cada formulário salva

Os formulários de Configurações seguem o padrão do hub: **o botão de salvar só aparece quando há o que salvar**. Na primeira mudança, uma barra fixa no pé da tela mostra **Alterações não salvas**, **Descartar** e o botão de salvar do bloco (**Salvar organização**, **Salvar regras**, **Salvar e-mail**, **Salvar marca**). Se você tentar sair com mudanças pendentes, o hub pergunta antes. Cada bloco salva sozinho: salvar um não salva o outro.

Criar e editar uma forma de login, uma origem de repositório ou um ambiente abre um modal, com **Cancelar** à esquerda e a ação principal à direita. **Desligar** uma forma de login ou uma origem pede confirmação num modal; ações irreversíveis ficam na **Zona de perigo**, no fim da aba, e pedem para digitar uma palavra ou o nome do que será removido.

## Aba Organização e acesso

A aba tem dois blocos: **Organização** e **Regras de acesso**. No alto, avisos amarelos alertam sobre configurações que não bloqueiam, mas mudam o comportamento:

- "GitHub sem organização informada: ninguém entra direto, todos pedem acesso."
- "Google (ou GitLab, ou OIDC) sem domínio de e-mail aceito: todos pedem acesso."
- "Microsoft sem tenant nem domínio aceito: todos pedem acesso."

### Bloco Organização

O bloco define o que comprova que uma pessoa é da empresa ("Quem conta como da empresa. É isso que decide quem entra direto e quem espera aprovação.").

| Campo | O que faz |
|---|---|
| **Nome da empresa** `*` | De 2 a 80 caracteres. Aparece acima do nome do sistema, no menu e no login. |
| **Identificador** | Somente leitura ("Definido na instalação. Não muda."). |
| **Domínios de e-mail da empresa** | Digite um domínio e clique em **+**. Google, Microsoft, GitLab e OIDC contam o e-mail verificado desses domínios como vínculo. Subdomínios valem: `time.acme.com` casa com `acme.com`. Até 20 domínios. |
| **Organizações do GitHub aceitas** | Só aparece se o login com GitHub estiver ligado. Digite o nome e clique em **+**. Até 10. |

Clique em **Salvar organização**. O nome do sistema e a cor de destaque não ficam aqui: estão na aba **Aparência**.

::: warning Mudar organizações ou domínios força a revalidação
Se a lista de organizações ou de domínios mudou, o hub marca todas as pessoas ativas para conferir o vínculo de novo no próximo acesso (RN-75), e a resposta é "Salvo. Quem já tem conta será conferido de novo no próximo acesso." Quem entrou por uma organização removida é suspenso. Se nada mudou nas listas, a resposta é só "Salvo."
:::

### Bloco Regras de acesso

O bloco define o que acontece quando alguém entra pela primeira vez e por quanto tempo valem as sessões e as solicitações de acesso. As duas decisões (liberar automaticamente e o que fazer com quem não comprova vínculo) ficam juntas. Os três prazos ficam no grupo **Prazos**.

| Campo | O que faz |
|---|---|
| **Liberar automaticamente quem comprova vínculo com a empresa** | Ligado, quem comprova vínculo entra direto como Leitor. Desligado, todo mundo passa pela aprovação (RN-04). |
| **Quem não comprova vínculo** | **Pode pedir acesso e aguardar aprovação** ou **Não pode entrar (convites e aprovações manuais continuam valendo)** (RN-05). |
| **Sessão (horas)** | Tempo até pedir login de novo. De 1 a 72. O padrão é 8. |
| **Conferir vínculo a cada (horas)** | De quanto em quanto tempo o hub confere se a pessoa ainda é da empresa. De 1 a 72. O padrão é 12. |
| **Solicitação expira (dias)** | Solicitações de acesso não decididas expiram depois disso. De 1 a 90. O padrão é 14. |

Clique em **Salvar regras**. A resposta é "Regras salvas. A duração de sessão vale para os próximos logins."

- **A duração da sessão vale para os próximos logins (RN-78).** Sessões já abertas mantêm a validade original.
- **Revalidação (RN-10).** Só o GitHub permite reconsultar o vínculo sem novo login; nos demais provedores, a conferência acontece no próximo login.
- **Solicitações (RN-11).** Uma solicitação expirada não bloqueia ninguém: basta entrar de novo para abrir outra. As decisões ficam em [Pessoas e acesso](/admin/pessoas-e-acesso).

## Aba Conexões

A aba reúne tudo o que o hub liga por fora, em três blocos: **Formas de login**, **E-mail** e **Repositórios**. Antes eram seções soltas; quem queria "conectar o GitHub" tinha dois lugares para procurar.

### Formas de login

O bloco ("Como as pessoas entram no hub. Dá para ligar mais de uma.") lista as sete formas de login numa tabela com **Forma de login**, **Estado** (**Ligado** ou **Desligado**) e as ações. Cada linha mostra o nome e "Vínculo com a empresa: …". Os avisos amarelos de organização e domínio aparecem também aqui.

**Ligar** (ou **Configurar**, se já está ligada) abre um modal com os campos daquele provedor, a dica de onde criar o aplicativo e a **URL de retorno (callback)** já pronta, no formato `<AUTH_URL>/api/auth/callback/<id>`. O botão do modal é **Ligar forma de login** (ou **Salvar alterações**).

**Desligar** abre um modal de confirmação: "Ninguém mais entra por esta forma de login e o secret guardado é apagado. Para ligar de novo, será preciso informar os dados outra vez." O botão é **Desligar forma de login**. Se isso deixasse você sem a própria forma de entrar, o modal mostra o aviso e não desliga.

| Provedor | Campos | Vínculo com a empresa |
|---|---|---|
| **GitHub** | **Client ID**, **Client secret** | Membro ativo de uma organização aceita |
| **Google** | **Client ID**, **Client secret** | E-mail verificado de um domínio aceito |
| **Microsoft** | **Client ID**, **Client secret**, **Tenant (ID do diretório)** | Conta do tenant informado ou de um domínio aceito |
| **GitLab** | **URL do GitLab (opcional)**, **Client ID**, **Client secret** | E-mail de um domínio aceito |
| **Facebook** | **App ID**, **App secret** | Não comprova vínculo: todo acesso passa por aprovação |
| **OIDC (Keycloak, Okta, Auth0…)** | **Nome do botão**, **Emissor (issuer)**, **Client ID**, **Client secret** | E-mail verificado de um domínio aceito |
| **E-mail e senha** | A caixa "Permitir que pessoas criem conta e peçam acesso (sempre com aprovação). Desmarcado, só entra quem recebe convite." | Não comprova vínculo: entra por convite ou por aprovação |

Regras dos campos:

- **Segredos.** Ficam cifrados no banco. Num provedor já salvo, deixe o secret em branco para manter o atual ("Já existe um secret salvo. Deixe em branco para manter."). Um secret novo precisa ter pelo menos 8 caracteres.
- **Google.** O Client ID termina em `.apps.googleusercontent.com`.
- **Facebook.** O App ID é numérico.
- **Microsoft.** O tenant é o ID do diretório (GUID) ou o domínio dele. Com tenant, só contas do seu diretório contam como da empresa.
- **OIDC.** O emissor é uma URL HTTPS que publica `/.well-known/openid-configuration`, e o nome do botão é obrigatório (por exemplo, Keycloak).
- **E-mail e senha.** Com a caixa de cadastro marcada, o login mostra **Pedir acesso**; desmarcada, só entra quem recebe convite.

Antes de gravar, o hub testa o que dá para testar (RN-64 e RN-76): o Client ID e o secret do GitHub são conferidos com o GitHub ("GitHub recusou esse Client ID / Client secret."), e o emissor OIDC é consultado em `/.well-known/openid-configuration` ("O emissor OIDC respondeu 404…" ou "Não consegui acessar o emissor OIDC. Confira a URL."). Os outros provedores são salvos como informados. A resposta é "Formas de login salvas. Valem a partir do próximo login."

O hub também garante que sempre sobre uma forma de entrar para você: se a sua conta usa o GitHub e você desligar o GitHub sem outra forma que você use, a resposta é "Você ficaria sem forma de entrar. Mantenha a forma de login que você usa hoje." Pelo menos um provedor precisa ficar ligado (RN-01).

Para criar os aplicativos em cada provedor, veja [Provedores de login](/instalacao/provedores-de-login) e [Login com Keycloak](/receitas/login-com-keycloak).

### E-mail

O bloco mostra o selo **Envio ligado** ou **Envio desligado** e guarda o servidor que envia convite e link de nova senha ("O sistema usa este servidor para enviar convites e links de nova senha."). Sem servidor, convites e links são só copiados e enviados por você.

| Campo | O que faz |
|---|---|
| **Servidor SMTP** `*` | O endereço do servidor, como `smtp.empresa.com`. |
| **Remetente** `*` | O endereço que aparece como quem enviou. |
| **Usuário** | Em branco se o servidor não exige autenticação. |
| **Senha** | Fica cifrada. Num servidor já salvo, "Já existe uma senha salva. Preencha só para trocar." |
| **Endereço público do hub** `*` | A origem dos links do e-mail, como `https://hub.empresa.com`. |
| **Avançado: porta e criptografia** | **Porta** (em geral 587 ou 465) e **TLS implícito** (porta 465). Desmarcado, a conexão usa STARTTLS quando o servidor oferece, como na porta 587. O bloco já abre aberto se a configuração salva foge do padrão. |

Em **E-mail de prova**, preencha um endereço e clique em **Testar conexão**: o teste abre o SMTP com o que está na tela, sem salvar, e, com o e-mail de prova preenchido, manda uma mensagem. Para gravar, clique em **Salvar e-mail**; salvar também testa antes de gravar. A resposta é "SMTP salvo. Convites e links de nova senha passam a ser enviados."

A mesma etapa existe no assistente, depois de Formas de login, e pode ser pulada.

Quando já existe SMTP, a **Zona de perigo** no fim da aba oferece **Desligar envio de e-mail** (botão **Desligar envio**): apaga a configuração, inclusive a senha guardada, e os links voltam a ser só copiados ("Envio de e-mail desligado. Os links voltam a ser só copiados.").

Em desenvolvimento, o `pnpm db:up` sobe um Mailpit na máquina. Se esta instalação ainda não tem SMTP, `pnpm mail:dev` grava `127.0.0.1` na porta `1025`, sem TLS e sem usuário. As mensagens aparecem em `http://localhost:8025`, não numa caixa real.

### Repositórios

O bloco liga o hub à hospedagem do código ("Onde está o código. Mesmo sem nenhuma integração, as specs chegam pelo CI, por URL ou por importação manual."). As integrações servem para confirmar que um repositório existe ao cadastrá-lo (RN-50) e para ler arquivos de spec direto do repositório.

A tabela **Onde está o código** tem quatro linhas: **GitHub**, **GitLab**, **Bitbucket** e **Outro (URL direta)**, cada uma **Ligado** ou **Desligado**. **Ligar** (ou **Configurar**) abre o modal; **Desligar** pede confirmação ("O hub deixa de ler specs direto desse provedor e o token guardado é apagado. As specs que já estão no catálogo continuam."), no botão **Desligar origem**. Para os três primeiros, o modal pede:

| Campo | O que faz |
|---|---|
| **Token de leitura** | O token que o hub usa só para ler. Fica cifrado; num provedor já salvo, "Token salvo. Deixe em branco para manter." |
| **Avançado: instalação própria** | **URL da instalação**, para GitHub Enterprise, GitLab ou Bitbucket próprios. Deixe em branco para usar o serviço na nuvem. Precisa começar com `http://` ou `https://`. |

Dicas de token: no GitHub, um token fine-grained só de leitura em Contents e Metadata; no GitLab, um Project ou Group access token com os escopos `read_repository` e `read_api`; no Bitbucket, um access token de repositório ou workspace com leitura. **Outro (URL direta)** não tem campos: as specs vêm por URL, CI ou importação manual.

No modal, clique em **Ligar origem** (ou **Salvar alterações**). O hub testa o token com o provedor ("GitHub: token recusado." se ele for recusado); se não conseguir falar com o provedor, salva mesmo assim, e a sincronização mostra o erro depois. A resposta é "Integrações de repositório salvas."

Sem nenhuma integração, o hub continua funcionando: os serviços recebem a spec pelo CI, por URL ou por importação manual.

Abaixo da tabela há dois quadros, que começam pelo para quê e deixam os detalhes técnicos em **Avançado**:

- **Atualizar a spec quando alguém faz push.** Quando o código muda no repositório, o provedor avisa o hub e a spec é lida de novo. Em **Avançado: endereço e segredo do webhook**, o quadro mostra o endereço para copiar (`<endereço público>/api/v1/hooks`) e um botão por provedor ligado (**Gerar segredo · GitHub**, ou **Gerar outro segredo** se já existe). O endereço usa o **Endereço público do hub** do bloco E-mail (ou, sem ele, o `AUTH_URL` da instalação); se nenhum dos dois existir, o quadro pede que você preencha o do bloco E-mail. O segredo aparece no modal e fica visível até você fechar. Sem nenhum provedor ligado, o quadro diz "Ligue GitHub, GitLab ou Bitbucket acima para ativar."
- **Sincronização agendada.** Para ler as specs dos repositórios em horários fixos, um agendador da sua infraestrutura (cron) pede ao hub que sincronize. Em **Avançado: chamada e token**, o quadro mostra a chamada, `POST /api/v1/sync` com o cabeçalho `Authorization: Bearer` e o token. **Gerar token** (ou **Gerar outro token**, que invalida o anterior) mostra o valor uma vez, com o botão **Copiar**: copie na hora, porque ele não volta para a tela.

## Aba Ambientes e sessões

A aba tem o bloco **Ambientes**, o bloco **Sessões e recuperação** e, no fim, a **Zona de perigo**.

### Ambientes

O bloco define os ambientes (desenvolvimento, homologação, produção ou outros nomes) e como uma branch do CI cai em cada um ("A spec enviada pelo CI cai no primeiro ambiente, de cima para baixo, cuja branch casar com o padrão. Use Subir e Descer para mudar a ordem.").

A tabela **Ambientes e branches** mostra a cor, o nome (com o selo **Produção**, quando for o caso), o identificador e as branches. **Adicionar ambiente** abre o modal **Novo ambiente**, e **Editar** abre o do ambiente; **Subir** e **Descer** gravam na hora. A spec enviada pelo CI vai para o ambiente cuja regra de branch casar primeiro, **de cima para baixo** (RN-90 e RN-91). Cada ambiente tem:

| Campo | O que faz |
|---|---|
| **Nome** `*` | De 2 a 40 caracteres. É o que aparece nas telas. |
| **Identificador** `*` | O slug do ambiente, usado em URLs e em `?environment=`. Letras minúsculas, números e hífen, começando por letra ou número, até 20 caracteres. Num ambiente novo, acompanha o nome; depois de criado, não muda. |
| **Cor** | Distingue o ambiente em chips e no seletor. |
| **Branches** `*` | Digite um padrão e clique em **+**. Ao menos uma regra. |
| **É produção** | Marca o ambiente de produção: ganha o selo Produção e é o que abre por padrão na página do serviço. |
| **Avançado** | **Branch de leitura**: a branch de onde o hub lê o arquivo de spec, quando a origem do serviço é "Arquivo no repositório". |

As regras de branch aceitam três curingas: `*` casa um trecho sem barra (`release/*`), `**` casa qualquer coisa, inclusive barras (`feature/**`), e `?` casa um caractere. Exemplos: `main`, `release/*`, `feature/**`, `hotfix-*`. O prefixo `refs/heads/` é ignorado.

No modal, clique em **Criar ambiente** (ou **Salvar ambiente**). A resposta é "Ambientes salvos. Novas publicações do CI já usam as regras de branch." Dá para ter até 10 ambientes; no limite, o botão some e a tela diz "Limite de 10 ambientes."

Veja [Ambientes por branch](/receitas/ambientes-por-branch) para um passo a passo.

### Sessões e recuperação

Reúne ações de segurança que valem para o hub inteiro.

**Recuperação de Proprietário em aberto.** Se alguém abriu uma janela de recuperação pela linha de comando e ela ainda não foi usada nem expirou, aparece no topo do bloco o aviso **Recuperação de Proprietário em aberto**. Ele diz quem será Proprietário no primeiro login e até quando. Se você não abriu essa janela pelo servidor, clique em **Cancelar janela**, confirme em **Cancelar a janela de recuperação** ("Janela de recuperação cancelada.") e revise quem tem acesso de linha de comando ao servidor. Veja [Recuperação de OWNER](/admin/recuperacao-de-owner).

**Conferir vínculos com a empresa.** Use depois de mudar os domínios ou as organizações aceitas. O botão **Conferir todas as pessoas** marca todas para conferir o vínculo no próximo acesso, sem que ninguém precise sair. A resposta é "Cada pessoa será conferida de novo no próximo acesso." Não apaga nada, então não fica na zona de perigo.

**Se todos os Proprietários perderem o acesso.** Um bloco recolhido lembra o comando de recuperação, `pnpm admin:recover --login usuario-ou-email`, que roda no servidor. Com login por e-mail e senha, `--reset-password` gera também um link de nova senha.

### Zona de perigo

No fim da aba, as ações irreversíveis, todas no mesmo padrão: um botão com contorno vermelho abre um modal que pede para digitar uma palavra, e só então o botão vermelho do modal habilita.

| Ação | Confirmação | O que faz |
|---|---|---|
| **Encerrar todas as sessões** | Digite `ENCERRAR` | Todo mundo, menos você, precisa entrar de novo. Use depois de um incidente ou de uma troca de credenciais. A resposta é "Sessões encerradas para 42 pessoas. Cada uma vai precisar entrar de novo." Sem a palavra certa, aparece "Digite ENCERRAR para confirmar." (RN-77). |
| **Remover o ambiente** *nome* (botão **Remover ambiente**) | Digite o nome do ambiente | Remove o ambiente. Há uma ação por ambiente, e elas só aparecem quando existe mais de um. Não dá para desfazer. A resposta é "Ambiente Homologação removido." |

::: warning Só dá para remover um ambiente vazio (RN-92)
Um ambiente que já tem specs publicadas ou variáveis não pode ser removido: o hub responde "Não dá para remover Homologação: já tem specs ou variáveis. Renomeie em vez de remover." O hub identifica o ambiente pelo **Identificador**. Para trocar o nome exibido, edite o **Nome**; o identificador de um ambiente que já existe não muda.
:::

## Aba Aparência

A aba define a **marca** do sistema, igual para todas as pessoas: o **Nome do sistema** e a **Cor de destaque**, com uma prévia nos temas Claro e Escuro. O tema (Claro, Escuro ou Sistema) não é escolhido aqui: cada pessoa escolhe o seu no menu do avatar. Os campos, a checagem de contraste e a prévia estão em [Aparência](/admin/aparencia).

## Regras importantes

- **Só quem tem a permissão (RN-74).** Cada aba pede a sua. O identificador da empresa não muda depois da instalação.
- **Mudar organizações ou domínios (RN-75).** Força a revalidação do vínculo de todos no próximo acesso.
- **Credenciais verificadas (RN-64 e RN-76).** GitHub e OIDC são testados antes de salvar; os outros provedores são salvos como informados. Tudo fica cifrado.
- **Encerrar sessões (RN-77).** Exige digitar `ENCERRAR` e mantém só a sua sessão.
- **Duração de sessão (RN-78).** Vale para os próximos logins.
- **Ambientes (RN-90 a RN-92).** Regras de branch ordenadas; remover só sem specs nem variáveis.
- **Auditoria.** Cada bloco registra o próprio evento na [Auditoria](/admin/auditoria), em frases como "atualizou os dados da organização", "atualizou as formas de login" e "atualizou os ambientes". Nenhum segredo entra no registro.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Aparência](/admin/aparencia): o nome e a cor de destaque, e o tema de cada pessoa.
- [Provedores de login](/instalacao/provedores-de-login): como criar o aplicativo em cada provedor.
- [Ambientes por branch](/receitas/ambientes-por-branch): configure ambientes e regras de branch.
- [Pessoas e acesso](/admin/pessoas-e-acesso): decida as solicitações que as regras de acesso geram.
- [Recuperação de OWNER](/admin/recuperacao-de-owner): o que fazer se a administração for perdida.
