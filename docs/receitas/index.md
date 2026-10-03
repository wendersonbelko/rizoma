---
description: Todas as receitas passo a passo do Rizoma, organizadas por objetivo e por quem você é na empresa.
---

# Todos os cenários

Cada receita leva um objetivo concreto do começo ao fim: o que você precisa ter antes, os passos na tela (ou no terminal), como conferir que deu certo e o que fazer quando algo não sai como esperado. Procure a sua pelo que você quer fazer ou pelo seu papel na empresa.

## Como as receitas são organizadas

Todas seguem a mesma estrutura, para você saber onde olhar:

| Seção | O que tem |
|---|---|
| **Antes de começar** | Pré-requisitos e as permissões necessárias. |
| **Passo a passo** | Os passos numerados, com os nomes de menus, abas e botões exatamente como aparecem na tela. |
| **Como saber que deu certo** | Um jeito de conferir o resultado. |
| **Problemas comuns** | Mensagens de erro e situações que costumam travar o cenário. |
| **Veja também** | Onde aprofundar. |

::: tip Primeira vez no hub?
Comece por [Do zero ao primeiro serviço](/receitas/primeiro-servico). Ela leva um hub recém-instalado até uma documentação publicada. Se você só quer olhar antes de instalar de verdade, veja [Hub com dados de demonstração](/receitas/dados-de-demonstracao).
:::

## Sou do time de plataforma e quero…

Quem monta e mantém o hub para os outros times.

- [Configurar os ambientes por branch](/receitas/ambientes-por-branch): definir dev, homologação e produção (ou outros nomes) e dizer quais branches caem em cada um.
- [Deixar a empresa entrar sem esperar aprovação](/receitas/acesso-automatico-pela-organizacao): liberar direto quem é da organização do GitHub ou de um domínio de e-mail.
- [Ligar o login corporativo com Keycloak](/receitas/login-com-keycloak): configurar OIDC, com notas para Okta e Auth0.
- [Publicar specs pelo GitHub Actions](/receitas/publicar-pelo-github-actions), [pelo GitLab CI](/receitas/publicar-pelo-gitlab-ci) ou [por outros CIs](/receitas/publicar-por-outros-ci): padronizar a publicação no pipeline.
- [Tirar o /docs público do ar](/receitas/tirar-docs-do-ar): fechar a exposição do Swagger de cada serviço, já que o hub passa a ser a vitrine.
- [Ler a spec do repositório](/receitas/spec-do-repositorio) ou [de uma URL](/receitas/spec-por-url): quando o pipeline não pode (ou não deve) enviar a spec.

## Sou dev e quero…

Quem mantém serviços e precisa da documentação certa, no ambiente certo.

- [Cadastrar meu primeiro serviço](/receitas/primeiro-servico): do time ao token, da primeira spec ao catálogo.
- [Publicar a spec a cada deploy](/receitas/publicar-pelo-github-actions): um passo no pipeline e o contrato do ambiente se atualiza sozinho.
- [Importar a spec manualmente](/receitas/importar-spec-manualmente): enviar um JSON ou YAML pela tela, sem CI.
- [Mapear as dependências do meu serviço](/receitas/mapear-dependencias): declarar quem consome quem, na spec ou no mapa.
- [hub.json do repositório](/receitas/hub-json): descrever tipo, canais e ligações na raiz do repositório.
- [Cadastrar uma integração externa](/receitas/integracao-externa): registrar a API de terceiro, a fila ou o banco que meu serviço usa, com o endereço de cada ambiente.
- [Guardar segredos e baixar o .env](/receitas/segredos-e-env): documentar as variáveis de cada ambiente, revelar segredos com auditoria e copiar de um ambiente para outro.
- [Entender em qual ambiente minha spec cai](/receitas/ambientes-por-branch): como a branch do pipeline vira dev, hml ou prod.

## Administro o acesso e quero…

Quem aprova pedidos, convida pessoas e define o que cada papel pode fazer.

- [Receber uma pessoa nova no time](/receitas/onboarding-de-pessoa-nova): acesso, papel, time, tour guiado e o que mostrar primeiro.
- [Dar acesso a uma consultoria por tempo limitado](/receitas/acesso-temporario-para-terceiros): aprovar com prazo, restringir o que a pessoa vê e revogar antes do fim.
- [Convidar alguém por e-mail e senha](/receitas/convidar-por-email): gerar o link de convite (enviado quando o SMTP está salvo) e redefinir senhas.
- [Liberar direto quem é da empresa](/receitas/acesso-automatico-pela-organizacao): vínculo pela organização do GitHub ou pelo domínio de e-mail.
- [Ajustar o que cada papel pode fazer](/receitas/papel-personalizado): editar a matriz de permissões, por exemplo, um Leitor sem acesso às variáveis.
- [Ligar o login com Keycloak](/receitas/login-com-keycloak): quando a empresa já tem um provedor de identidade.

## Quero só avaliar…

- [Popular um hub de teste com dados de demonstração](/receitas/dados-de-demonstracao): serviços, times, pessoas, integrações, variáveis e pedidos de acesso de exemplo, para explorar todas as telas.
- [Do zero ao primeiro serviço](/receitas/primeiro-servico): o caminho completo com dados seus.

## Quero… → Receita

| Quero… | Receita | Quem costuma fazer |
|---|---|---|
| Cadastrar o primeiro serviço e ver a documentação no ar | [Do zero ao primeiro serviço](/receitas/primeiro-servico) | Mantenedor ou administrador |
| Publicar a spec a cada deploy no GitHub Actions | [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions) | Mantenedor do serviço |
| Publicar a spec a cada deploy no GitLab CI | [Publicar pelo GitLab CI](/receitas/publicar-pelo-gitlab-ci) | Mantenedor do serviço |
| Publicar a spec com Bitbucket, Azure DevOps, Jenkins, CircleCI ou `curl` | [Publicar por outros CIs](/receitas/publicar-por-outros-ci) | Mantenedor do serviço |
| Deixar o hub ler o arquivo OpenAPI do repositório | [Ler a spec do repositório](/receitas/spec-do-repositorio) | Mantenedor do serviço |
| Deixar o hub buscar a spec numa URL | [Ler a spec de uma URL](/receitas/spec-por-url) | Mantenedor do serviço |
| Enviar um JSON ou YAML pela tela | [Importar a spec manualmente](/receitas/importar-spec-manualmente) | Mantenedor do serviço |
| Fechar o `/docs` público dos serviços | [Tirar o /docs público do ar](/receitas/tirar-docs-do-ar) | Quem opera o serviço |
| Separar dev, homologação e produção por branch | [Ambientes por branch](/receitas/ambientes-por-branch) | Quem administra o hub |
| Registrar quem consome quem | [Mapear dependências](/receitas/mapear-dependencias) | Mantenedor do serviço |
| Levar as ligações no repositório | [hub.json](/receitas/hub-json) | Mantenedor do serviço |
| Registrar uma API de terceiro, fila ou banco | [Cadastrar uma integração externa](/receitas/integracao-externa) | Mantenedor ou administrador |
| Guardar segredos, baixar o `.env`, copiar entre ambientes | [Segredos, .env e cópia entre ambientes](/receitas/segredos-e-env) | Mantenedor do serviço |
| Liberar direto quem é da empresa | [Acesso automático para a empresa](/receitas/acesso-automatico-pela-organizacao) | Quem administra o hub |
| Dar acesso por tempo limitado a terceiros | [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros) | Quem aprova pedidos |
| Convidar alguém por e-mail e senha | [Convidar por e-mail](/receitas/convidar-por-email) | Quem administra pessoas |
| Entrar com o Keycloak da empresa | [Login com Keycloak (OIDC)](/receitas/login-com-keycloak) | Quem administra o hub |
| Criar um papel com menos (ou mais) permissões | [Papel com permissões sob medida](/receitas/papel-personalizado) | Quem edita permissões |
| Receber uma pessoa nova no time | [Onboarding de uma pessoa nova](/receitas/onboarding-de-pessoa-nova) | Líder do time ou administrador |
| Explorar o hub com dados de exemplo | [Hub com dados de demonstração](/receitas/dados-de-demonstracao) | Quem instalou o hub de teste |

## Não achou o seu cenário?

- Para entender o que o sistema faz antes de escolher uma receita, veja [Tudo o que o sistema faz](/guia/funcionalidades) e [Conceitos principais](/guia/conceitos).
- Se algo não funciona como o esperado, consulte [Solução de problemas](/referencia/solucao-de-problemas) e [Perguntas frequentes](/referencia/faq).
- Quer propor ou escrever uma receita nova? Veja [Esta documentação](/contribuindo/documentacao).
