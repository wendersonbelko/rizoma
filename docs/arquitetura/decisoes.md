---
description: Registro das decisões de arquitetura do Rizoma no formato ADR curto, com contexto, decisão e consequências de cada uma.
---

# Decisões de arquitetura

Esta página registra as decisões de arquitetura mais importantes do Rizoma, no formato de um ADR curto: contexto, decisão e consequências. Ela serve a quem vai mexer no código ou avaliar as escolhas do projeto. Os motivos vêm dos comentários do código e das regras de negócio (`RN-xx`); onde uma decisão tem custo, ele está escrito.

| ADR | Decisão | Status |
|---|---|---|
| [ADR-01](#adr-01-monólito-next-js-com-ui-e-api-juntas) | Monólito Next.js com UI e API juntas | Aceita |
| [ADR-02](#adr-02-regras-de-negócio-num-pacote-puro) | Regras de negócio num pacote puro | Aceita |
| [ADR-03](#adr-03-prisma-e-postgresql-e-só-postgresql-hoje) | Prisma e PostgreSQL, e só PostgreSQL hoje | Aceita |
| [ADR-04](#adr-04-sessão-jwt-com-tokenversion) | Sessão JWT com `tokenVersion` | Aceita |
| [ADR-05](#adr-05-sem-token-central-de-instalação) | Sem token central de instalação | Aceita |
| [ADR-06](#adr-06-rotas-administrativas-respondem-404) | Rotas administrativas respondem 404 | Aceita |
| [ADR-07](#adr-07-segredos-com-aes-256-gcm-e-chave-fora-do-banco) | Segredos com AES-256-GCM e chave fora do banco | Aceita |
| [ADR-08](#adr-08-spec-versionada-por-ambiente-com-checksum) | Spec versionada por ambiente, com checksum | Aceita |
| [ADR-09](#adr-09-scalar-sem-testar-requisição-e-sem-telemetria) | Scalar sem "testar requisição" e sem telemetria | Aceita |
| [ADR-10](#adr-10-limite-de-requisições-em-memória) | Limite de requisições em memória | Aceita, com limitação |
| [ADR-11](#adr-11-tour-guiado-obrigatório) | Tour guiado obrigatório | Aceita |
| [ADR-12](#adr-12-design-system-com-testes-guarda-e-paginação-por-url) | Design system com testes-guarda e paginação por URL | Aceita |

### ADR-01 — Monólito Next.js com UI e API juntas

**Contexto.** O hub é instalado por empresas de tamanhos muito diferentes, em servidores próprios. Quanto menos peças para operar, melhor. Front e back compartilham as mesmas regras e os mesmos tipos, e a API que outras ferramentas consomem é pequena (publicar spec, sincronizar, saúde).

**Decisão.** Um único aplicativo Next.js (App Router), com telas em Server Components, mutações da interface por Server Actions e rotas de API (`route.ts`) só para quem não é a interface: o CI (`/api/v1/*`), o Auth.js (`/api/auth/*`), o healthcheck, downloads (CSV da auditoria e `.env`) e o assistente de instalação (`/api/setup*`, que precisa funcionar mesmo sem banco alcançável). Uma imagem Docker, um processo. O "middleware" do Next 16 é o `apps/web/src/proxy.ts`.

**Consequências.**

- (+) Um deploy, uma imagem, um processo. Sem CORS entre front e back, e tipos compartilhados.
- (+) A saída `standalone` do Next dá uma imagem final enxuta.
- (−) Interface e API escalam juntas.
- (−) O projeto acompanha o ritmo de versões do Next.js e do React.

### ADR-02 — Regras de negócio num pacote puro

**Contexto.** As regras do produto (quem pode o quê, quem entra, o que é uma spec válida, qual ambiente recebe uma branch) precisam ser testáveis, explicáveis por código (`RN-xx`) e reutilizáveis. Misturá-las com Prisma e React deixa os testes lentos e as regras espalhadas.

**Decisão.** `packages/core` reúne as regras como funções puras: recebem dados simples e devolvem uma decisão (por exemplo, `decideAccess`, `can`, `canManageService`, `parseSpec`, `resolveEnvironment`, `buildGraph`, `pageInfo`). O pacote só depende de `zod` e `yaml` (e do `node:crypto`), e **não** depende do banco. Os enums do Prisma são espelhados à mão em `types.ts` "para o core ser testável sem o banco". As telas e rotas carregam os dados, chamam o `core` e aplicam o resultado. O pacote expõe subcaminhos (`@api-hub/core/pagination`, `/themes`, `/auth-providers` e outros) para que componentes de cliente não puxem o pacote inteiro, que usa `node:crypto`.

**Consequências.**

- (+) Testes unitários rápidos e sem banco (`rbac`, `access-policy`, `spec`, `graph`, `hub-nav`, `pagination`, `text`, `themes`).
- (+) Uma regra, um lugar: o menu e o tour obrigatório vêm da mesma lista (`hub-nav`), então nunca ficam dessincronizados.
- (−) Os enums são duplicados entre o `core` e o Prisma. A integração com o banco real é coberta pelos testes de integração.
- (−) Algumas regras precisam existir também em SQL. A visibilidade de serviços (RN-30) é aplicada na consulta do catálogo, "em vez de carregar tudo e filtrar depois", para a paginação refletir o total real. A regra é a mesma, mas a disciplina de mantê-las alinhadas é da equipe.

### ADR-03 — Prisma e PostgreSQL, e só PostgreSQL hoje

**Contexto.** O modelo é relacional e precisa de transações e restrições de unicidade (por exemplo, uma versão por serviço, ambiente e checksum). Ele também usa listas e JSON com naturalidade: tags, regras de branch, organizações e domínios aceitos, metadados de auditoria e cores do tema.

**Decisão.** Prisma 6 com PostgreSQL 16, usando **arrays e JSON nativos** do Postgres. O Prisma roda sem o motor nativo em Rust (`engineType = "client"`): as consultas são compiladas em WASM e executadas pelo driver `pg` (`@prisma/adapter-pg`). Isso deixa a imagem menor e sem binário por plataforma. As migrações ficam versionadas no repositório e são aplicadas pelo container `migrate` com `prisma migrate deploy`. A etapa "Banco de dados" do assistente já lista MySQL, SQLite e SQL Server como "Em breve", mas só o PostgreSQL funciona.

**Consequências.**

- (+) Modelagem direta, sem tabelas auxiliares para listas simples.
- (+) Imagem Docker menor, e o mesmo comportamento em qualquer plataforma.
- (−) Suportar outro banco exige rever o modelo (arrays viram tabelas, JSON vira texto) e está no [roadmap](/arquitetura/roadmap).
- (−) As migrações só andam para frente: não há migração de volta. Por isso o [rollback](/instalacao/atualizacao-e-backup) depende de um backup.
- (−) Os testes de integração exigem um PostgreSQL real e truncam as tabelas.

### ADR-04 — Sessão JWT com `tokenVersion`

**Contexto.** O login por e-mail e senha (provedor Credentials do Auth.js) exige sessões em JWT, e o hub quer o mesmo comportamento para todos os provedores. Ao mesmo tempo, suspender uma pessoa ou trocar o papel dela precisa valer **imediatamente**, e não só quando o token expirar (RN-S03).

**Decisão.** Sessão em JWT, com duração configurável (padrão 8 horas). Cada pessoa tem um contador `tokenVersion`. O valor vai para o token no login, e `requireUser()` o compara com o do banco **a cada requisição**. O contador sobe quando a pessoa é suspensa, muda de papel, troca ou redefine a senha, tem o login barrado ou quando alguém usa **Encerrar todas as sessões** (que preserva a sessão de quem executou). Não existe tabela de sessões.

**Consequências.**

- (+) A revogação vale na próxima requisição, sem sessão para apagar.
- (+) Funciona igual para todos os provedores.
- (−) Uma leitura da pessoa no banco por requisição (aceitável para o porte do produto).
- (−) Não dá para listar nem revogar sessões individualmente. Só "todas".
- (−) Trocar o `AUTH_SECRET` derruba todas as sessões, e mudar a duração da sessão só vale para os próximos logins.

### ADR-05 — Sem token central de instalação

**Contexto.** O projeto é de código aberto: não há um servidor do projeto para emitir tokens de instalação, e um token em variável de ambiente só protege contra quem não tem acesso ao servidor, que poderia lê-lo de qualquer forma. O `SETUP_TOKEN` chegou a existir e foi removido por uma migração ("produto open-source, sem chave central").

**Decisão.** O assistente não usa token. As escritas do assistente só aceitam requisições vindas da própria página do hub (checagem de mesma origem, RN-S06). Enquanto a instalação não termina, o login só é aceito para a pessoa definida como futuro OWNER (RN-61). Depois de concluída, o assistente se tranca. A recuperação de OWNER acontece por linha de comando no servidor, e o acesso ao servidor é, em si, a prova de autorização (RN-70).

**Consequências.**

- (+) Instalação simples, sem um segredo extra para distribuir.
- (−) **Quem alcançar a URL primeiro pode definir o administrador.** Quem instala precisa restringir a rede até concluir o assistente (a documentação insiste nisso).
- (−) A segurança da instalação e da recuperação depende de quem tem acesso ao servidor.

### ADR-06 — Rotas administrativas respondem 404

**Contexto.** Responder "sem permissão" (403) a uma rota administrativa confirma a existência dela para quem não deveria saber (RN-23, RN-S10).

**Decisão.** `requirePermission()` chama `notFound()` quando falta a permissão. As rotas de API com controle próprio (o CSV da auditoria e o download do `.env`) também respondem 404. O menu esconde os itens que a pessoa não pode abrir, e o tour obrigatório percorre só as telas visíveis. Por isso a permissão do item de menu é a mesma que a página exige.

**Consequências.**

- (+) Não há enumeração de rotas administrativas.
- (−) Quem tem uma matriz de permissões customizada pode estranhar um 404 onde esperava um "sem permissão". A tela **Permissões** e o [glossário](/referencia/glossario) ajudam a explicar.
- (−) Menu, tour e página precisam concordar sobre a permissão de cada tela. Um teste garante o tour para toda tela do menu, e o item **Serviços e repositórios** usa só `link:edit` justamente para não levar ninguém a um 404.

### ADR-07 — Segredos com AES-256-GCM e chave fora do banco

**Contexto.** O banco guarda dados que o hub precisa **reler**: valores de variáveis marcadas como segredo, Client secrets dos provedores, tokens de repositório, cabeçalhos de leitura por URL e tokens OAuth do GitHub. Um vazamento do banco ou de um backup não pode entregar esses valores (RN-S04). Outros dados nunca precisam ser lidos de volta: tokens de publicação, convites e senhas.

**Decisão.** Segredos reversíveis usam **AES-256-GCM**, com uma chave de 32 bytes vinda da variável `ENCRYPTION_KEY`, que nunca vai para o banco, e um IV aleatório por cifragem. O formato é `v1.<iv>.<tag>.<texto cifrado>`, e o prefixo `v1` abre espaço para evoluir o formato. Tokens de publicação, convites e links de nova senha guardam só o hash SHA-256. Senhas usam scrypt, com sal por pessoa. Tokens OAuth do GitHub antigos, gravados em texto puro, são cifrados na primeira leitura.

**Consequências.**

- (+) Um dump do banco, sozinho, não revela segredos, e o GCM detecta adulteração.
- (−) A chave é um ponto único de falha: perdê-la torna os segredos ilegíveis, e **não existe comando de rotação**.
- (−) Com a chave errada, a montagem da configuração de login decifra o secret de cada provedor e falha. Na prática, o login por provedor deixa de funcionar até restaurar a chave.
- (−) O backup precisa guardar a chave em local separado do dump. Veja [Atualização e backup](/instalacao/atualizacao-e-backup).

### ADR-08 — Spec versionada por ambiente, com checksum

**Contexto.** A mesma API está em versões diferentes em cada ambiente (2.4.0 em produção, 2.5.0-rc.1 em homologação). O CI publica a cada push, então repetir a mesma spec não pode gerar ruído (RN-42, RN-90 a RN-93).

**Decisão.** Cada versão é única por serviço, ambiente e checksum. O checksum é o SHA-256 do JSON normalizado da spec (o YAML é lido e reserializado), e a marca `isLatest` vale só dentro do ambiente. Publicar o mesmo conteúdo no mesmo ambiente responde `unchanged`, e, se ele era uma versão antiga, volta a ser a atual. O ambiente vem do parâmetro `environment` ou da primeira regra de branch que casar, na ordem dos ambientes. Sem branch, vale o ambiente de produção. As dependências declaradas em `x-api-hub.dependsOn` viram vínculos marcados como detectados. A tela mostra a mais recente e as 20 anteriores.

**Consequências.**

- (+) Publicação idempotente, e um histórico por ambiente.
- (+) Voltar a um contrato antigo é reenviá-lo. Comentários e formatação do YAML não geram versão nova.
- (−) Reordenar as chaves da spec gera uma versão nova.
- (−) `info.version` é só um rótulo: dois conteúdos diferentes com o mesmo número podem coexistir.
- (−) Cada versão guarda a spec inteira (até 5 MB), então o banco cresce com o uso. Ainda não há diff entre versões (veja o [roadmap](/arquitetura/roadmap)).

### ADR-09 — Scalar sem "testar requisição" e sem telemetria

**Contexto.** O hub é privado, e o renderizador de OpenAPI (Scalar) traz, por padrão, recursos que enviam dados para fora ou fazem chamadas a partir do navegador: telemetria, assistente de IA, MCP, compartilhamento, deploy e "testar requisição" (RN-S15). Uma chamada de teste sairia do navegador de quem lê, direto para os servidores listados na spec.

**Decisão.** O componente é configurado com `telemetry: false`, o botão de teste e o cliente escondidos, `mcp` e `agent` desabilitados, sem barra de ferramentas nem ferramentas de desenvolvedor, e sem as fontes padrão (as fontes vêm do próprio hub). A CSP com `connect-src 'self'` funciona como segunda barreira. O download do documento OpenAPI continua disponível.

**Consequências.**

- (+) Nada da spec sai do hub, e o comportamento condiz com "fechado por padrão".
- (−) Quem lê não testa endpoints pelo hub. Deve usar as próprias ferramentas (curl, Postman).
- (−) Se o teste de requisição for reativado algum dia, o risco descrito acima volta. Atualizações do Scalar pedem uma nova revisão da configuração, porque podem trazer recursos novos.

### ADR-10 — Limite de requisições em memória

**Contexto.** Alguns pontos precisam de um freio contra abuso: o login (20 tentativas por e-mail em 15 minutos), a publicação de specs (30 por minuto por token), o convite (10 tentativas em 15 minutos), o cadastro (5 por hora por endereço) e o teste de conexão do assistente (20 em 5 minutos). Exigir Redis só para isso aumentaria a infraestrutura de quem instala.

**Decisão.** Um contador simples em memória, no próprio processo (`apps/web/src/lib/rate-limit.ts`), com o comentário de que, "com mais de uma instância, troque por Redis".

**Consequências.**

- (+) Nenhuma dependência extra.
- (−) **Só funciona direito com uma instância.** Com várias, cada uma conta por conta própria.
- (−) Os contadores zeram a cada reinício.
- (−) O limite por endereço confia no `X-Forwarded-For`, então o proxy precisa sobrescrever o cabeçalho (veja [HTTPS com proxy reverso](/instalacao/proxy-https)).
- Limitação registrada no [roadmap](/arquitetura/roadmap): um limite compartilhado, em Redis.

### ADR-11 — Tour guiado obrigatório

**Contexto.** O hub tem várias telas, e parte do problema que ele resolve é o custo de apresentar as coisas a cada pessoa nova. A auditoria de UX apontou que o primeiro contato precisava ser mais guiado.

**Decisão.** Todo mundo faz um tour obrigatório no primeiro acesso, um panorama só no Catálogo: o menu inteiro, a parte de consulta, a parte de administração e a interrogação. Não percorre as outras telas. O progresso é guardado por pessoa (`tourStep` e `tourCompletedAt`). O hub fica bloqueado até a pessoa concluir: um portão no layout redireciona para o Catálogo, e uma guarda no cliente cobre a navegação interna. A ação que avança o tour é idempotente, para aguentar clique duplo. Depois, o botão **?** de toda tela oferece o tour daquela tela sob demanda. O destaque de elementos usa o driver.js.

**Consequências.**

- (+) Um onboarding uniforme, sem depender de quem apresenta.
- (+) Um teste garante que toda tela do menu tem tour, com pelo menos 3 passos. Se a permissão da pessoa mudar no meio do tour, o índice se ajusta ao que ela ainda vê.
- (−) É uma fricção: não dá para pular na primeira vez, nem para o OWNER.
- (−) O texto do tour e os seletores `data-tour` precisam acompanhar a interface. O teste cobre a existência do tour, não a qualidade do texto.

### ADR-12 — Design system com testes-guarda e paginação por URL

**Contexto.** O hub tem muitas listagens (catálogo, pessoas, times, vínculos, tokens, variáveis, integrações, auditoria). Sem um padrão, cada tela ganha espaçamentos, estados vazios e paginação próprios, e listas grandes viram um problema de desempenho e de usabilidade.

**Decisão.** Um conjunto único de componentes: `DataTable` com `THead`, `Th`, `TBody`, `Tr`, `Td`, `CellTitle` e `RowActions`, `CardList`, `EmptyState`, `Badge`, `Notice`, `TabNav` e `FilterChips`. O teste `design-system.test.ts` **falha** se alguém montar `<table>` à mão, uma lista com divisórias manuais ou uma `DataTable` de listagem sem paginação. Só as tabelas de tamanho fixo ficam de fora, cada uma com o motivo registrado. A paginação vive na URL (`?page=` e `?size=`, com 10, 20, 50 ou 100 por página, padrão 10) e preserva os demais parâmetros, como filtros e abas. Telas com duas listagens usam nomes de parâmetro diferentes na segunda. Quando o banco pagina (`skip` e `take`), o total é real. Quando o filtro só existe em memória, pagina-se a lista já carregada.

**Consequências.**

- (+) Interface consistente, e endereços que podem ser compartilhados e guardados nos favoritos, com a página e o filtro na URL.
- (+) A paginação é feita por links comuns e por renderização no servidor.
- (+) O padrão não depende da disciplina de quem revisa: o teste barra o desvio.
- (−) Uma listagem nova precisa seguir o padrão, ou registrar a exceção no teste.
- (−) Paginar uma lista em memória carrega tudo antes. Isso só vale para listas de tamanho moderado.

## Como propor uma nova decisão

Ao mudar algo estrutural (uma tecnologia, um limite de segurança, um contrato público), descreva a decisão no pull request no mesmo formato: contexto, decisão e consequências, incluindo os custos. Veja [Pull requests e releases](/contribuindo/pull-requests).

## Veja também

- [Visão geral e princípios](/arquitetura/visao-geral): os princípios que essas decisões servem.
- [Autenticação e acesso](/arquitetura/autenticacao-e-acesso): as decisões 04 a 06 em detalhe.
- [Ingestão de specs](/arquitetura/ingestao-de-specs): a decisão 08 em detalhe.
- [Interface e design system](/arquitetura/interface): as decisões 11 e 12 em detalhe.
