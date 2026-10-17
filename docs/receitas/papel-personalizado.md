---
description: Ajuste a matriz de permissões dos papéis Administrador, Mantenedor e Leitor, com exemplos práticos, as travas que o hub impõe, como revisar e salvar, como conferir e como voltar ao padrão.
---

# Papel com permissões sob medida

O hub não deixa criar papéis novos: existem sempre quatro (Proprietário, Administrador, Mantenedor e Leitor). O que você pode fazer é editar a **matriz de permissões** de três deles e, assim, dar a cada papel exatamente o que a sua empresa precisa. Esta receita mostra três ajustes comuns, as travas que impedem erros graves, como conferir o resultado e como desfazer. É para quem tem permissão de editar a matriz.

::: info A matriz vale para todo mundo que tem o papel
Mudar a coluna **Leitor** muda o que **todos** os leitores podem fazer. Não há exceção por pessoa. Se você precisa de um perfil diferente do padrão para poucas pessoas, o caminho é ajustar a coluna de um papel que só elas usam, ou combinar papel com visibilidade dos serviços (veja [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros)).
:::

## Antes de começar

- Você enxerga **Permissões** no menu (grupo **Pessoas**). É preciso a permissão `roles:manage`: o Proprietário sempre tem; o Administrador padrão não tem, a menos que um Proprietário a marque para ele.
- Você sabe **qual papel** vai mudar e **quantas pessoas** ele afeta. A tela mostra a contagem em cada coluna.
- Você tem uma conta de teste (ou uma pessoa de confiança) com esse papel para conferir depois. Ninguém altera o próprio papel no hub, então você não consegue "virar" um Leitor para testar.
- A lista completa das 21 permissões está em [Papéis e permissões](/referencia/permissoes). A matriz mostra só o texto de cada permissão; o código (por exemplo, `envvars:read`) aparece aqui entre parênteses para você achar a linha certa.

## Passo a passo

### 1. Abra a matriz

No menu, abra **Permissões**. A tabela **Matriz de permissões por papel** tem uma linha por permissão, com o texto em português, agrupadas em **Catálogo**, **Variáveis de ambiente**, **Serviços** e **Administração**. Cada grupo se recolhe com um clique, e **Recolher grupos** fecha todos de uma vez. As colunas são **Proprietário**, **Administrador**, **Mantenedor** e **Leitor**, cada uma com a quantidade de pessoas ativas que têm o papel. Ao passar o mouse, a linha e a coluna da célula ficam destacadas.

### 2. Entenda as travas

Nem toda caixa muda. Três regras protegem a instalação:

| Trava | Como aparece | Por quê |
|---|---|---|
| **O Proprietário é fixo** | A coluna **Proprietário** vem toda preenchida, com um visto, e travada. | O Proprietário sempre pode tudo, e a instalação nunca fica sem um (RN-26). |
| **Ver o catálogo é obrigatório** | "Ver catálogo, documentação e regras de negócio" (`catalog:read`) vem preenchida e travada em todos os papéis. | Sem ela, ninguém entraria no hub (RN-27). |
| **Permissões administrativas só no Administrador** | Nas colunas **Mantenedor** e **Leitor**, essas linhas aparecem com um traço (—) esmaecido, sem caixa. | Gerenciar times, pessoas, configurações, auditoria, aparência e a própria matriz só cabe ao Administrador (RN-28). |

Além disso, as permissões "do próprio time" (`envvars:edit`, `envvars:reveal`, `docs:edit`, `service:create`, `service:edit`, `spec:publish`, `token:manage`) só valem nos serviços dos times de que a pessoa participa. Só `service:edit_any` libera qualquer serviço (RN-22).

### 3. Faça o ajuste

Escolha um dos exemplos, ou combine. Cada caixa que você muda ganha um halo âmbar, e nada é gravado ainda.

#### Exemplo A: um Leitor que não vê variáveis de ambiente

Na coluna **Leitor**, desmarque "Ver variáveis (valores de segredos ficam ocultos)" (`envvars:read`).

Efeito: na página de qualquer serviço, a aba **Variáveis de ambiente** mostra "Sem acesso às variáveis", e o download do `.env` deixa de funcionar para esse papel. Por padrão, o Leitor enxerga os valores das variáveis comuns, e só os segredos ficam ocultos. Este ajuste é o caminho quando o hub tem terceiros ou pessoas de outras áreas com o papel Leitor.

::: tip
Mantenha `envvars:read` junto com `envvars:edit` e `envvars:reveal` nos papéis que editam variáveis. Sem a leitura, a aba nem abre para a pessoa.
:::

#### Exemplo B: um Mantenedor que não gera tokens de CI

Na coluna **Mantenedor**, desmarque "Gerar e revogar tokens de CI (próprio time)" (`token:manage`).

Efeito: o item **Tokens de CI** sai do menu desse papel, e a tentativa de gerar ou revogar um token é recusada no servidor, mesmo por um endereço digitado à mão. Os tokens que já existem continuam funcionando, porque pertencem ao serviço e não à pessoa. Só quem mantém o pipeline passa a gerar tokens (por exemplo, um Administrador).

#### Exemplo C: um Administrador que só audita

O papel **Administrador** é o único que aceita permissões administrativas. Para montar um perfil de auditor, na coluna **Administrador**:

- **Mantenha marcadas** "Ver catálogo, documentação e regras de negócio" (travada), "Ver e exportar a auditoria" (`audit:read`) e, se quiser que a pessoa veja tudo, "Ver serviços restritos de outros times" (`catalog:read_private`) e "Ver o mapa de ligações" (`graph:read`).
- **Desmarque** `team:manage`, `access:decide`, `user:manage` e `appearance:manage` ("Criar times e gerenciar membros", "Aprovar e recusar pedidos de acesso", "Convidar pessoas, mudar papéis e suspender" e "Mudar título e tema do sistema"). "Configurações: login, ambientes, repositórios e regras de acesso" (`settings:manage`) e "Editar esta matriz de permissões" (`roles:manage`) já vêm desmarcadas no padrão.
- **Desmarque** as permissões de serviços e variáveis (`service:*`, `envvars:*`, `docs:edit`, `spec:publish`, `token:manage`, `link:edit`) para que a pessoa só leia.

Efeito: o menu dessas pessoas passa a ter **Catálogo**, **Mapa de ligações**, **Integrações externas** e **Auditoria**, incluindo a exportação em CSV. Os itens de **Cadastros**, **Pessoas** e **Configurações** deixam de aparecer.

::: warning Confira quem tem o papel antes de mudar
O exemplo C esvazia o Administrador para todo mundo que o tem hoje. Se você usa administradores para decidir solicitações de acesso ou gerenciar pessoas, deixe essas permissões marcadas e crie a separação de outro jeito, ou faça a administração com Proprietários. Em qualquer caso, mantenha pelo menos um Proprietário ativo, que nunca perde permissão.
:::

### 4. Revise e salve

Enquanto há mudanças, uma barra fixa no rodapé da tela mostra "N mudanças não salvas", com **Descartar** e **Revisar e salvar**. Clique em **Revisar e salvar**: o modal **Revisar mudanças** lista, por papel, o que ele ganha e o que perde, por exemplo "Leitor ganha: …" e "Mantenedor perde: …". Se algo não era o que você queria, clique em **Cancelar** e volte à matriz; **Descartar** na barra desfaz tudo de uma vez.

Conferiu? Clique em **Salvar N mudanças**. A matriz inteira é gravada de uma vez, e a tela responde "Permissões salvas. Valem a partir da próxima página que cada pessoa abrir." Ninguém precisa sair e entrar de novo.

O hub recusa combinações inválidas, com uma mensagem que diz qual regra foi violada, no rodapé do modal:

- "Ver o catálogo é obrigatório para todos os papéis."
- "Permissões administrativas só podem ser dadas a Administrador: …"
- "Você não pode remover do seu próprio papel a permissão de editar a matriz." (quando você é Administrador e desmarca "Editar esta matriz de permissões" no seu próprio papel)

### 5. Confira com alguém daquele papel

Peça a uma pessoa do papel (ou convide uma conta de teste com esse papel, veja [Convidar por e-mail](/receitas/convidar-por-email)) que abra o hub e confirme:

- O **menu lateral** mostra só as telas esperadas. Telas administrativas sem permissão respondem 404 (RN-23).
- Nos exemplos: no A, a aba **Variáveis de ambiente** avisa que não há acesso; no B, o item **Tokens de CI** não aparece; no C, só a **Auditoria** aparece como tela administrativa.

Lembre que quem já concluiu o tour guiado não o refaz por causa de uma mudança de permissão. Cada tela tem o próprio tour, pelo botão **?**.

### 6. Volte ao padrão, se precisar

Role até o fim da página, até a **Zona de perigo**, e clique em **Restaurar padrão**. Um modal confirma ("Volta a matriz ao padrão de cada papel e descarta tudo o que foi personalizado…"): clique em **Restaurar padrão** de novo. A matriz volta à original dos três papéis, sem digitar nada.

### 7. Consulte o registro

Toda alteração vai para a **Auditoria**, no tipo de evento **Permissões**: "alterou a matriz de permissões (N mudanças)" ou "restaurou a matriz de permissões ao padrão". Abra **Detalhes** para ver, por papel, o que foi adicionado e o que foi removido.

## Como saber que deu certo

- A mensagem "Permissões salvas." aparece e, ao recarregar **Permissões**, a matriz mostra as caixas que você definiu, sem barra de mudanças.
- Uma pessoa do papel confirma o que enxerga, conforme o passo 5.
- A **Auditoria** tem o evento "alterou a matriz de permissões", com a lista de adicionadas e removidas em **Detalhes**.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| **Permissões** não aparece no menu | Você não tem `roles:manage`. Peça a um Proprietário. |
| Não consigo marcar uma permissão administrativa em **Mantenedor** ou **Leitor** | É a trava do passo 2: elas só cabem ao **Administrador**, e nesses papéis a linha mostra só o traço (—). |
| Não consigo desmarcar "Ver catálogo, documentação e regras de negócio" | Também é trava: ver o catálogo é obrigatório. |
| Marquei caixas, saí da tela e a matriz voltou ao que era | A matriz só grava com **Revisar e salvar**. As mudanças da barra "N mudanças não salvas" se perdem ao sair da página. |
| Mudei e a pessoa ainda vê a tela antiga | A regra vale a partir da próxima página aberta. Peça que ela recarregue. |
| Uma pessoa perdeu uma tela e diz que "deu 404" | Esperado: rotas administrativas escondem que existem para quem não tem a permissão. |
| Desmarquei `envvars:read` e o Mantenedor perdeu a aba de variáveis | A aba exige `envvars:read`. Marque-a de novo para esse papel. |
| Restaurei o padrão sem querer | O hub não guarda a matriz anterior. Os registros "alterou a matriz de permissões" na **Auditoria** listam, por papel, o que cada salvamento adicionou e removeu: use-os para reaplicar as marcações. |

## Veja também

- [Papéis e permissões](/referencia/permissoes): a tabela completa de permissões e o padrão de cada papel.
- [Permissões](/admin/permissoes): a tela por dentro.
- [Auditoria](/admin/auditoria): filtros e exportação.
- [Nova permissão](/contribuindo/guias/nova-permissao): para quem quer acrescentar uma permissão ao código.
