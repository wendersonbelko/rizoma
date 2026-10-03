---
description: Onde encaixar um provedor de login novo no Rizoma — lista do core, montagem do Auth.js, vínculo com a empresa e a tela de configuração.
---

# Adicionar um provedor de login

Os provedores não estão fixos no código do servidor em tempo de execução: o assistente e **Configurações** gravam linhas em `AuthProvider`, e `buildProviders` (`apps/web/src/lib/auth-providers.ts`) monta o Auth.js a partir delas. Incluir um tipo novo é estender essa lista, não hardcodar um botão.

O caminho de um login já existente está em [Autenticação e acesso](/arquitetura/autenticacao-e-acesso).

## 1. O tipo no core

Em `packages/core/src/auth-providers.ts`:

- Acrescente o valor em `AUTH_PROVIDER_TYPES`. O mesmo valor precisa existir no enum do Prisma (`AuthProviderType` em `schema.prisma`): isso é uma [migração](/contribuindo/guias/migracao-de-banco).
- Dê o id do Auth.js em `AUTHJS_ID` (minúsculo, estável).
- Preencha `PROVIDER_META`: rótulo, a frase de como o vínculo é comprovado, os campos do formulário (`clientId`, `clientSecret`, `issuer`, `tenantId`, `label`, `allowSignup`) e o texto de ajuda.
- Estenda `providerInputSchema` se o provedor exigir formato próprio (o Google exige client ID terminado em `.apps.googleusercontent.com`, por exemplo).

`providerProvesAffiliation` devolve falso para Facebook e e-mail com senha (RN-96). Se o provedor novo também não comprova vínculo, inclua-o aí. Senão, implemente o critério em `affiliationFromProfile` (`packages/core/src/affiliation.ts`): domínio de e-mail, e-mail verificado, ou um identificador de diretório. GitHub não passa por essa função; a organização é consultada com o token.

## 2. Montar o provedor

No `switch` de `buildProviders`, instancie o provider do Auth.js com `clientId` e o secret decifrado (`decryptSecret` no `clientSecretEnc`). Peça o menor escopo que baste para perfil, e-mail e a prova de vínculo (RN-S02).

`TYPE_BY_AUTHJS_ID` é derivado de `AUTHJS_ID`. O callback `signIn` em `apps/web/src/auth.ts` usa esse mapa para achar o tipo e chamar `affiliationFor`. Se o provedor for como o GitHub (a prova não está no perfil), trate o caso ali, não dentro de `affiliationFromProfile`.

Client secret em branco na edição mantém o valor cifrado já salvo (RN-101). Não grave secret em claro.

## 3. Tela

O formulário de **Formas de login** lê `PROVIDER_META`. Campos novos precisam aparecer nesse formulário e no assistente, senão a pessoa não consegue informar o que o schema exige. A URL de callback continua sendo a que a tela mostra (`AUTH_URL` + caminho do Auth.js). Documente o provedor em [Provedores de login](/instalacao/provedores-de-login).

## 4. Testes

- No `core`: o schema recusa configuração incompleta e `affiliationFromProfile` cobre membro, não membro e e-mail não verificado.
- Na integração, se o fluxo de login dessa conta mudar a decisão de acesso: um caso com `TEST_DATABASE_URL`.

Não enfraqueça o bloqueio de quem está fora da empresa (RN-05) para "fazer o botão funcionar".

## Veja também

- [Provedores de login](/instalacao/provedores-de-login)
- [Login com Keycloak](/receitas/login-com-keycloak): o caminho OIDC, que já cobre vários emissores sem tipo novo.
- [Segurança](/referencia/seguranca)
