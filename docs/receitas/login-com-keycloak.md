---
description: Configure o login OIDC com Keycloak passo a passo (realm, client, redirect URI, issuer, e-mail verificado e domínio), com notas para Okta e Auth0.
---

# Login com Keycloak (OIDC)

Se a sua empresa já tem um provedor de identidade, as pessoas podem entrar no hub com a conta corporativa, sem criar outra senha. Esta receita configura o login **OIDC** com o **Keycloak**: cria o client no Keycloak, cadastra o emissor no hub e faz o e-mail da pessoa contar como vínculo com a empresa. No fim há notas para **Okta** e **Auth0**, que seguem o mesmo caminho. É para quem administra o hub e tem acesso ao console do provedor.

## Antes de começar

- Você tem acesso administrativo a um **realm** do Keycloak e enxerga **Configurações** no hub (`settings:manage`, por padrão só o OWNER).
- O `AUTH_URL` do hub é o endereço público (`https://apihub.suaempresa.com`). A URL de retorno do login é montada com ele. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).
- O **servidor do hub** (e não o seu navegador) consegue abrir a URL do Keycloak. Ao salvar, o hub consulta o emissor na hora.
- O Keycloak usa HTTPS. O hub só aceita emissor `https://` (ou `http://localhost`, para testes).
- As pessoas têm **e-mail cadastrado e verificado** no Keycloak. É essa verificação, junto com o domínio, que comprova o vínculo.
- Você sabe os domínios de e-mail da empresa (por exemplo, `suaempresa.com`).

## Passo a passo

### 1. Anote os valores que vão se repetir

| Valor | Exemplo |
|---|---|
| URL do hub (`AUTH_URL`) | `https://apihub.suaempresa.com` |
| URL de retorno (redirect URI) | `https://apihub.suaempresa.com/api/auth/callback/oidc` |
| Emissor (issuer) | `https://keycloak.suaempresa.com/realms/<realm>` |

A URL de retorno é sempre `<AUTH_URL>/api/auth/callback/oidc`. O hub também a mostra, pronta para copiar, no cartão do OIDC em **Configurações → Formas de login**.

### 2. Crie o client no Keycloak

No console de administração, escolha o realm e abra **Clients → Create client**. Os rótulos abaixo são os das versões recentes; em versões antigas eles mudam um pouco.

1. **General settings:** **Client type** = **OpenID Connect**; **Client ID** = `api-hub`. Avance.
2. **Capability config:** ligue **Client authentication** (isso faz o client ser *confidential*, com secret) e deixe marcado **Standard flow**. **Direct access grants** pode ficar desligado. Avance.
3. **Login settings:** em **Valid redirect URIs**, informe a URL de retorno do passo 1, exatamente como está. Em **Root URL** e **Web origins**, pode usar a URL do hub. Salve.

### 3. Copie o client secret

No client `api-hub`, abra a aba **Credentials** e copie o **Client secret**. Você vai colar no hub no passo 5.

### 4. Descubra o issuer e confira

O emissor do Keycloak é `https://keycloak.suaempresa.com/realms/<realm>`. Em versões anteriores à 17, o caminho tem `/auth`: `https://keycloak.suaempresa.com/auth/realms/<realm>`. Confira:

```bash
curl -s https://keycloak.suaempresa.com/realms/<realm>/.well-known/openid-configuration
```

A resposta é um JSON. Copie o valor do campo `issuer` **exatamente como veio**. Se o emissor cadastrado no hub for diferente do que o provedor anuncia, o login falha.

### 5. Cadastre o OIDC no hub

1. Abra **Configurações** e a seção **Formas de login**.
2. Em **OIDC (Keycloak, Okta, Auth0…)**, clique em **Ligar**.
3. Preencha:

| Campo | O que colocar |
|---|---|
| **Nome do botão** | O texto do botão de login, por exemplo `Keycloak` (até 40 caracteres). |
| **Emissor (issuer)** | O valor do passo 4. |
| **Client ID** | `api-hub` |
| **Client secret** | O secret do passo 3. Fica cifrado no banco. |

4. Clique em **Salvar**.

O hub consulta `<emissor>/.well-known/openid-configuration` (com limite de 8 segundos) antes de salvar. Se responder, a tela confirma "Formas de login salvas. Valem a partir do próximo login."

O hub pede os escopos `openid email profile`.

### 6. Diga quais domínios comprovam vínculo

Abra a aba **Organização**, preencha **Domínios de e-mail da empresa** (por exemplo, `suaempresa.com`) e clique em **Salvar organização**. Subdomínios contam. No OIDC, o vínculo exige as duas coisas: e-mail **verificado** e domínio da lista (RN-02).

Sem domínio cadastrado, o login funciona, mas ninguém comprova vínculo: todo mundo cai em "pedir acesso". Um aviso no alto da aba lembra: "OIDC sem domínio de e-mail aceito: todos pedem acesso."

### 7. Garanta o e-mail verificado no Keycloak

O hub lê os campos `email` e `email_verified` do token. No Keycloak:

- Nos usuários, ligue **Email verified**. Para exigir a verificação de todo mundo, use **Realm settings → Login → Verify email**.
- Mantenha os client scopes `email` e `profile` como **Default** no client. Eles entregam o e-mail e a verificação.

### 8. Ligue a liberação automática

Em **Configurações → Regras de acesso**, marque **Liberar automaticamente quem comprova vínculo com a empresa**. Quem tem e-mail verificado do domínio entra direto, como VIEWER. Veja [Acesso automático para a empresa](/receitas/acesso-automatico-pela-organizacao).

### 9. Teste

Numa janela anônima, abra o hub. A tela de login deve mostrar **Entrar com Keycloak**. Clique, autentique-se no Keycloak e confira que você volta ao hub já dentro do catálogo (ou na tela do tour guiado, no primeiro acesso).

::: info Sair do hub não encerra a sessão no Keycloak
**Sair** encerra a sessão do hub. Enquanto a sessão do Keycloak estiver aberta no navegador, entrar de novo é imediato.
:::

## Notas para Okta e Auth0

O hub só precisa de um provedor OpenID Connect com `/.well-known/openid-configuration`. Os campos do hub são os mesmos do passo 5.

| | Okta | Auth0 |
|---|---|---|
| Onde criar | **Applications → Create App Integration** → **OIDC - OpenID Connect** → **Web Application** | **Applications → Create Application** → **Regular Web Applications** |
| URL de retorno | **Sign-in redirect URIs** | **Allowed Callback URLs** |
| Emissor | `https://suaempresa.okta.com` (servidor da organização) ou `https://suaempresa.okta.com/oauth2/default` (servidor "default") | `https://SEU-DOMINIO.auth0.com/`, **com a barra final** |
| Client ID e secret | Na página da aplicação | Aba **Settings** da aplicação |
| Atenção | Atribua a aplicação às pessoas ou grupos (**Assignments**) | Usuários precisam ter o e-mail verificado |

Nos dois, copie o `issuer` do documento `.well-known/openid-configuration` para o campo **Emissor (issuer)**, sem digitar de cabeça.

## Como saber que deu certo

- **Entrar com Keycloak** (ou o nome que você escolheu) aparece na tela de login.
- Uma pessoa com e-mail verificado do domínio entra direto e aparece em **Pessoas e acesso**, na tabela **Pessoas**, como **ativo**, origem **da empresa**, papel **VIEWER**.
- Em **Auditoria**, o tipo **Configurações** registra "Formas de login atualizadas", e o tipo **Login e saída** registra o primeiro login.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| "O emissor OIDC respondeu 404 em /.well-known/openid-configuration." | O caminho do emissor está errado: falta `/realms/<realm>` ou, em Keycloak antigo, o `/auth`. |
| "Não consegui acessar o emissor OIDC. Confira a URL." | O servidor do hub não alcança o Keycloak (DNS, firewall ou certificado) ou a URL está com erro de digitação. |
| "OIDC (Keycloak, Okta, Auth0…): informe a URL HTTPS do emissor." | O emissor está vazio ou começa com `http://`. |
| "…informe o nome do botão (ex.: Keycloak)." | O campo **Nome do botão** ficou em branco. |
| `Invalid parameter: redirect_uri` no Keycloak | A URL de retorno do client não é idêntica a `<AUTH_URL>/api/auth/callback/oidc`. Confira protocolo, domínio e caminho. |
| "Não foi possível entrar." ao voltar do Keycloak | Costuma ser o **Client authentication** desligado (o client não tem secret), o secret errado ou o emissor diferente do anunciado. Confira os passos 3, 4 e 5. |
| A pessoa entra, mas cai em "Pedido de acesso enviado" | O e-mail não está verificado, o domínio não está em **Domínios de e-mail da empresa**, ou o client não entrega `email` e `email_verified`. |
| "Esse e-mail já entra por outra forma de login. Use a mesma de antes." | A pessoa já usou outra forma de login (por exemplo, GitHub) com o mesmo e-mail. O hub não junta contas: ela continua entrando pela forma original. |
| "Você ficaria sem forma de entrar." ao salvar | Ao desligar uma forma de login, mantenha uma que você mesmo usa. |

## Veja também

- [Provedores de login](/instalacao/provedores-de-login): GitHub, Google, Microsoft, GitLab e Facebook.
- [Acesso automático para a empresa](/receitas/acesso-automatico-pela-organizacao): liberar direto quem comprova vínculo.
- [Autenticação e acesso](/arquitetura/autenticacao-e-acesso): como o vínculo é decidido por dentro.
- [Solução de problemas](/referencia/solucao-de-problemas): erros de login mais comuns.
