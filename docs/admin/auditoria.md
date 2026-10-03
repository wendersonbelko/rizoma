---
description: "A tela Auditoria do Rizoma: filtros, colunas, frases dos eventos, detalhes, exportação em CSV, e o que é registrado (e o que nunca é)."
---

# Auditoria

A **Auditoria** é o registro de quem fez o quê no Rizoma e quando: entradas e saídas, decisões de acesso, mudanças em serviços, tokens, permissões e configurações, e a revelação de segredos. Esta página mostra como filtrar, ler e exportar esse registro, e o que ele guarda. É para quem administra o hub e para quem precisa investigar uma mudança.

## Para que serve

Use a auditoria para responder perguntas como "quem arquivou este serviço?", "quem revelou o segredo do banco de homologação?", "quando esta pessoa ganhou o papel de admin?" ou "o que mudou nas configurações ontem?". Ela também serve de evidência para revisões de segurança e conformidade.

## Quem vê

O item **Auditoria** do menu abre `/admin/audit`. A tela e a exportação exigem a permissão de ver e exportar a auditoria, que ADMIN e OWNER têm por padrão. Como é uma permissão administrativa, só pode ser dada ao papel ADMIN (RN-28). Quem não a tem recebe "não encontrada", inclusive no endereço de exportação.

## O que aparece na tela

![Tela Auditoria](/prints/11-auditoria.png)

*A tela Auditoria. A frase da ação abre o registro; o código técnico fica nessa ficha.*

O cabeçalho mostra o título **Auditoria**, a contagem "N registros com esses filtros." e o link **Baixar CSV** à direita. Abaixo ficam a busca, o período e os tipos. A lista e o registro aberto não aparecem juntos.

### Filtros

| Filtro | O que faz |
|---|---|
| **Pessoa** | Campo "Buscar pessoa (@usuario)". Só os eventos feitos por essa pessoa. Digite o usuário do GitHub ou o e-mail e confirme a busca. |
| **Tipo** | Uma fileira de filtros (veja a tabela abaixo). **Todos** não filtra. |
| **Período** | O botão **Período** abre **De** e **Até**. O dia inicial começa à 00:00 e o dia final vai até 23:59, ambos inclusos. **Aplicar** grava o intervalo. |

**Limpar** volta a todos os registros. Mudar o tipo volta para a página 1 e mantém o **Por página** escolhido. Os filtros vão para a URL (`?actor=joana-lima&group=service.&from=2026-09-01`), então você pode compartilhar a consulta.

Os grupos do filtro **Tipo**:

| Tipo | Eventos que reúne |
|---|---|
| **Login e saída** | Entrar, sair e bloqueio de conta por senhas erradas. |
| **Acesso** | Pedidos, aprovações, recusas, logins barrados, mudanças automáticas de status e justificativas. |
| **Pessoas** | Convites, mudança de papel, suspensão, reativação, redefinição de senha e conclusão do tour. |
| **Times** | Criar time, adicionar e remover membros. |
| **Serviços** | Criar, atualizar, arquivar, restaurar e mudar a origem da spec. |
| **Vínculos** | Criar e remover vínculos. |
| **Repositórios** | Cadastrar repositórios. |
| **Tokens** | Criar e revogar tokens de publicação. |
| **Publicação de specs** | Spec publicada pelo CI, importada à mão ou sincronizada. |
| **Configurações** | Organização, formas de login, repositórios, ambientes, regras de acesso, sessões. |
| **Recuperação de OWNER** | Abrir, usar e cancelar a recuperação. |
| **Instalação** | Eventos do assistente de instalação. |

::: info Eventos sem Tipo próprio
Alguns eventos não têm um grupo no filtro: variáveis de ambiente, páginas de regras de negócio, integrações externas, mudanças de permissões e de aparência, e a exportação da própria auditoria. Eles aparecem quando **Tipo** está em **Todos**; para achar um deles, filtre por **Pessoa** ou pelo período.
:::

O endereço ainda aceita `?target=` com o identificador interno de um serviço, pessoa ou time. A tela não oferece esse filtro num campo.

### Tabela

A tabela mostra os registros do mais recente para o mais antigo, com 10 por página por padrão e a paginação do hub ("Mostrando 1–10 de 340 registros"; também dá para ver 20, 50 ou 100). Sem resultados, aparece "Nenhum registro com esses filtros", com a sugestão de ajustar o período, a pessoa ou o tipo de evento.

| Coluna | O que mostra |
|---|---|
| **Quando** | Data e hora do evento. |
| **Quem** | A pessoa que fez a ação (`@usuario` ou e-mail), ou "sistema" para eventos automáticos. |
| **Ação** | Uma frase que descreve o evento. O clique abre o registro no lugar da tabela. |
| **Alvo** | O item afetado: o nome do serviço, da pessoa ou do time, quando conhecido. "—" quando não há alvo. |
| **IP** | O endereço de onde veio a requisição. Some em telas estreitas. |

#### As frases da coluna Ação

O hub traduz cada evento numa frase, para que você entenda sem conhecer os códigos internos:

| Frase | O que aconteceu |
|---|---|
| Vínculo criado: Pedidos consome a API de Estoque | Um vínculo foi criado, com os nomes dos dois lados. |
| Serviço arquivado: Frete (legado) | Um serviço foi arquivado. |
| Spec publicada pelo CI em Homologação (v2.4.0) — Pedidos | O CI publicou uma versão. |
| Token de publicação criado para Pedidos (ahub_a1b2c3d…) | Um token foi gerado; aparece só o prefixo. |
| Papel alterado de Leitor para Mantenedor — @carla-nunes | Um papel mudou. |
| Segredo revelado — Pedidos | Alguém revelou um segredo, sem o valor. |
| Login recusado (not_member) | O login foi barrado por falta de vínculo. |
| Matriz de permissões alterada | As permissões foram editadas. |

Eventos sem uma frase própria aparecem com o código técnico em texto corrido, por exemplo "envvar created".

#### O registro

Clicar na frase substitui a tabela pelo registro: quando, quem, alvo, IP, o código técnico (por exemplo, `service.updated`) e, quando existir, os dados extras em JSON. É aqui que você vê, por exemplo, exatamente quais permissões foram adicionadas e removidas de cada papel. **← Auditoria** volta para a lista, com os filtros que estavam ativos.

## O que dá para fazer

### Investigar uma pessoa

1. Digite o `@usuario` ou o e-mail na busca de pessoa e confirme.
2. Se quiser, abra **Período** e aplique as datas.
3. Deixe **Tipo** em **Todos** para ver tudo, ou escolha um grupo para focar.

### Ver um evento

1. Na coluna **Ação**, clique na frase.
2. Leia quem fez, o alvo, o IP, o código e o JSON.
3. Use **← Auditoria** para voltar à lista.

### Baixar o CSV

O link **Baixar CSV** exporta os registros com **os filtros atuais**, ignorando a página e o tamanho da página:

1. Aplique os filtros que quiser.
2. Clique em **Baixar CSV**. O navegador baixa `auditoria-2026-09-29.csv`.

O arquivo tem no máximo **10.000 linhas**, as mais recentes dentro dos filtros. Se houver mais registros, restrinja o período. As colunas são:

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
Cada download vira o registro "Exportou a auditoria em CSV", com os filtros usados e quantas linhas foram exportadas. Quem exporta fica registrado.
:::

## O que é registrado

O hub registra as ações que mudam estado ou dão acesso a algo sensível:

| Área | Exemplos |
|---|---|
| Entrada | Entrar, sair, conta bloqueada, acesso barrado, mudança automática de status. |
| Acesso e pessoas | Pedido, justificativa, aprovação, recusa, convite, aceite do convite, link de nova senha, papel, suspensão, reativação, conclusão do tour. |
| Times | Criar time, adicionar e remover membro. |
| Serviços | Criar, atualizar, arquivar, restaurar, mudar a origem da spec. |
| Vínculos e repositórios | Criar e remover vínculos, cadastrar repositórios. |
| Specs | Publicar (CI e importação manual), sincronizar. |
| Tokens | Criar e revogar. |
| Variáveis | Criar, atualizar, excluir, **revelar**, copiar entre ambientes e baixar o `.env`. |
| Regras de negócio e integrações | Criar, editar e excluir páginas e integrações; ligar e desligar integrações de serviços. |
| Administração | Permissões, aparência, organização, formas de login, repositórios, ambientes, regras de acesso, encerramento de sessões, revalidação de vínculos, exportação da auditoria. |
| Recuperação e instalação | Abrir, usar e cancelar a recuperação de OWNER; etapas do assistente. |

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

- [Pessoas e acesso](/admin/pessoas-e-acesso): o histórico de decisões de acesso, resumido.
- [Permissões](/admin/permissoes): todo salvamento da matriz aparece aqui, com o que mudou.
- [Variáveis de ambiente](/uso/variaveis): o que fica registrado ao revelar ou exportar.
