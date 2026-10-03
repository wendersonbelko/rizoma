---
description: "Como configurar cada forma de login do Rizoma (GitHub, Google, Microsoft, GitLab, Facebook, OIDC e e-mail e senha): passo a passo no provedor, URL de callback, campos do hub, prova de vínculo e pegadinhas."
---

# Provedores de login

Esta página ensina a criar o aplicativo em cada provedor de login e a preencher os campos no hub. Ela serve a quem instala ou administra o hub. Você pode ativar **vários provedores ao mesmo tempo** e trocar a escolha depois em **Configurações → Formas de login**.

## Visão geral

| Provedor | O que comprova o vínculo com a empresa | Campos no hub | ID na callback |
|---|---|---|---|
| **GitHub** | Ser membro ativo de uma organização aceita | Client ID, Client secret | `github` |
| **Google** | E-mail verificado de um domínio aceito | Client ID, Client secret | `google` |
| **Microsoft (Entra ID)** | Conta do tenant informado, ou e-mail de um domínio aceito | Client ID, Client secret, Tenant | `microsoft-entra-id` |
| **GitLab** (e GitLab próprio) | E-mail de um domínio aceito | Client ID, Client secret, URL do GitLab (opcional) | `gitlab` |
| **Facebook** | **Nunca** comprova. Todo acesso passa por aprovação | App ID, App secret | `facebook` |
| **OIDC** (Keycloak, Okta, Auth0) | E-mail verificado de um domínio aceito | Nome do botão, Emissor, Client ID, Client secret | `oidc` |
| **E-mail e senha** | **Nunca** comprova. Entra por convite ou aprovação | Permitir cadastro (opcional) | (não usa callback) |

## Antes de começar

### A URL de callback

Todo provedor OAuth pede uma **URL de retorno** (callback). Ela é sempre:

```text
<AUTH_URL>/api/auth/callback/<id>
```

Por exemplo, para o GitHub, com `AUTH_URL="https://apihub.suaempresa.com"`:

```text
https://apihub.suaempresa.com/api/auth/callback/github
```

O hub mostra a URL pronta dentro de cada forma de login (no assistente e em **Configurações → Formas de login**), montada a partir do `AUTH_URL`. Se a URL mostrada estiver errada, corrija o `AUTH_URL` no `.env` antes de cadastrar o aplicativo no provedor. O endereço precisa ser idêntico, inclusive `https://` e a ausência de barra no final.

### Como o vínculo é comprovado

O **vínculo** decide se a pessoa entra direto (com liberação automática) ou precisa de aprovação. As listas usadas vêm da etapa **Organização** do [assistente](/instalacao/assistente):

- **GitHub:** o hub consulta a API de organizações e exige que a pessoa seja membro **ativo** de alguma das **Organizações do GitHub aceitas**. Só o GitHub permite reconferir o vínculo a cada N horas sem novo login.
- **Google e OIDC:** o e-mail precisa estar **verificado** e ter um dos **Domínios de e-mail da empresa**.
- **GitLab:** o e-mail devolvido pelo GitLab precisa ter um dos domínios aceitos.
- **Microsoft:** o `tid` da conta precisa ser igual ao **Tenant** configurado, **ou** o e-mail precisa ter um domínio aceito.
- **Facebook e e-mail e senha:** nunca comprovam. Com a política "pode pedir acesso", a pessoa vira pendente. Com "não pode entrar", só entra por convite ou aprovação manual.

Subdomínios contam: `time.acme.com` casa com `acme.com`. Sem nenhuma organização ou domínio informado para o provedor, **todas as pessoas caem em "pedir acesso"** (o assistente mostra um aviso). Veja [Acesso automático para a empresa](/receitas/acesso-automatico-pela-organizacao).

### Regras gerais

- **Client secrets ficam cifrados** no banco com a `ENCRYPTION_KEY`. Nunca voltam para a tela: em provedores já salvos, deixe o campo em branco para manter o secret atual.
- **Uma pessoa, um provedor.** O hub não junta contas de provedores diferentes automaticamente. Quem já entrou com o GitHub e tenta entrar com o Google usando o mesmo e-mail recebe "Esse e-mail já entra por outra forma de login. Use a mesma de antes.". A pessoa deve usar sempre a mesma forma.
- **Remover um provedor** da lista apaga a configuração dele. Quem só entrava por ele deixa de conseguir entrar até você ativá-lo de novo.
- Pelo menos **uma** forma de login precisa ficar ativa.

## GitHub

O login por GitHub usa um **OAuth App**. Só o GitHub.com é suportado para o login.

### 1. Crie o OAuth App na organização

Prefira criar o aplicativo **na organização**, e não na sua conta pessoal, para que ele não dependa de uma pessoa:

1. No GitHub, abra a organização e vá em **Settings**, depois **Developer settings**, depois **OAuth Apps**.
2. Clique em **New OAuth App**.
3. Preencha:
   - **Application name:** `Rizoma`.
   - **Homepage URL:** `https://apihub.suaempresa.com`.
   - **Authorization callback URL:** `https://apihub.suaempresa.com/api/auth/callback/github`.
4. Clique em **Register application**.
5. Em **Client secrets**, clique em **Generate a new client secret** e copie o valor. Ele só aparece uma vez.

### 2. Preencha no hub

- **Client ID** e **Client secret**, copiados do passo anterior.
- Na etapa **Organização**, informe as **Organizações do GitHub aceitas** (por exemplo, `acme`).

O hub testa as credenciais contra a API do GitHub ao salvar e recusa com "GitHub recusou esse Client ID / Client secret." se estiverem erradas.

![Etapa de login com GitHub no assistente](/prints/02-instalacao-github.png)

*Exemplo da etapa de login com GitHub, de uma versão anterior. Hoje a tela lista todas as formas de login.*

### Escopos e pegadinhas

- O hub pede só `read:user`, `user:email` e `read:org`: perfil, e-mail e leitura das organizações. Não há acesso ao código.
- **Restrição de OAuth Apps na organização.** Se a organização usa "OAuth App access restrictions", **um owner da organização precisa aprovar** o aplicativo (nas configurações de acesso de aplicativos de terceiros da organização). Sem isso, a checagem de vínculo sempre falha e todas as pessoas caem em "pedir acesso". O caminho exato no GitHub muda de tempos em tempos.
- Na tela de autorização do GitHub, a pessoa pode precisar conceder ao aplicativo o acesso à organização.
- A pessoa é identificada pelo **usuário do GitHub**, então o e-mail privado não atrapalha.
- Se o token do GitHub de uma pessoa deixa de valer, na próxima revalidação o hub pede que ela entre de novo ("Precisamos confirmar seu vínculo com a empresa. Entre de novo.").

## Google

### 1. Crie a credencial no Google Cloud

1. No **Google Cloud Console**, escolha (ou crie) um projeto.
2. Configure a **Tela de consentimento OAuth**. Com Google Workspace, escolha o tipo **Interno**, que limita o login a contas da sua organização. Sem Workspace, será **Externo**.
3. Vá em **APIs e serviços**, depois **Credenciais**, depois **Criar credenciais**, depois **ID do cliente OAuth**.
4. Em **Tipo de aplicativo**, escolha **Aplicativo da Web**.
5. Em **URIs de redirecionamento autorizados**, adicione `https://apihub.suaempresa.com/api/auth/callback/google`.
6. Salve e copie o **ID do cliente** e a **Chave secreta do cliente**.

### 2. Preencha no hub

- **Client ID:** precisa **terminar em `.apps.googleusercontent.com`**. O hub recusa qualquer outro formato.
- **Client secret:** a chave secreta.
- Na etapa **Organização**, informe os **Domínios de e-mail da empresa**.

### Pegadinhas

- O vínculo exige o e-mail **verificado** e de um domínio aceito. Contas pessoais `@gmail.com` não contam, a menos que você liste `gmail.com` (não faça isso).
- Um app **Externo** em modo de teste só aceita as pessoas cadastradas como usuárias de teste. Para abrir para toda a empresa, publique o app.

## Microsoft (Entra ID)

### 1. Registre o aplicativo

1. No centro de administração do **Microsoft Entra**, vá em **Identidade**, depois **Aplicativos**, depois **Registros de aplicativo**, e clique em **Novo registro**.
2. Em **Tipos de conta com suporte**, escolha **Somente contas neste diretório organizacional** (locatário único).
3. Em **URI de redirecionamento**, escolha a plataforma **Web** e informe `https://apihub.suaempresa.com/api/auth/callback/microsoft-entra-id`.
4. Clique em **Registrar**.
5. Na **Visão geral**, copie o **ID do aplicativo (cliente)** e o **ID do diretório (locatário)**.
6. Em **Certificados e segredos**, clique em **Novo segredo do cliente** e copie a coluna **Valor**, e não o "ID do segredo". O valor só aparece uma vez.

### 2. Preencha no hub

- **Client ID:** o ID do aplicativo (cliente).
- **Client secret:** o **Valor** do segredo.
- **Tenant (ID do diretório):** o GUID do diretório ou o domínio do tenant. Com o tenant, só contas do seu diretório contam como da empresa.

### Pegadinhas

- Preencha sempre o **Tenant**. Sem ele, o hub usa o endpoint comum da Microsoft (`common`), que só funciona com aplicativos que aceitam várias organizações, e o vínculo passa a depender só dos domínios de e-mail.
- O segredo do cliente **expira** (no máximo em 24 meses). Anote a data e renove antes, em **Configurações → Formas de login**.
- As permissões padrão do registro (`User.Read`) bastam.

## GitLab e GitLab próprio

### 1. Crie o aplicativo

1. No GitLab, crie o aplicativo em **Preferences**, depois **Applications** (conta pessoal), ou, melhor, no grupo da empresa, em **Settings**, depois **Applications**.
2. Informe um **Name** e, em **Redirect URI**, `https://apihub.suaempresa.com/api/auth/callback/gitlab`.
3. Marque **Confidential** e o escopo **`read_user`**. (A ajuda da tela do hub também cita `openid`, que pode ficar marcado.)
4. Salve e copie o **Application ID** e o **Secret**.

### 2. Preencha no hub

- **Client ID** e **Client secret**.
- **URL do GitLab (opcional):** só para GitLab próprio, por exemplo `https://gitlab.suaempresa.com`. Em branco, vale o `gitlab.com`. Use `https://` (ou `http://localhost` em testes).
- Na etapa **Organização**, informe os **Domínios de e-mail da empresa**.

### Pegadinhas

- O servidor do hub precisa alcançar o seu GitLab (ele chama `/oauth/token` e `/api/v4/user`).
- Se o seu GitLab usa um certificado de uma autoridade interna, o Node do hub precisa confiar nela (variável `NODE_EXTRA_CA_CERTS` do Node, com o arquivo da autoridade montado no container).

## Facebook

O Facebook **nunca comprova vínculo**. Use-o só se a sua empresa não tem provedor corporativo e você aceita aprovar cada pessoa.

1. Em **Meta for Developers**, vá em **Meus apps** e **Criar app**, com o caso de uso de login com o Facebook.
2. Adicione o produto **Login do Facebook** e, em **Configurações**, adicione `https://apihub.suaempresa.com/api/auth/callback/facebook` em **URIs de redirecionamento OAuth válidos**.
3. Em **Configurações**, depois **Básico**, copie o **ID do app** e a **Chave secreta do app**.

No hub:

- **App ID:** precisa ser **numérico**.
- **App secret:** a chave secreta.

Enquanto o app está em modo de desenvolvimento, só quem tem função no app consegue entrar. Para as demais pessoas, ele precisa estar no modo "Live", e a Meta pode exigir uma URL de política de privacidade e outras informações para isso.

## OIDC (Keycloak, Okta, Auth0)

O provedor **OIDC** serve para qualquer provedor OpenID Connect. Só existe **um** OIDC por instalação.

### Campos no hub

| Campo | O que colocar |
|---|---|
| **Nome do botão** | O texto do botão de login, por exemplo `Keycloak` (até 40 caracteres). O botão vira "Entrar com Keycloak" |
| **Emissor (issuer)** | A URL do emissor, começando com `https://`. Precisa publicar `/.well-known/openid-configuration` |
| **Client ID** e **Client secret** | As credenciais do cliente que você criou |

A callback é `https://apihub.suaempresa.com/api/auth/callback/oidc`. O hub pede os escopos `openid email profile` e, ao salvar, consulta o `/.well-known/openid-configuration` do emissor. Se ele não responder, você vê "O emissor OIDC respondeu ... em /.well-known/openid-configuration." ou "Não consegui acessar o emissor OIDC. Confira a URL.".

::: tip Digite o emissor exatamente como o provedor o publica
Abra `<emissor>/.well-known/openid-configuration` no navegador e copie o valor do campo `issuer`, com ou sem barra final. Um emissor digitado diferente do publicado faz o login falhar.
:::

Para o vínculo, o provedor precisa devolver os campos **`email`** e **`email_verified: true`**, e o domínio do e-mail precisa estar entre os **Domínios de e-mail da empresa**.

### Exemplo: Keycloak

1. No realm (por exemplo, `main`), vá em **Clients** e **Create client**.
2. **Client type:** `OpenID Connect`. **Client ID:** `api-hub`.
3. Ative **Client authentication** e deixe só **Standard flow** marcado.
4. Em **Valid redirect URIs**, informe `https://apihub.suaempresa.com/api/auth/callback/oidc`. Em **Web origins**, `https://apihub.suaempresa.com`.
5. Na aba **Credentials**, copie o **Client secret**.
6. No hub: **Emissor** `https://sso.suaempresa.com/realms/main`, **Nome do botão** `Keycloak`.

As pessoas precisam ter o e-mail marcado como verificado no Keycloak. O passo a passo completo está em [Login com Keycloak (OIDC)](/receitas/login-com-keycloak).

### Exemplo: Okta

1. Em **Applications**, clique em **Create App Integration**, escolha **OIDC - OpenID Connect** e **Web Application**.
2. Em **Sign-in redirect URIs**, informe a callback do `oidc`.
3. Em **Assignments**, atribua o aplicativo aos grupos que devem entrar.
4. Copie o **Client ID** e o **Client secret**.
5. **Emissor:** `https://suaempresa.okta.com` (servidor de autorização da organização) ou `https://suaempresa.okta.com/oauth2/default` (servidor "default"). Use o que você abrir no `/.well-known/openid-configuration`.

### Exemplo: Auth0

1. Em **Applications**, clique em **Create Application** e escolha **Regular Web Applications**.
2. Em **Settings**, informe a callback em **Allowed Callback URLs**.
3. Copie **Client ID** e **Client Secret**.
4. **Emissor:** `https://SEU-TENANT.us.auth0.com/`. O Auth0 publica o emissor **com barra no final**. Confirme no `.well-known`.

## E-mail e senha

Não exige nenhum aplicativo externo. É o caminho mais simples para avaliar o hub, para consultorias sem conta corporativa e como reserva se o provedor principal sair do ar.

**Campo no hub:** "Permitir que pessoas criem conta e peçam acesso (sempre com aprovação). Desmarcado, só entra quem recebe convite."

Como as pessoas entram:

- **Convite.** Em **Pessoas e acesso**, **Convidar usuário** gera um link de uso único, válido por 7 dias. Com SMTP salvo, o hub envia o link e ainda o mostra para copiar. Sem SMTP, copie o link e mande pelo canal da empresa. A pessoa define a senha e já entra ativa, com o papel do convite.
- **Cadastro aberto** (se você marcou a opção e a política permite pedir acesso). A pessoa cria a conta em `/signup` e cria um pedido de acesso pendente, com justificativa. Um administrador decide.
- **Nova senha.** Em **Pessoas e acesso**, o botão **Link de nova senha** gera um link válido por 1 hora, de uso único. Ao usá-lo, as sessões da pessoa são encerradas. Não há "esqueci minha senha" automático.

Regras da senha e do bloqueio:

- Mínimo de 12 caracteres, com pelo menos três tipos (minúsculas, maiúsculas, números, símbolos), sem sequências comuns e sem a parte inicial do e-mail.
- Depois de 5 tentativas erradas seguidas, a conta fica bloqueada por 15 minutos.
- As senhas são guardadas com scrypt, com sal por pessoa.

O e-mail e senha **nunca comprova vínculo**: quem se cadastra sozinho sempre passa por aprovação. Veja [Convidar por e-mail](/receitas/convidar-por-email).

## Trocar ou adicionar provedores depois

1. Abra **Configurações → Formas de login** (permissão `settings:manage`).
2. Clique em **Ligar** no provedor, preencha os campos e copie a callback para o cadastro no provedor.
3. Clique em **Salvar**.

Para trocar o Client secret de um provedor (por exemplo, quando ele expira), abra a mesma tela, cole o novo valor no campo do secret e salve. O campo em branco mantém o anterior. O GitHub e o OIDC são testados antes de salvar.

## Como saber que deu certo

1. Saia do hub e abra a tela de login. O botão do provedor deve aparecer ("Entrar com GitHub", por exemplo).
2. Entre com uma conta de teste **da empresa**. Com liberação automática, você deve cair no catálogo como VIEWER.
3. Entre com uma conta de teste **de fora**. Você deve ver a tela "Pedido de acesso enviado".
4. Em **Auditoria**, no grupo **Login e saída**, abra um login: o campo `affiliation` mostra `member` quando o vínculo foi comprovado e `not_member` quando não foi.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Erro de URL de retorno (`redirect_uri_mismatch` ou parecido) | A callback cadastrada no provedor difere da URL do hub | Copie a URL mostrada no hub. Confira `AUTH_URL`, `https://` e a ausência de barra no final |
| Todo mundo cai em "pedir acesso" | Não há organização ou domínio aceito, ou o e-mail não vem verificado | Preencha a etapa **Organização** e confira os avisos em **Configurações → Formas de login** |
| No GitHub, ninguém comprova vínculo | A organização restringe OAuth Apps | Peça a um owner da organização que aprove o aplicativo |
| "Sua conta não comprova vínculo com a empresa..." | A política é "não pode entrar" e a pessoa não comprova vínculo | Convide a pessoa por e-mail, aprove manualmente ou ajuste a política |
| "Esse e-mail já entra por outra forma de login." | A pessoa usou um provedor diferente do primeiro | Entrar com o provedor usado da primeira vez |
| O Client ID do Google é recusado | Não termina em `.apps.googleusercontent.com` | Copie o ID do cliente OAuth do tipo "Aplicativo da Web" |
| O App ID do Facebook é recusado | Não é numérico | Copie o **ID do app**, e não o nome |
| A Microsoft para de funcionar meses depois | O segredo do cliente expirou | Gere outro segredo e atualize em **Configurações → Formas de login** |
| O login falha em todos os provedores depois de trocar a `ENCRYPTION_KEY` | Os secrets salvos não podem mais ser decifrados | Restaure a chave original. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente) |

## Próximos passos

- [Assistente de instalação](/instalacao/assistente): escolha as formas de login na etapa 3.
- [Acesso automático para a empresa](/receitas/acesso-automatico-pela-organizacao): faça a equipe entrar sem pedir acesso.
- [Pessoas e acesso](/admin/pessoas-e-acesso): aprove pedidos e gerencie convites.
- [Autenticação e acesso](/arquitetura/autenticacao-e-acesso): como o login funciona por dentro.
