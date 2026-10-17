---
description: "A tela Auditoria do Rizoma: filtros, linhas em frases, detalhes de cada evento, exportação em CSV, e o que é registrado (e o que nunca é)."
---

# Auditoria

A **Auditoria** é o registro de quem fez o quê no Rizoma e quando: entradas e saídas, decisões de acesso, mudanças em serviços, tokens, permissões e configurações, e a revelação de segredos. Esta página mostra como filtrar, ler e exportar esse registro, e o que ele guarda. É para quem administra o hub e para quem precisa investigar uma mudança.

## Para que serve

Use a auditoria para responder perguntas como "quem arquivou este serviço?", "quem revelou o segredo do banco de homologação?", "quando esta pessoa ganhou o papel de administrador?" ou "o que mudou nas configurações ontem?". Ela também serve de evidência para revisões de segurança e conformidade.

## Quem vê

O item **Auditoria** do menu (grupo **Sistema**) abre `/admin/audit`. A tela e a exportação exigem a permissão de ver e exportar a auditoria, que o Administrador e o Proprietário têm por padrão. Como é uma permissão administrativa, só pode ser dada ao papel Administrador (RN-28). Quem não a tem recebe "não encontrada", inclusive no endereço de exportação.

## O que aparece na tela

![Tela Auditoria](/prints/11-auditoria.png)

*A tela Auditoria. Captura de uma versão anterior da interface: hoje a lista não tem colunas separadas, cada registro é uma frase e os filtros ficam numa linha de campos (Tipo de evento, Pessoa, De e Até).*

O cabeçalho mostra o título **Auditoria**, a frase "Quem fez o quê e quando. 340 registros com esses filtros; abra Detalhes para ver o código da ação, o IP e os dados do evento." e o link **Baixar CSV** à direita. Abaixo ficam os filtros e a lista.

### Filtros

Os filtros formam uma linha de campos, e nada muda até você clicar em **Filtrar**:

| Filtro | O que faz |
|---|---|
| **Tipo de evento** | Um menu com os 16 tipos (veja a tabela abaixo). **Todos os eventos** não filtra. |
| **Pessoa** | Só os eventos feitos por essa pessoa. Aceita o nome (ou parte dele, sem diferenciar maiúsculas), o `@usuário` do GitHub ou o e-mail. O `@usuário` e o e-mail precisam ser exatos. |
| **De** e **Até** | O período. O dia inicial começa às 00:00 e o dia final vai até 23:59, ambos inclusos. Dá para preencher só um dos dois. |

Quando há algum filtro ativo, aparece **Limpar filtros**, que volta a todos os registros. Filtrar volta para a página 1 e mantém o **Por página** escolhido. Os filtros vão para a URL (`?actor=joana-lima&group=service.&from=2026-09-01&to=2026-09-30`), então você pode compartilhar a consulta. Os parâmetros são `group`, `actor`, `from`, `to`, `page` e `size`.

Os tipos do menu **Tipo de evento**:

| Tipo | Eventos que reúne |
|---|---|
| **Login e saída** | Entrar, sair e bloqueio de conta por senhas erradas. |
| **Acesso** | Solicitações, aprovações, recusas, logins recusados, mudanças automáticas de status e justificativas. |
| **Pessoas** | Convites (gerado e aceito), mudança de papel, suspensão, reativação, link de nova senha, senha nova e conclusão do tour. |
| **Times** | Criar time, adicionar e remover membros, sincronizar com o GitHub. |
| **Serviços** | Criar, atualizar, arquivar, restaurar e mudar a origem da spec, mais as variáveis de ambiente e as páginas de regras de negócio do serviço. |
| **Vínculos** | Criar e remover vínculos. |
| **Repositórios** | Cadastrar e sincronizar repositórios, resolver conflitos e aplicar ou gravar o `hub.json`. |
| **Integrações externas** | Cadastrar, atualizar e excluir integrações, e ligá-las ou desligá-las de serviços. |
| **Tokens** | Criar e revogar tokens de CI. |
| **Publicação de specs** | Spec enviada pelo CI, importada à mão ou sincronizada, e aviso de mudança incompatível. |
| **Permissões** | Alterar a matriz de permissões e restaurar o padrão. |
| **Configurações** | Organização, formas de login, e-mail, repositórios, ambientes, regras de acesso, sessões, webhooks e a marca (aparência). |
| **Recuperação de proprietário** | Usar e cancelar a recuperação. |
| **Instalação** | Eventos do assistente de instalação. |
| **Mapa de ligações** | Impressão do mapa. |
| **Auditoria** | A exportação da própria auditoria em CSV. |

O endereço ainda aceita `?target=` com o identificador interno de um serviço, pessoa ou time. A tela não oferece esse filtro num campo, mas o mantém ao filtrar.

### A lista

A lista mostra os registros do mais recente para o mais antigo, com 10 por página por padrão e a paginação do hub ("Mostrando 1–10 de 340 registros"; também dá para ver 20, 50 ou 100). Sem resultados, aparece "Nenhum registro com esses filtros", com a sugestão de ajustar o período, a pessoa ou o tipo de evento.

Cada linha é uma frase, no formato **autor + o que fez**, e embaixo vem o tipo de evento e há quanto tempo aconteceu:

> **Marina Costa** entrou no sistema
>
> Login e saída · há 2 h

- **Autor.** O nome da pessoa; se ela não tem nome, o `@usuário` ou o e-mail. Eventos sem pessoa (o CI publicando uma spec, a instalação, comandos rodados no servidor) aparecem com **Sistema**. Nunca aparece "@null" nem um código interno no lugar do nome.
- **Quando.** "agora", "há 5 min", "há 2 h", "ontem, 13:39", "01/10, 10:45" e, de outro ano, "01/10/2025". A data e a hora completas aparecem ao passar o mouse e em **Detalhes**.
- **Detalhes ▸.** Abre o registro dentro da própria linha, sem trocar de tela.

#### As frases

O hub traduz cada evento numa frase, para que você entenda sem conhecer os códigos internos:

| Frase | O que aconteceu |
|---|---|
| **Marina Costa** criou o vínculo Pedidos consome a API de Estoque | Um vínculo foi criado, com os nomes dos dois lados. |
| **Marina Costa** arquivou o serviço Frete (legado) | Um serviço foi arquivado. |
| **Sistema** enviou uma spec do serviço Pedidos pelo CI em Homologação (v2.4.0) | O CI publicou uma versão. |
| **Marina Costa** criou um token de CI para o serviço Pedidos (ahub_a1b2c3d…) | Um token foi gerado; aparece só o prefixo. |
| **Marina Costa** mudou o papel de Carla Nunes de Leitor para Mantenedor | Um papel mudou. |
| **Marina Costa** revelou o valor de um segredo (DB_PASSWORD) no serviço Pedidos | Alguém revelou um segredo, sem o valor. |
| **Carla Nunes** teve o login recusado (não faz parte da empresa) | O login foi barrado por falta de vínculo. |
| **Marina Costa** alterou a matriz de permissões (3 mudanças) | As permissões foram editadas. |

Um evento sem frase própria aparece com o código entre aspas, por exemplo `registrou a ação "owner.recovery_opened"`.

#### Detalhes

Clicar em **Detalhes** (a linha inteira é clicável, e o teclado abre com Enter ou Espaço) mostra:

| Campo | O que mostra |
|---|---|
| **Data e hora** | O momento exato do evento. |
| **IP** | O endereço de onde veio a requisição, ou "—". |
| **Código da ação** | O código técnico, por exemplo `service.updated`. |
| **Alvo** | O item afetado, com o tipo na frente ("Serviço: Pedidos API", "Pessoa: …", "Time: …", "Integração externa: …"). "—" quando não há alvo, quando o alvo é a própria pessoa que agiu ou quando o registro já não existe. |
| **Dados do evento** | O JSON formatado com os dados extras, quando existem. É aqui que você vê, por exemplo, exatamente quais permissões foram adicionadas e removidas de cada papel. |

A tela antiga de um registro por vez (`?id=`) não existe mais: um link antigo com `?id=` abre a lista, com os mesmos filtros.

## O que dá para fazer

### Investigar uma pessoa

1. Digite o nome, o `@usuário` ou o e-mail no campo **Pessoa**.
2. Se quiser, preencha **De** e **Até**.
3. Deixe **Tipo de evento** em **Todos os eventos** para ver tudo, ou escolha um tipo para focar.
4. Clique em **Filtrar**.

### Ver um evento

1. Clique em **Detalhes** na linha.
2. Leia a data e a hora, o IP, o código da ação, o alvo e o JSON.
3. Clique de novo na linha para fechar.

### Baixar o CSV

O link **Baixar CSV** exporta os registros com **os filtros atuais**, ignorando a página e o tamanho da página:

1. Aplique os filtros que quiser.
2. Clique em **Baixar CSV**. O navegador baixa `auditoria-2026-09-29.csv`.

O arquivo tem no máximo **10.000 linhas**, as mais recentes dentro dos filtros. Se houver mais registros, restrinja o período. O CSV continua com as colunas técnicas, não com as frases da tela:

```csv
quando,quem,acao,alvo_tipo,alvo_id,ip,detalhes
"2026-09-29T14:03:12.000Z","joana-lima","service.updated","service","clx…","10.20.1.14","{""slug"":…}"
```

| Coluna | Conteúdo |
|---|---|
| `quando` | Data e hora em UTC, no formato ISO. |
| `quem` | O usuário do GitHub ou o e-mail, ou `sistema`. |
| `acao` | O código técnico do evento, não a frase. |
| `alvo_tipo` e `alvo_id` | O tipo e o identificador interno do alvo. |
| `ip` | O endereço de origem. |
| `detalhes` | Os dados extras, em JSON. |

Dois cuidados do arquivo (RN-S14):

- **Fórmulas neutralizadas.** Uma célula que começa com `=`, `+`, `-` ou `@` (ou com tabulação) recebe um apóstrofo na frente, para que o Excel ou o Google Sheets não a execute como fórmula.
- **Codificação.** O arquivo vem em UTF-8 com marca de ordem de bytes, para que os acentos abram corretamente no Excel.

::: warning A exportação também é auditada
Cada download vira o registro "exportou a auditoria em CSV", com os filtros usados e quantas linhas foram exportadas. Quem exporta fica registrado.
:::

## O que é registrado

O hub registra as ações que mudam estado ou dão acesso a algo sensível:

| Área | Exemplos |
|---|---|
| Entrada | Entrar, sair, conta bloqueada, acesso barrado, mudança automática de status. |
| Acesso e pessoas | Solicitação, justificativa, aprovação, recusa, convite, aceite do convite, link de nova senha, papel, suspensão, reativação, conclusão do tour. |
| Times | Criar time, adicionar e remover membro, sincronizar com o GitHub. |
| Serviços | Criar, atualizar, arquivar, restaurar, mudar a origem da spec. |
| Vínculos e repositórios | Criar e remover vínculos, cadastrar e sincronizar repositórios. |
| Specs | Publicar (CI e importação manual), sincronizar. |
| Tokens | Criar e revogar. |
| Variáveis | Criar, atualizar, excluir, **revelar**, copiar entre ambientes e baixar o `.env`. |
| Regras de negócio e integrações | Criar, editar e excluir páginas e integrações; ligar e desligar integrações de serviços. |
| Mapa | Imprimir o mapa de ligações. |
| Administração | Permissões, marca (aparência), organização, formas de login, e-mail, repositórios, ambientes, regras de acesso, encerramento de sessões, verificação de vínculos, exportação da auditoria. |
| Recuperação e instalação | Abrir, usar e cancelar a recuperação de proprietário; etapas do assistente. |

### O que nunca é registrado

A auditoria diz **quem** fez e **em que**, mas nunca guarda valores sensíveis (RN-88):

- o **valor** de uma variável de ambiente, secreta ou não; só a chave, o ambiente e se é segredo;
- o **valor** de um segredo revelado; só o fato de ter sido revelado;
- os **cabeçalhos** de leitura da spec por URL (que podem ter tokens);
- o **token** de publicação inteiro; só o prefixo;
- **senhas**, **client secrets** e tokens de integração.

## Regras importantes

- **Filtros e exportação (RN-79).** A auditoria filtra por pessoa, tipo, período e alvo, e exporta até 10.000 linhas em CSV. A própria exportação fica registrada.
- **Nada de valores sensíveis (RN-88).** Valores de variáveis, cabeçalhos e segredos nunca entram.
- **CSV seguro (RN-S14).** Células que começam com `=`, `+`, `-` ou `@` são neutralizadas contra injeção de fórmula.
- **Registro só de leitura.** A tela não tem como editar ou apagar registros.
- **Rotas protegidas (RN-23).** Sem a permissão, tanto a tela quanto a exportação respondem "não encontrada".

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio) e o resumo de segurança em [Segurança](/referencia/seguranca).

## Próximos passos

- [Pessoas e acesso](/admin/pessoas-e-acesso): o histórico de decisões de acesso, com as mesmas frases.
- [Permissões](/admin/permissoes): todo salvamento da matriz aparece aqui, com o que mudou.
- [Variáveis de ambiente](/uso/variaveis): o que fica registrado ao revelar ou exportar.
