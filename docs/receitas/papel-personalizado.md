---
description: Ajuste a matriz de permissões dos papéis ADMIN, MAINTAINER e VIEWER, com exemplos práticos, as travas que o hub impõe, como conferir e como voltar ao padrão.
---

# Papel com permissões sob medida

O hub não deixa criar papéis novos: existem sempre quatro (OWNER, ADMIN, MAINTAINER e VIEWER). O que você pode fazer é editar a **matriz de permissões** de três deles e, assim, dar a cada papel exatamente o que a sua empresa precisa. Esta receita mostra três ajustes comuns, as travas que impedem erros graves, como conferir o resultado e como desfazer. É para quem tem permissão de editar a matriz.

::: info A matriz vale para todo mundo que tem o papel
Mudar a coluna **Leitor** muda o que **todos** os VIEWERs podem fazer. Não há exceção por pessoa. Se você precisa de um perfil diferente do padrão para poucas pessoas, o caminho é ajustar a coluna de um papel que só elas usam, ou combinar papel com visibilidade dos serviços (veja [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros)).
:::

## Antes de começar

- Você enxerga **Permissões** no menu. É preciso a permissão `roles:manage`: o OWNER sempre tem; o ADMIN padrão não tem, a menos que um OWNER a marque para ele.
- Você sabe **qual papel** vai mudar e **quantas pessoas** ele afeta. A tela mostra a contagem em cada coluna.
- Você tem uma conta de teste (ou uma pessoa de confiança) com esse papel para conferir depois. Ninguém altera o próprio papel no hub, então você não consegue "virar" um VIEWER para testar.
- A lista completa das 21 permissões está em [Papéis e permissões](/referencia/permissoes).

## Passo a passo

### 1. Abra a matriz

No menu, abra **Permissões**. A tabela **Matriz de permissões por papel** tem uma linha por permissão, com o texto em português e o código (por exemplo, `envvars:read`), agrupadas em **Catálogo**, **Variáveis de ambiente**, **Serviços** e **Administração**. As colunas são **Owner**, **Admin**, **Mantenedor** (MAINTAINER) e **Leitor** (VIEWER), cada uma com a quantidade de pessoas que têm o papel.

### 2. Entenda as travas

Nem toda caixa muda. Três regras protegem a instalação:

| Trava | Como aparece | Por quê |
|---|---|---|
| **OWNER é fixo** | A coluna **Owner** vem toda marcada e travada. | O OWNER sempre pode tudo, e a instalação nunca fica sem um (RN-26). |
| **Ver o catálogo é obrigatório** | `catalog:read` vem marcada e travada em todos os papéis. | Sem ela, ninguém entraria no hub (RN-27). |
| **Permissões administrativas só no Admin** | Nas colunas **Mantenedor** e **Leitor**, essas linhas aparecem com a caixa vazia e travada. | Gerenciar times, pessoas, configurações, auditoria, aparência e a própria matriz só cabe ao ADMIN (RN-28). |

Além disso, as permissões "do próprio time" (`envvars:edit`, `envvars:reveal`, `docs:edit`, `service:create`, `service:edit`, `spec:publish`, `token:manage`) só valem nos serviços dos times de que a pessoa participa. Só `service:edit_any` libera qualquer serviço (RN-22).

### 3. Faça o ajuste

Escolha um dos exemplos, ou combine.

#### Exemplo A: um Leitor que não vê variáveis de ambiente

Na coluna **Leitor**, desmarque `envvars:read` ("Ver variáveis (valores de segredos ficam ocultos)").

Efeito: na página de qualquer serviço, a aba **Variáveis de ambiente** mostra "Sem acesso às variáveis", e o download do `.env` deixa de funcionar para esses papéis. Por padrão, o Leitor enxerga os valores das variáveis comuns, e só os segredos ficam ocultos. Este ajuste é o caminho quando o hub tem terceiros ou pessoas de outras áreas com o papel VIEWER.

::: tip
Mantenha `envvars:read` junto com `envvars:edit` e `envvars:reveal` nos papéis que editam variáveis. Sem a leitura, a aba nem abre para a pessoa.
:::

#### Exemplo B: um Mantenedor que não gera tokens de CI

Na coluna **Mantenedor**, desmarque `token:manage` ("Gerar e revogar tokens de CI (próprio time)").

Efeito: quem tem o papel não gera nem revoga tokens de publicação, e a tentativa é recusada no servidor, mesmo que o formulário ainda apareça na aba **Tokens**. Os tokens que já existem continuam funcionando, porque pertencem ao serviço e não à pessoa. Só quem mantém o pipeline passa a gerar tokens (por exemplo, um ADMIN).

#### Exemplo C: um Admin que só audita

O papel **Admin** é o único que aceita permissões administrativas. Para montar um perfil de auditor, na coluna **Admin**:

- **Mantenha marcadas** `catalog:read` (travada), `audit:read` e, se quiser que a pessoa veja tudo, `catalog:read_private` e `graph:read`.
- **Desmarque** `team:manage`, `access:decide`, `user:manage` e `appearance:manage`. `settings:manage` e `roles:manage` já vêm desmarcadas no padrão.
- **Desmarque** as permissões de serviços e variáveis (`service:*`, `envvars:*`, `docs:edit`, `spec:publish`, `token:manage`, `link:edit`) para que a pessoa só leia.

Efeito: o menu dessas pessoas passa a ter **Catálogo**, **Mapa de ligações**, **Integrações externas** e **Auditoria**, incluindo a exportação em CSV.

::: warning Confira quem tem o papel antes de mudar
O exemplo C esvazia o ADMIN para todo mundo que o tem hoje. Se você usa ADMINs para aprovar pedidos ou gerenciar pessoas, deixe essas permissões marcadas e crie a separação de outro jeito, ou faça a administração com OWNERs. Em qualquer caso, mantenha pelo menos um OWNER ativo, que nunca perde permissão.
:::

### 4. Salve

Clique em **Salvar**. A matriz inteira é gravada de uma vez, e a tela responde "Permissões salvas. Valem a partir da próxima página que cada pessoa abrir." Ninguém precisa sair e entrar de novo.

O hub recusa combinações inválidas, com uma mensagem que diz qual papel e qual regra:

- "Ver o catálogo é obrigatório para todos os papéis."
- "Permissões administrativas só podem ser dadas a ADMIN: …"
- "Você não pode remover do seu próprio papel a permissão de editar a matriz." (quando você é ADMIN e desmarca `roles:manage` no seu próprio papel)

### 5. Confira com alguém daquele papel

Peça a uma pessoa do papel (ou convide uma conta de teste com esse papel, veja [Convidar por e-mail](/receitas/convidar-por-email)) que abra o hub e confirme:

- O **menu lateral** mostra só as telas esperadas. Telas administrativas sem permissão respondem 404 (RN-23).
- Nos exemplos: no A, a aba **Variáveis de ambiente** avisa que não há acesso; no B, gerar um token não funciona; no C, só a **Auditoria** aparece como tela administrativa.

Lembre que quem já abriu o tour guiado não o refaz por causa de uma mudança de permissão; quem ainda não o concluiu vê as telas do menu novo.

### 6. Volte ao padrão, se precisar

Clique em **Restaurar padrão** para apagar a matriz personalizada e voltar à original dos três papéis. A ação é imediata, sem pedir confirmação, e a tela responde "Permissões voltaram ao padrão."

### 7. Consulte o registro

Toda alteração vai para a **Auditoria**: "Matriz de permissões alterada" ou "Matriz de permissões restaurada ao padrão". Abra o registro para ver, por papel, o que foi adicionado e o que foi removido. A lista de tipos da tela não tem um grupo só para permissões; filtre por **Pessoa** e período.

## Como saber que deu certo

- A mensagem "Permissões salvas." aparece e, ao recarregar **Permissões**, a matriz mostra as caixas que você definiu.
- Uma pessoa do papel confirma o que enxerga, conforme o passo 5.
- A **Auditoria** tem o evento "Matriz de permissões alterada", com a lista de adicionadas e removidas.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| **Permissões** não aparece no menu | Você não tem `roles:manage`. Peça a um OWNER. |
| Não consigo marcar uma permissão administrativa em **Mantenedor** ou **Leitor** | É a trava do passo 2: elas só cabem ao **Admin**. |
| Não consigo desmarcar `catalog:read` | Também é trava: ver o catálogo é obrigatório. |
| Mudei e a pessoa ainda vê a tela antiga | A regra vale a partir da próxima página aberta. Peça que ela recarregue. |
| Uma pessoa perdeu uma tela e diz que "deu 404" | Esperado: rotas administrativas escondem que existem para quem não tem a permissão. |
| Desmarquei `envvars:read` e o Mantenedor perdeu a aba de variáveis | A aba exige `envvars:read`. Marque-a de novo para esse papel. |
| Restaurei o padrão sem querer | O hub não guarda a matriz anterior, mas o registro aberto na **Auditoria** lista o que mudou. Reaplique as marcações. |

## Veja também

- [Papéis e permissões](/referencia/permissoes): a tabela completa de permissões e o padrão de cada papel.
- [Permissões](/admin/permissoes): a tela por dentro.
- [Auditoria](/admin/auditoria): filtros e exportação.
- [Nova permissão](/contribuindo/guias/nova-permissao): para quem quer acrescentar uma permissão ao código.
