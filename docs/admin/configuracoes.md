---
description: "A tela Configurações do Rizoma e suas seções: Organização, Formas de login, E-mail, Repositórios, Ambientes, Regras de acesso e Sessões e recuperação."
---

# Configurações

A tela **Configurações** reúne o que define como o Rizoma funciona para a sua empresa: quem conta como "da empresa", como as pessoas entram, onde está o código, quais são os ambientes e quais são as regras de acesso e de sessão. Esta página descreve as seções, campo por campo, e o efeito de cada mudança. É para quem administra o hub.

## Para que serve

A maioria das opções foi definida no [assistente de instalação](/instalacao/assistente). Depois da instalação, o assistente se tranca e tudo passa a ser ajustado aqui, sem reiniciar o servidor: trocar o segredo de um provedor de login, acrescentar um domínio de e-mail, criar o ambiente de homologação, mudar a duração da sessão.

## Quem vê

O item **Configurações** do menu abre `/admin/settings`. A tela exige a permissão de configurações (login, ambientes, repositórios e regras de acesso), que por padrão **só o OWNER** tem (RN-74). Quem não a tem recebe "não encontrada". Como é uma permissão administrativa, só pode ser dada ao papel ADMIN, em [Permissões](/admin/permissoes).

## O que aparece na tela

![Tela Configurações](/prints/12-configuracoes.png)

*A tela Configurações. Cada assunto fica numa seção do menu ao lado do conteúdo.*

No topo, o título **Configurações** e uma linha de contexto: "Instalado em 17/08/2026. OWNERs: @marina-costa, @rafael-souza." Se houver menos de dois OWNERs, o hub acrescenta "Recomendado ter pelo menos dois OWNERs ativos." Isso evita que a perda de uma única conta tranque a administração (veja [Recuperação de OWNER](/admin/recuperacao-de-owner)).

Ao lado, no desktop, um menu lista as seções. No celular, o mesmo menu vira uma faixa acima do conteúdo. A seção aberta fica no parâmetro `?s=` da URL:

| Seção | `?s=` |
|---|---|
| **Organização** | `organization` (padrão) |
| **Formas de login** | `login` |
| **E-mail** | `email` |
| **Repositórios** | `repositories` |
| **Ambientes** | `environments` |
| **Regras de acesso** | `access` |
| **Sessões e recuperação** | `sessions` |

Nas seções **Organização** e **Formas de login**, avisos amarelos alertam sobre configurações que não bloqueiam, mas mudam o comportamento:

- "GitHub sem organização informada: ninguém entra direto, todos pedem acesso."
- "Google (ou GitLab, ou OIDC) sem domínio de e-mail aceito: todos pedem acesso."
- "Microsoft sem tenant nem domínio aceito: todos pedem acesso."

## Seção Organização

A seção define o que comprova que uma pessoa é da empresa.

| Campo | O que faz |
|---|---|
| **Nome da empresa** | De 2 a 80 caracteres. Aparece acima do título do sistema, no menu e no login. |
| **Identificador** | Somente leitura ("Definido na instalação."). Não muda depois da instalação. |
| **Domínios de e-mail da empresa** | Digite um domínio e clique em **+**. Google, Microsoft, GitLab e OIDC contam o e-mail verificado desses domínios como vínculo. Subdomínios valem: `time.acme.com` casa com `acme.com`. Até 20 domínios. |
| **Organizações do GitHub aceitas** | Só aparece se o login com GitHub estiver ativo. Digite o nome e clique em **+**. Até 10. |

Clique em **Salvar organização**. O título e as cores do sistema não ficam aqui: estão em [Aparência](/admin/aparencia).

::: warning Mudar organizações ou domínios força a revalidação
Se a lista de organizações ou de domínios mudou, o hub marca todas as pessoas ativas para conferir o vínculo de novo no próximo acesso (RN-75), e a resposta é "Salvo. O vínculo de todos será conferido de novo no próximo acesso." Quem entrou por uma organização removida é suspenso. Se nada mudou nas listas, a resposta é só "Salvo."
:::

## Seção Formas de login

A seção lista as sete formas de login. Cada linha mostra o nome, como comprova vínculo e o estado **Ligado** ou **Desligado**. **Ligar** ou **Configurar** abre um modal com os campos daquele provedor, a dica de onde criar o aplicativo e a **URL de retorno (callback)** já pronta, no formato `<AUTH_URL>/api/auth/callback/<id>`. **Desligar** grava na hora. Se isso deixasse você sem a própria forma de entrar, o aviso fica na linha.

| Provedor | Campos | Vínculo com a empresa |
|---|---|---|
| **GitHub** | **Client ID**, **Client secret** | Membro ativo de uma organização aceita |
| **Google** | **Client ID**, **Client secret** | E-mail verificado de um domínio aceito |
| **Microsoft** | **Client ID**, **Client secret**, **Tenant (ID do diretório)** | Conta do tenant informado ou de um domínio aceito |
| **GitLab** | **URL do GitLab (opcional)**, **Client ID**, **Client secret** | E-mail de um domínio aceito |
| **Facebook** | **App ID**, **App secret** | Não comprova vínculo: todo acesso passa por aprovação |
| **OIDC (Keycloak, Okta, Auth0…)** | **Nome do botão**, **Emissor (issuer)**, **Client ID**, **Client secret** | E-mail verificado de um domínio aceito |
| **E-mail e senha** | A caixa "Permitir que pessoas criem conta e peçam acesso" | Não comprova vínculo: entra por convite ou por aprovação |

Regras dos campos:

- **Segredos.** Ficam cifrados no banco. Num provedor já salvo, deixe o secret em branco para manter o atual. Um secret novo precisa ter pelo menos 8 caracteres.
- **Google.** O Client ID termina em `.apps.googleusercontent.com`.
- **Facebook.** O App ID é numérico.
- **Microsoft.** O tenant é o ID do diretório (GUID) ou o domínio dele. Com tenant, só contas do seu diretório contam como da empresa.
- **OIDC.** O emissor é uma URL HTTPS que publica `/.well-known/openid-configuration`, e o nome do botão é obrigatório (por exemplo, Keycloak).
- **E-mail e senha.** Com a caixa de cadastro marcada, o login mostra **Pedir acesso**; desmarcada, só entra quem recebe convite.

No modal, clique em **Salvar**. Antes de gravar, o hub testa o que dá para testar (RN-64 e RN-76): o Client ID e o secret do GitHub são conferidos com o GitHub ("GitHub recusou esse Client ID / Client secret."), e o emissor OIDC é consultado em `/.well-known/openid-configuration` ("O emissor OIDC respondeu 404…" ou "Não consegui acessar o emissor OIDC. Confira a URL."). Os outros provedores são salvos como informados. A resposta é "Formas de login salvas. Valem a partir do próximo login."

O hub também garante que sempre sobre uma forma de entrar para você: se a sua conta usa o GitHub e você desmarcar o GitHub sem outra forma que você use, a resposta é "Você ficaria sem forma de entrar. Mantenha a forma de login que você usa hoje." Pelo menos um provedor precisa ficar ativo (RN-01).

Para criar os aplicativos em cada provedor, veja [Provedores de login](/instalacao/provedores-de-login) e [Login com Keycloak](/receitas/login-com-keycloak).

## Seção E-mail

A seção mostra se o envio está ligado ou desligado e guarda o servidor que envia convite e link de nova senha. Os campos ficam em dois blocos: **Servidor** (servidor, porta, TLS implícito, usuário e senha) e **Mensagens** (remetente e o endereço público do hub, a origem dos links). A senha vai cifrada e a tela só diz que já existe uma senha salva.

**Salvar SMTP** e **Testar conexão** ficam juntos, ao lado do e-mail de prova. O teste abre o SMTP e, se o e-mail de prova estiver preenchido, manda uma mensagem. Salvar também testa antes de gravar. **Desligar envio**, no fim da seção e só quando já existe SMTP, apaga a configuração: os links voltam a ser só copiados.

A mesma etapa existe no assistente, depois de Formas de login, e pode ser pulada.

Em desenvolvimento, o `pnpm db:up` sobe um Mailpit na máquina. Se esta instalação ainda não tem SMTP, `pnpm mail:dev` grava `127.0.0.1` na porta `1025`, sem TLS e sem usuário. As mensagens aparecem em `http://localhost:8025`, não numa caixa real.

## Seção Repositórios

A seção liga o hub à hospedagem do código. As integrações servem para confirmar que um repositório existe ao cadastrá-lo (RN-50) e para ler arquivos de spec direto do repositório.

A lista tem quatro linhas: **GitHub**, **GitLab**, **Bitbucket** e **Outro (URL direta)**, cada uma **Ligada** ou **Desligada**. **Ligar** ou **Configurar** abre o modal. **Desligar** grava na hora. Para os três primeiros, o modal pede:

| Campo | O que faz |
|---|---|
| **URL (só para instalação própria)** | Para GitLab ou Bitbucket próprios. Deixe em branco para usar o serviço na nuvem. Precisa começar com `http://` ou `https://`. |
| **Token de leitura** | O token que o hub usa só para ler. Fica cifrado; num provedor já salvo, "Token salvo. Deixe em branco para manter." |

Dicas de token: no GitHub, um token fine-grained só de leitura em Contents e Metadata; no GitLab, um Project ou Group access token com os escopos `read_repository` e `read_api`; no Bitbucket, um access token de repositório ou workspace com leitura. **Outro (URL direta)** não tem campos: as specs vêm por URL, CI ou importação manual.

No modal, clique em **Salvar**. O hub testa o token com o provedor ("GitHub: token recusado." se ele for recusado); se não conseguir falar com o provedor, salva mesmo assim, e a sincronização mostra o erro depois. A resposta é "Integrações de repositório salvas."

Sem nenhuma integração, o hub continua funcionando: os serviços recebem a spec pelo CI, por URL ou por importação manual.

Abaixo da lista, **Webhook de push** mostra a URL para copiar e um botão por provedor ligado (exceto Outro). O segredo aparece no modal e fica visível até você fechar. **Sincronização agendada** gera o token do cron do mesmo jeito: copie na hora, porque ele não volta para a tela.

## Seção Ambientes

A seção define os ambientes (desenvolvimento, homologação, produção ou outros nomes) e como uma branch do CI cai em cada um.

A lista mostra cor, nome, identificador, branches e o selo **Produção** quando for o caso. **Adicionar ambiente** e **Editar** abrem um modal. **Subir**, **Descer** e **Remover** gravam na hora. A spec enviada pelo CI vai para o ambiente cuja regra de branch casar primeiro, **de cima para baixo** (RN-90 e RN-91). Cada ambiente tem:

| Campo | O que faz |
|---|---|
| **Nome** | De 2 a 40 caracteres. É o que aparece nas telas. |
| **Identificador** | O slug do ambiente, usado em URLs e em `?environment=`. Letras minúsculas, números e hífen, começando por letra ou número, até 20 caracteres. |
| **Cor** | Distingue o ambiente em chips e no seletor. |
| **Branches** | Digite um padrão e clique em **+**. Ao menos uma regra. |
| **Branch de leitura** | A branch de onde o hub lê o arquivo de spec, quando a origem do serviço é "Arquivo no repositório". |
| **É produção** | Marca o ambiente de produção: ganha o selo Produção e é o que abre por padrão na página do serviço. |

As regras de branch aceitam três curingas: `*` casa um trecho sem barra (`release/*`), `**` casa qualquer coisa, inclusive barras (`feature/**`), e `?` casa um caractere. Exemplos: `main`, `release/*`, `feature/**`, `hotfix-*`. O prefixo `refs/heads/` é ignorado.

**Adicionar ambiente** cria outro (até 10 no total) e **Remover** tira um (sempre resta pelo menos um). Salvar, no modal ou na linha, responde "Ambientes salvos. Novas publicações do CI já usam as regras de branch."

::: warning Só dá para remover um ambiente vazio (RN-92)
Um ambiente que já tem specs publicadas ou variáveis não pode ser removido: o hub responde "Não dá para remover Homologação: já tem specs ou variáveis. Renomeie em vez de remover." O hub identifica o ambiente pelo **Identificador**. Para trocar o nome exibido, edite o **Nome**; mudar o **Identificador** de um ambiente que já tem dados é tratado como remover o antigo e criar um novo, e por isso é recusado.
:::

Veja [Ambientes por branch](/receitas/ambientes-por-branch) para um passo a passo.

## Seção Regras de acesso

A seção define o que acontece quando alguém entra pela primeira vez, e quanto tempo dura uma sessão. As duas decisões (liberar automaticamente e o que fazer com quem não comprova vínculo) ficam juntas. Os três prazos ficam na linha de baixo.

| Campo | O que faz |
|---|---|
| **Liberar automaticamente quem comprova vínculo com a empresa** | Ligado, quem comprova vínculo entra direto como VIEWER. Desligado, todo mundo passa pela aprovação (RN-04). |
| **Quem não comprova vínculo** | **Pode pedir acesso e aguardar aprovação** ou **Não pode entrar (convites e aprovações manuais continuam valendo)** (RN-05). |
| **Sessão (horas)** | Tempo até pedir login de novo. De 1 a 72. O padrão é 8. |
| **Revalidar vínculo (horas)** | De quanto em quanto tempo o hub confere se a pessoa ainda pertence à empresa. De 1 a 72. O padrão é 12. |
| **Pedido expira (dias)** | Pedidos de acesso não decididos somem depois disso. De 1 a 90. O padrão é 14. |

Clique em **Salvar regras**. A resposta é "Regras salvas. A duração de sessão vale para os próximos logins."

- **A duração da sessão vale para os próximos logins (RN-78).** Sessões já abertas mantêm a validade original.
- **Revalidação (RN-10).** Só o GitHub permite reconsultar o vínculo sem novo login; nos demais provedores, a conferência acontece no próximo login.
- **Pedidos (RN-11).** Um pedido expirado não bloqueia ninguém: basta entrar de novo para abrir outro.

## Seção Sessões e recuperação

Reúne ações de segurança que valem para o hub inteiro.

### Recuperação de OWNER em aberto

Se alguém abriu uma janela de recuperação pela linha de comando e ela ainda não foi usada nem expirou, aparece no topo o aviso **Recuperação de OWNER em aberto**. Ele diz quem será OWNER no primeiro login e até quando. Se você não abriu essa janela pelo servidor, clique em **Cancelar janela de recuperação** ("Janela de recuperação cancelada.") e revise quem tem acesso de linha de comando ao servidor. Veja [Recuperação de OWNER](/admin/recuperacao-de-owner).

### Sessões

Dois blocos:

- **Conferir vínculos.** Marca todas as pessoas ativas para conferir o vínculo no próximo acesso, sem que ninguém precise sair. O botão é **Conferir vínculos de todos**. A resposta é "Vínculos serão conferidos no próximo acesso de cada pessoa."
- **Encerrar sessões.** Use depois de um incidente ou de uma troca de credenciais. **Encerrar todas as sessões** abre um modal. Para confirmar, digite `ENCERRAR` e clique de novo em **Encerrar todas as sessões**. Todo mundo, menos você, precisa entrar de novo. A resposta é "Sessões encerradas para 42 pessoas. Cada uma vai precisar entrar de novo." Sem o texto certo, aparece "Digite ENCERRAR para confirmar." (RN-77).

### Se todos os OWNERs perderem acesso

Uma nota no fim lembra o comando de recuperação, `pnpm admin:recover --login usuario-ou-email`, que roda no servidor. Com login por e-mail e senha, `--reset-password` gera também um link de nova senha.

## Regras importantes

- **Só quem tem a permissão (RN-74).** O identificador da empresa não muda depois da instalação.
- **Mudar organizações ou domínios (RN-75).** Força a revalidação do vínculo de todos no próximo acesso.
- **Credenciais verificadas (RN-64 e RN-76).** GitHub e OIDC são testados antes de salvar; os outros provedores são salvos como informados. Tudo fica cifrado.
- **Encerrar sessões (RN-77).** Exige digitar `ENCERRAR` e mantém só a sua sessão.
- **Duração de sessão (RN-78).** Vale para os próximos logins.
- **Ambientes (RN-90 a RN-92).** Regras de branch ordenadas; remover só sem specs nem variáveis.
- **Auditoria.** Cada seção registra o próprio evento ("Organização atualizada", "Formas de login atualizadas", "Ambientes atualizados" e assim por diante) na [Auditoria](/admin/auditoria).

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Provedores de login](/instalacao/provedores-de-login): como criar o aplicativo em cada provedor.
- [Ambientes por branch](/receitas/ambientes-por-branch): configure ambientes e regras de branch.
- [Pessoas e acesso](/admin/pessoas-e-acesso): decida os pedidos que as regras de acesso geram.
- [Recuperação de OWNER](/admin/recuperacao-de-owner): o que fazer se a administração for perdida.
