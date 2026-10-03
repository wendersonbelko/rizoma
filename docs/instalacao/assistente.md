---
description: As 10 etapas do assistente de instalação em detalhe, o que cada campo significa, o que é validado, o que dá para mudar depois e os cuidados de segurança durante a instalação.
---

# Assistente de instalação

O assistente é a tela `/setup`, que aparece na primeira vez que você abre o hub. Ele configura banco, login, e-mail, organização, repositórios, regras de acesso, ambientes e o primeiro administrador, sem editar o banco à mão. Esta página descreve cada uma das 10 etapas para quem está instalando.

## Antes de começar

- O hub precisa estar no ar: por [Docker](/instalacao/docker), pelo [desenvolvimento local](/instalacao/desenvolvimento-local) ou pelo [Início rápido](/guia/inicio-rapido).
- `ENCRYPTION_KEY`, `AUTH_SECRET` e `AUTH_URL` precisam estar preenchidos no `.env`. O assistente **não verifica** essas variáveis logo de início: se a `ENCRYPTION_KEY` estiver vazia ou inválida, o erro só aparece quando você salvar o primeiro segredo. Confira antes.
- Se você vai usar GitHub, Google, Microsoft, GitLab, Facebook ou OIDC, tenha os aplicativos criados (Client ID e Client secret em mãos). Veja [Provedores de login](/instalacao/provedores-de-login). Se preferir começar simples, o login por **E-mail e senha** não precisa de nada externo, e você pode trocar depois.
- Decida estes valores antes de abrir a tela:

| Decida | Exemplo |
|---|---|
| Nome da empresa e identificador curto | `Acme` e `acme` |
| Domínios de e-mail da empresa | `acme.com.br` |
| Organizações do GitHub (se usar GitHub) | `acme` |
| Nomes dos ambientes e suas branches | `dev`, `hml`, `prod` |
| Quem será o primeiro administrador (OWNER) | `fulano@suaempresa.com` |

::: danger Mantenha a URL privada até concluir
O assistente **não usa token de instalação**, porque o projeto é de código aberto. Quem consegue abrir a URL do hub antes de você concluir pode passar pelas etapas e se definir como administrador. Restrinja o acesso (firewall, VPN ou lista de IPs no proxy) até a etapa 9. Veja [Segurança durante a instalação](#segurança-durante-a-instalação).
:::

## Como o assistente funciona

- **Enquanto o hub não está instalado**, qualquer página leva para `/setup`.
- **As etapas são sequenciais.** Você pode voltar para corrigir uma etapa anterior, mas não pode pular para frente.
- **O progresso fica salvo no banco** assim que o banco está conectado. Fechar o navegador não perde nada, e ao voltar você continua da etapa em que parou.
- **A instalação só conclui** com organização, formas de login, ambientes e um administrador confirmados.
- **Depois de concluído, o assistente se tranca.** A página `/setup` redireciona para o hub e a API do assistente recusa qualquer escrita.
- Ao pé da tela há o **Registro da instalação**, uma lista das ações feitas pelo assistente, para conferência.

| # | Etapa | Você decide |
|---|---|---|
| 1 | Bem-vindo | Ler o que o assistente configura e o que ter em mãos |
| 2 | Banco de dados | Conferir o banco e as migrações |
| 3 | Formas de login | Como as pessoas entram |
| 4 | E-mail | SMTP opcional, pode ser pulado |
| 5 | Organização | Nome, título e o que conta como vínculo |
| 6 | Repositórios | De onde o hub pode ler specs |
| 7 | Regras de acesso | Quem entra direto e por quanto tempo |
| 8 | Ambientes | Estágios e branches |
| 9 | Primeiro administrador | Quem será o OWNER |
| 10 | Revisar e concluir | Confirmar |

## Passo a passo

### 1. Bem-vindo

A primeira etapa não pede campo nenhum. Ela explica o que o hub é, o que o assistente vai configurar (banco, entrada, empresa e o primeiro administrador) e o que ter em mãos: nome e identificador da empresa, domínios, credenciais de login se não for começar só com e-mail e senha, ambientes e quem será o OWNER.

Um aviso lembra que não há token de instalação: mantenha a URL fora do alcance de terceiros até existir um administrador. A etapa também diz que o progresso fica salvo e que dá para voltar, mas não pular para a frente. O crédito do projeto (Belko) fica no rodapé. Clique em **Continuar**.

### 2. Banco de dados

Esta etapa exige um banco alcançável antes de prosseguir. Você verá uma de duas telas.

**O servidor já enxerga o banco** (o caso normal com o Docker Compose). A tela mostra "Conectado em" seguido de host, porta e nome do banco, e a lista **Migrations aplicadas no banco**, com o nome e a data de cada uma. Uma migração marcada como `falhou` indica um problema que você deve resolver antes de continuar. Clique em **Continuar**.

**O servidor ainda não enxerga o banco.** A tela deixa você testar uma conexão candidata:

- **Motor:** só **PostgreSQL** funciona hoje. MySQL, SQLite e SQL Server aparecem desabilitados, como "Em breve".
- **Campos separados:** host, porta (padrão `5432`), banco, usuário, senha e **Exigir SSL**. Ou **URL completa**, no formato `postgresql://usuario:senha@host:5432/banco`.
- Clique em **Testar conexão**. O teste espera até 8 segundos e devolve "Conexão OK." ou uma causa clara: "Usuário ou senha incorretos.", "O banco informado não existe." ou "Não consegui conectar nesse host e porta.". São permitidos 20 testes a cada 5 minutos.
- Quando dá certo, a tela mostra o trecho `DATABASE_URL="..."` pronto para colar no `.env`, com um botão **copiar**.

::: warning O teste não troca o banco do app
O processo já está no ar com a conexão atual, então testar uma conexão **não a aplica**. Cole o trecho no `.env` do servidor, reinicie o app (por exemplo, `docker compose --profile app up -d --force-recreate web`) e clique em **Verificar novamente**. O assistente continua de onde parou.
:::

Se o banco está acessível mas as tabelas ainda não existem (as migrações não foram aplicadas), a etapa mostra "Conectado", mas o assistente não avança. Aplique as migrações (`pnpm db:deploy` em desenvolvimento; no Docker, o container `migrate` já faz isso) e clique em **Verificar novamente**.

### 3. Formas de login

Marque uma ou mais formas de entrada. Você pode ativar várias ao mesmo tempo. Para cada uma, a tela mostra o que ela comprova como vínculo, uma dica de onde criar o aplicativo e a **URL de retorno (callback)** pronta, montada a partir do `AUTH_URL`. Copie essa URL para o cadastro do aplicativo no provedor.

![Etapa de login com GitHub no assistente](/prints/02-instalacao-github.png)

*Exemplo da etapa de login com GitHub, de uma versão anterior. Hoje a tela lista todas as formas de login e o assistente tem 10 etapas.*

| Forma de login | Campos |
|---|---|
| GitHub, Google, Facebook | Client ID (no Facebook, App ID) e Client secret (no Facebook, App secret) |
| Microsoft | Client ID, Client secret e Tenant (ID do diretório) |
| GitLab | Client ID, Client secret e, se for GitLab próprio, a URL do GitLab |
| OIDC | Nome do botão, Emissor (issuer), Client ID e Client secret |
| E-mail e senha | Uma opção: permitir que pessoas criem conta e peçam acesso |

**O que é validado ao salvar:**

- É preciso escolher **pelo menos uma** forma de login, sem repetir.
- **GitHub:** o Client ID e o Client secret são testados contra a API do GitHub. Se forem recusados, você vê "GitHub recusou esse Client ID / Client secret.".
- **Google:** o Client ID precisa terminar em `.apps.googleusercontent.com`.
- **Facebook:** o App ID é numérico.
- **Microsoft:** o tenant é o ID do diretório (um GUID) ou o domínio do tenant. Em branco, aceita qualquer diretório, e só os domínios de e-mail contam como vínculo. Prefira sempre preencher.
- **OIDC:** o emissor precisa ser uma URL `https://`, o nome do botão é obrigatório (até 40 caracteres) e o hub consulta `/.well-known/openid-configuration` do emissor antes de salvar.
- **Client secret** com pelo menos 8 caracteres. Fica **cifrado** no banco. Em provedores já salvos, deixar o campo em branco mantém o secret atual.

Você pode mudar tudo isso depois em **Configurações → Formas de login**. O passo a passo de cada provedor está em [Provedores de login](/instalacao/provedores-de-login).

### 4. E-mail

Etapa opcional. Os campos ficam em **Servidor** (SMTP, porta, TLS, usuário e senha) e **Mensagens** (remetente e o endereço público do hub). **Testar conexão** abre o SMTP e pode mandar um e-mail de prova. **Salvar e continuar** grava a senha cifrada. **Pular por enquanto** segue sem envio: os links de convite continuam só para copiar. A mesma seção volta em **Configurações → E-mail**.

Em desenvolvimento, `pnpm db:up` sobe um Mailpit. Com a instalação concluída e sem SMTP, `pnpm mail:dev` grava `127.0.0.1`, porta `1025`, TLS desligado e remetente `noreply@example.com`. A caixa abre em `http://localhost:8025`.

### 5. Organização

Aqui você diz quem é a empresa e o que conta como "ser da empresa".

| Campo | O que significa | Regras |
|---|---|---|
| **Nome da empresa** | Aparece no menu e no login | 2 a 80 caracteres |
| **Identificador** | Nome curto, usado em logs. Exemplo: `acme` | 2 a 40 caracteres: minúsculas, números e hífen. **Não muda** depois |
| **Título do sistema** | Aparece no topo, na aba do navegador e no login | 2 a 40 caracteres. Editável depois em **Aparência** |
| **Domínios de e-mail da empresa** | Valem para Google, Microsoft, GitLab e OIDC | Digite um e clique em **+**. Até 20, no formato `acme.com.br`. Subdomínios contam |
| **Organizações do GitHub aceitas** | Quem é membro **ativo** de alguma delas conta como da empresa | Só aparece se você escolheu GitHub. Digite o nome e clique em **+**, até 10 |

Recomendações:

- Liste **todos** os domínios que a empresa usa. Um domínio esquecido faz as pessoas dele caírem em "pedir acesso".
- Use o **nome da organização** do GitHub (o trecho da URL `github.com/acme`), em minúsculas.

### 6. Repositórios

Escolha onde está o código: **GitHub**, **GitLab**, **Bitbucket** ou **Outro (URL direta)**. É opcional. Sem nenhuma integração, os serviços ainda podem receber a spec pelo CI, por URL ou por importação manual. Para continuar sem integração, clique em **Continuar sem integração (CI, URL ou importação manual)**.

Com uma integração marcada, você informa:

- **URL (só para instalação própria):** o endereço do seu GitLab ou Bitbucket próprio. Em branco, vale o serviço público.
- **Token de leitura:** um token **só de leitura**. No GitHub, um token fine-grained com leitura de Contents e Metadata. No GitLab, um access token com `read_repository` e `read_api`. No Bitbucket, um access token com leitura.

O hub testa o token contra o provedor ("token recusado" se ele responder 401 ou 403). Se não houver rede para o teste, ele não bloqueia: o erro aparecerá na primeira sincronização. O token fica cifrado.

Essa integração serve para validar repositórios ao cadastrá-los e para ler arquivos de spec do repositório. Depois você a edita em **Configurações → Repositórios**.

### 7. Regras de acesso

Define o que acontece quando alguém faz login. As duas decisões ficam juntas; os três prazos ficam no bloco **Prazos**.

| Campo | O que faz | Padrão |
|---|---|---|
| **Liberar automaticamente quem comprova vínculo com a empresa** | Quem comprova vínculo entra direto como VIEWER. Desmarcado, todo mundo passa por aprovação | Marcado |
| **Quem não comprova vínculo** | **Pode pedir acesso e aguardar aprovação** ou **Não pode entrar (convites continuam valendo)** | Pode pedir acesso |
| **Sessão (horas)** | Tempo até pedir login de novo. De 1 a 72 | 8 |
| **Revalidar vínculo (horas)** | De quanto em quanto tempo o hub confere se a pessoa ainda pertence à empresa. De 1 a 72 | 12 |
| **Pedido expira (dias)** | Pedidos de acesso não decididos somem depois disso. De 1 a 90 | 14 |

A tela mostra avisos amarelos quando a configuração anterior faz todo mundo cair em aprovação, por exemplo "GitHub sem organização informada: ninguém entra direto, todos pedem acesso.". Eles não bloqueiam, mas mudam o comportamento.

**Recomendação.** Comece com a liberação automática ligada e a política "pode pedir acesso". Use "não pode entrar" apenas quando você tem certeza de que o vínculo cobre todas as pessoas legítimas. Convites e aprovações manuais continuam valendo mesmo com "não pode entrar".

### 8. Ambientes

Um ambiente é um estágio (desenvolvimento, homologação, produção). A instalação já traz três, que você pode editar, reordenar, remover ou complementar:

| Identificador | Nome | Branches | Produção |
|---|---|---|---|
| `dev` | Desenvolvimento | `develop`, `dev`, `feature/**` | Não |
| `hml` | Homologação | `release/*`, `homolog`, `hml`, `staging` | Não |
| `prod` | Produção | `main`, `master` | Sim |

Para cada ambiente:

- **Nome:** de 2 a 40 caracteres.
- **Identificador:** minúsculas, números e hífen, até 20 caracteres, começando por letra ou número. Aparece em URLs, no CI e no `{env}` da leitura por URL.
- **Cor:** só visual.
- **Branches:** digite uma regra e clique em **+**. `*` casa um trecho sem barra, `**` casa qualquer coisa e `?` casa um caractere. Ex.: `main`, `release/*`, `feature/**`, `hotfix-*`.
- **Branch de leitura:** a branch de onde o hub lê o arquivo quando a spec vem do repositório.
- **É produção:** marca o ambiente de produção. É o padrão de uma publicação sem branch.
- **Subir**, **Descer** e **Remover**. A **ordem importa**: a primeira regra que casar com a branch define o ambiente.

É preciso ao menos um ambiente, e no máximo dez. Depois da instalação, um ambiente que já tem specs ou variáveis não pode ser removido; para mudar o nome, edite o campo **Nome**, e não o identificador. Veja [Ambientes por branch](/receitas/ambientes-por-branch).

### 9. Primeiro administrador

Define quem será o **OWNER**, o papel que sempre tem todas as permissões. Há dois caminhos, conforme as formas de login que você ativou.

**Entrar com um provedor.** Informe o **usuário do GitHub ou e-mail do administrador** e clique em **Salvar**. Depois, clique em **Entrar com** o provedor desejado e faça o login com essa conta. Ao voltar, a tela mostra "**fulano** é o OWNER desta instalação." e o botão **Continuar**.

- Use o **usuário do GitHub** se o login é por GitHub (o e-mail do GitHub pode ser privado). Nos demais provedores, use o **e-mail** que o provedor devolve.
- Durante a instalação, **só essa pessoa consegue entrar**. Qualquer outra recebe "A instalação ainda não terminou. Só o administrador definido no assistente pode entrar.".

**Criar com e-mail e senha.** Disponível se você ativou essa forma de login. Informe **Nome**, **E-mail**, **Senha** e **Confirmar senha**, e clique em **Criar administrador**. A senha precisa ter pelo menos 12 caracteres, misturar ao menos três tipos (minúsculas, maiúsculas, números e símbolos), não conter sequências comuns como `123456` e não conter a parte inicial do seu e-mail.

Depois que o OWNER existe, não dá para definir outro nesta etapa ("O OWNER já foi definido."). Você adiciona mais OWNERs depois, em **Pessoas e acesso**.

### 10. Revisar e concluir

Um resumo com tudo que você configurou: empresa, título, formas de login, vínculo com a empresa, repositórios, ambientes, quem entra direto, quem não entra e o OWNER. Confira os avisos e clique em **Concluir instalação**.

O botão só funciona se houver organização, formas de login, ambientes e um administrador ativo. Do contrário, aparece "Falta concluir: ...". Ao concluir, o assistente se tranca e você sai da tela de instalação.

- Se você entrou por um provedor na etapa 8, a sessão continua valendo e o hub abre direto.
- Se criou o administrador por e-mail e senha, o hub leva à tela de login. Entre com o e-mail e a senha que acabou de criar.

No primeiro acesso, o hub abre o **tour guiado**. Veja [Primeiro acesso e tour](/uso/primeiro-acesso).

## O que dá para mudar depois

Tudo o que você configurou fica editável dentro do hub, exceto o banco, as chaves e o identificador da empresa.

| O quê | Onde | Permissão |
|---|---|---|
| Nome da empresa, domínios e organizações do GitHub | **Configurações → Organização** | `settings:manage` |
| Identificador da empresa | Não muda | (não se aplica) |
| Título do sistema | **Aparência** | `appearance:manage` |
| Formas de login | **Configurações → Formas de login** | `settings:manage` |
| Repositórios (integrações e tokens) | **Configurações → Repositórios** | `settings:manage` |
| Ambientes | **Configurações → Ambientes** | `settings:manage` |
| Liberação automática, política, sessão, revalidação, prazo do pedido | **Configurações → Regras de acesso** | `settings:manage` |
| Encerrar sessões, conferir vínculos, recuperação de OWNER | **Configurações → Sessões e recuperação** | `settings:manage` |
| Outros OWNERs, papéis e convites | **Pessoas e acesso** | `user:manage` (só um OWNER concede o papel OWNER) |
| Banco de dados | `DATABASE_URL` no `.env` e reinício | Acesso ao servidor |
| `ENCRYPTION_KEY` e `AUTH_SECRET` | `.env`. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente) | Acesso ao servidor |

Mudanças na duração da sessão valem para os **próximos logins**. Mudar a lista de organizações ou de domínios força a revalidação do vínculo de todo mundo no próximo acesso. Veja [Configurações](/admin/configuracoes).

## Segurança durante a instalação

- **Sem token de instalação.** A `POST /api/setup` só exige que a requisição venha da própria página do hub (checagem de mesma origem). Qualquer pessoa que consiga abrir a URL pode percorrer o assistente. A primeira instalação concluída define o OWNER.
- **Restrinja o acesso até concluir.** Use firewall, VPN ou uma lista de IPs no proxy ([HTTPS com proxy reverso](/instalacao/proxy-https)). Libere o endereço para a empresa só depois da etapa 9.
- **Só o futuro OWNER entra.** Enquanto a instalação não termina, o login só é aceito para a conta informada na etapa 8. Nas etapas 1 a 7, ninguém consegue entrar.
- **Depois de concluir**, o assistente recusa qualquer escrita (`409`), e a tela `/setup` deixa de existir para todos.
- **Os segredos** (Client secret dos provedores e tokens de repositório) ficam cifrados no banco com a `ENCRYPTION_KEY`. Nada sensível volta para a tela: os campos mostram só que "já existe um secret salvo".

## Como saber que deu certo

- Depois de entrar, você vê o hub com o seu nome e o papel `owner` no rodapé do menu.
- O **tour guiado** abre no primeiro acesso.
- Em **Configurações**, o cabeçalho mostra a data da instalação e você aparece como OWNER.
- Em **Auditoria**, o grupo **Instalação** lista as ações do assistente, incluindo `setup.completed`.
- Abrir `/setup` de novo leva de volta ao hub.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Fica na etapa 2 mesmo "Conectado" | As migrações não foram aplicadas | `pnpm db:deploy` (ou o container `migrate`) e **Verificar novamente** |
| "Conclua as etapas anteriores primeiro." | Você tentou pular uma etapa | Volte e conclua a etapa que falta |
| "Origem da requisição inválida." | O `AUTH_URL` não bate com o domínio do navegador | Corrija o `AUTH_URL` ([proxy](/instalacao/proxy-https)) |
| "GitHub recusou esse Client ID / Client secret." | Credenciais erradas ou de outro aplicativo | Gere um novo secret e cole de novo |
| "O emissor OIDC respondeu ... em /.well-known/openid-configuration." | O emissor está errado ou fora do ar | Confira a URL do emissor, sem `/.well-known` no final |
| "ENCRYPTION_KEY não definida." ao salvar | A chave não chegou ao app | Preencha no `.env`, recrie o app e tente de novo |
| Erro ao entrar como administrador | A conta usada é diferente da informada na etapa 8 | Entre com exatamente a conta informada (usuário do GitHub ou e-mail) |
| Esqueci a senha do administrador criado por e-mail antes de concluir | O assistente não redefine senhas | Conclua a instalação e use `pnpm admin:recover --login fulano@suaempresa.com --reset-password` para gerar um link de nova senha. Veja [Recuperação de OWNER](/admin/recuperacao-de-owner) |

## Próximos passos

- [Primeiro acesso e tour](/uso/primeiro-acesso): o que você vê ao entrar no hub.
- [Do zero ao primeiro serviço](/receitas/primeiro-servico): cadastre e publique o primeiro serviço.
- [Pessoas e acesso](/admin/pessoas-e-acesso): aprove pedidos e convide a equipe.
- [Atualização e backup](/instalacao/atualizacao-e-backup): proteja o que você acabou de configurar.
