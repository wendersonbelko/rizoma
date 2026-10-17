---
description: "Como editar um serviço no Rizoma: dados, time, visibilidade, tipo, situação e tags; a origem da spec (CI, arquivo no repositório, URL ou importação manual) no mesmo formulário; arquivar e restaurar."
---

# Editar e arquivar serviços

A tela de edição de um serviço concentra o que muda ao longo da vida dele: nome, time, visibilidade, tipo, situação, tags, de onde vem a spec e o arquivamento. Esta página é para quem mantém serviços do próprio time e para quem administra o hub.

## Para que serve

Use a edição quando o serviço muda de dono, passa a ser restrito ao time, é marcado como descontinuado, troca a forma de publicar a spec ou sai de circulação. Cadastrar um serviço novo é tarefa do botão **Novo serviço**, na página **Serviços** (veja [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos)).

## Quem vê

| Ação | Permissão |
|---|---|
| Abrir a edição e alterar dados e origem da spec | Editar serviços do próprio time |
| Arquivar e restaurar | Arquivar e restaurar serviços |

Sem a permissão de editar qualquer serviço, você só edita serviços do time do qual participa; para os demais a tela responde "não encontrada". Por padrão, o Mantenedor edita o próprio time, e o Administrador e o Proprietário editam qualquer serviço. A zona de perigo (arquivar) e o painel de restaurar só aparecem para quem tem a permissão de arquivar (Administrador e Proprietário, por padrão). Veja o conceito de "próprio time" na [visão geral](/admin/).

Para abrir a tela, use o botão **Editar serviço** no cabeçalho da [página do serviço](/uso/servico), ou **Editar** na lista da página **Serviços**, no grupo **Cadastros** do menu. O endereço é `/services/<slug>/edit`.

## O que aparece na tela

![Tela Editar serviço, de uma versão anterior](/prints/10-editar-servico.png)

*De uma versão anterior, com os painéis em formulários separados. Hoje os dados e a origem da spec ficam num único formulário, com uma barra de salvar, como descrito abaixo.*

No topo, a trilha **Catálogo › nome do serviço › Editar** (os dois primeiros itens são links) e o título **Editar serviço**. Depois vêm dois painéis dentro do mesmo formulário, **Dados do serviço** e **Origem da spec**, e, no fim da página, a **Zona de perigo** com **Arquivar serviço** (ou o painel **Serviço arquivado**, se ele já foi arquivado).

### Salvar: uma barra para tudo

Os dois painéis são **um formulário só**. Enquanto você não mexe em nada, não há botão de salvar. Na primeira mudança, aparece uma barra fixa no pé da tela com **Alterações não salvas**, **Descartar** e **Salvar alterações**:

- **Salvar alterações** grava os dados e a origem da spec juntos: entram os dois ou nenhum.
- **Descartar** volta os campos ao que está salvo.
- Se você tentar sair com mudanças pendentes (fechar a aba ou clicar num link do hub), o navegador pergunta "Você tem alterações não salvas. Se sair desta página, elas se perdem. Sair mesmo assim?".
- Se algo der errado, a mensagem aparece na própria barra, e os campos continuam como você os deixou.

Depois de salvar, a barra some e um aviso **Alterações salvas** aparece no alto da tela por alguns segundos, com o resultado da gravação do `hub.json` no repositório, quando há. A mudança fica na [Auditoria](/admin/auditoria), com os campos alterados e os valores de antes e depois; a origem da spec entra sem nenhum cabeçalho ou credencial.

### Dados do serviço

| Campo | O que faz |
|---|---|
| **Nome do serviço** `*` | De 2 a 80 caracteres. |
| Endereço (slug) | Aparece como texto pequeno abaixo do nome, `/services/pedidos-api · editar endereço`. Clique em **editar endereço** para abrir o campo **Endereço**. Veja a regra abaixo. |
| **Descrição** | Até 500 caracteres; aparece no Catálogo e no cabeçalho do serviço. |
| **Time responsável** | O time dono do serviço. Quem pode editar qualquer serviço vê também **Sem time**; os demais precisam escolher um dos próprios times (o campo leva `*`). |
| **Quem pode ver** | **Toda a empresa** ou **Só o time responsável** (RN-30). |
| **Tipo** | **API**, **Frontend** ou **Worker**. |
| **Situação** | **Experimental**, **Em produção** ou **Descontinuado**. |
| **Tags** | Digite uma e clique em **+**. No máximo 10, de até 30 caracteres, em minúsculas. No cabeçalho do serviço, cada tag vira um link para o filtro do Catálogo. |

**Endereço imutável depois da primeira spec (RN-31).** Enquanto o serviço não publicou nenhuma spec, você pode ajustar o endereço. Depois da primeira spec, o link **editar endereço** some e o texto "O endereço fica fixo porque o serviço já publicou spec e outros serviços podem depender dele." toma o lugar. O endereço vira parte de URLs, de dependências declaradas em outras specs (`x-api-hub.dependsOn`) e de integrações no CI, então mudá-lo quebraria essas referências. Se você trocar o endereço antes da primeira spec, o hub abre a edição no endereço novo, e os links antigos deixam de funcionar. Se o endereço já existir, o campo mostra "Já existe um serviço com esse endereço. Escolha outro."

**Time (RN-33).** Um serviço tem no máximo um time. Sem a permissão de editar qualquer serviço, ele não sai do seu time nem vai para um time do qual você não faz parte ("Escolha um dos seus times como responsável.").

**Situação.** É uma informação de ciclo de vida:

| Situação | Efeito |
|---|---|
| **Experimental** | Selo de atenção no Catálogo. |
| **Em produção** | O padrão. Não ganha selo no Catálogo. |
| **Descontinuado** | Selo vermelho no Catálogo e no cabeçalho do serviço. A documentação continua disponível. |

**Visibilidade (RN-30).** Com **Só o time responsável**, o serviço some do Catálogo, do mapa e de qualquer URL para quem não é do time e não tem a permissão de ver serviços restritos de outros times.

## Origem da spec

O painel **Origem da spec** define como a spec chega ao hub. Cada serviço escolhe uma origem (RN-93). As quatro aparecem como cartões lado a lado, com uma frase de ajuda cada; clique no cartão para escolher:

| Origem | Como funciona |
|---|---|
| **Enviada pelo CI** (padrão) | O pipeline publica a spec a cada deploy, com um token de CI. O ambiente vem da branch. |
| **Arquivo no repositório** | O hub lê o arquivo (por exemplo, `openapi.yaml`) na branch de leitura de cada ambiente. |
| **Lida de uma URL** | O hub busca a spec numa URL; `{env}` na URL vira o identificador do ambiente. |
| **Importação manual** | Alguém do time envia o JSON ou YAML pela tela. |

Escolha a origem, preencha os campos que aparecem e clique em **Salvar alterações**, na barra do pé da tela. Quem chega pelo botão **Alterar origem** da aba **Configurações** do serviço, ou pela checklist, cai direto neste painel (`#spec-source`).

### Enviada pelo CI

Sem campos extras. Se você pode gerar tokens, o painel mostra "O pipeline precisa de um token." com o link **Gerar token de CI**, que abre o modal **Novo token de CI** com este serviço já escolhido (veja a página **Tokens de CI**, em [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos)). Os passos do pipeline estão em [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions) e em [Publicar pelo GitLab CI](/receitas/publicar-pelo-gitlab-ci).

### Arquivo no repositório

| Campo | Como preencher |
|---|---|
| **Repositório** `*` | Um repositório cadastrado (GitHub, GitLab ou Bitbucket). Os que estão em provedores sem integração configurada aparecem desabilitados. Se nenhuma integração existir, o campo pede que você fale com quem administra em **Configurações**. |
| **Caminho do arquivo** `*` | O caminho dentro do repositório. Vem preenchido com `openapi.yaml`. Aceita letras, números, `.`, `_`, `-` e `/`, até 300 caracteres. |

A **branch de leitura** vem de cada ambiente, em [Configurações](/admin/configuracoes) (aba **Ambientes e sessões**, em **Avançado** dentro de cada ambiente). Se um ambiente não tiver branch de leitura, a sincronização dele falha com o aviso de que ela não está configurada. Repositórios do tipo **Outro** não aparecem na lista, porque não permitem leitura direta: para eles, use URL, CI ou importação. Veja [Ler a spec do repositório](/receitas/spec-do-repositorio).

### Lida de uma URL

| Campo | Como preencher |
|---|---|
| **URL da spec** `*` | Um endereço `http` ou `https`. Use `{env}` para o ambiente: `https://pedidos.{env}.suaempresa.internal/openapi.json`. |
| **Cabeçalhos (JSON)** | Em **Detalhes opcionais** (**cabeçalhos da requisição**). Um objeto JSON com valores em texto, como `{"Authorization": "Bearer ..."}`. Ficam cifrados. Se já há cabeçalhos salvos, o campo avisa e, deixado em branco, mantém os atuais. |

O hub protege a leitura contra SSRF (RN-94): bloqueia `localhost`, endereços de loopback, endereços link-local e o serviço de metadados de nuvem; redes privadas são permitidas, já que serviços internos são o caso de uso. A leitura tem limite de 5 MB e de tempo, e o hub não segue redirecionamentos. Veja [Ler a spec de uma URL](/receitas/spec-por-url).

Se você trocar a origem para uma diferente de **Lida de uma URL**, os cabeçalhos salvos são apagados.

### Importação manual

Sem campos extras. A spec é enviada pelo botão **Publicar spec** da aba **Configurações** do serviço. Veja [Importar a spec manualmente](/receitas/importar-spec-manualmente).

### Sincronizar

Nas origens **Arquivo no repositório** e **Lida de uma URL**, o botão **Sincronizar agora**, ao lado de **Publicar spec** na aba **Configurações** do serviço, busca a spec de cada ambiente na hora, para quem pode publicar specs no serviço. Um cron também pode chamar `POST /api/v1/sync`, com o token gerado em **Configurações → Conexões** (bloco **Sincronização agendada**, em **Avançado**), para atualizar todos os serviços com essas origens (RN-95). O cabeçalho do serviço mostra "Sincronizada" com o tempo decorrido e o erro da última tentativa, se houve. A última publicação também mostra um resumo do que mudou em relação à versão anterior.

### Quando a versão não veio da origem configurada

Se a versão atual de um ambiente chegou por um caminho diferente do configurado, a aba **Documentação da API** do serviço avisa "Esta versão não veio do CI", "do repositório", "da URL configurada" ou "da importação manual", conforme a origem configurada, com o botão **Ver origem**. Ele leva à aba **Configurações** do serviço (`?tab=config`), onde o painel **Origem da spec** tem o botão **Alterar origem**, que volta a esta tela.

## Arquivar e restaurar

### Arquivar um serviço

A **Zona de perigo**, com a ação **Arquivar serviço**, só aparece para quem tem a permissão de arquivar. A descrição explica o efeito: o serviço "sai do catálogo e do mapa", os tokens de CI são revogados, o histórico de specs é mantido e dá para restaurar depois (os tokens continuam revogados). Se outros serviços apontam para ele, a descrição avisa quantos ("Atenção: 2 vínculos de outros serviços apontam para este.").

1. Abra **Editar serviço** do serviço a arquivar.
2. Na **Zona de perigo**, clique em **Arquivar serviço**.
3. No modal **Arquivar serviço**, leia o efeito e clique em **Arquivar serviço** de novo para confirmar. Como é reversível, o hub não pede para digitar o nome.

O hub leva você de volta à página **Serviços**, em `/admin/services`.

O que acontece (RN-32):

- o serviço deixa de aparecer no Catálogo e no mapa;
- todos os tokens dele são revogados, e o CI passa a receber 401;
- as specs publicadas continuam guardadas;
- o serviço continua na lista da página **Serviços**, com o selo "Arquivado em" e a data, para quem pode gerenciá-lo.

Ações irreversíveis em outras telas pedem para digitar o nome ou uma palavra; arquivar não, porque dá para desfazer.

### Restaurar um serviço

1. Na página **Serviços**, clique em **Restaurar** no serviço arquivado (ou abra **Editar serviço** por ele).
2. No painel **Serviço arquivado**, clique em **Restaurar serviço**.

Restaurar não é destrutivo: o botão fica fora da zona de perigo e não pede confirmação. O serviço volta ao Catálogo e ao mapa, e o hub abre a página dele.

::: warning Restaurar não reativa os tokens
Os tokens revogados no arquivamento continuam revogados. Gere um token novo na página **Tokens de CI** e atualize o segredo no CI do serviço.
:::

## Regras importantes

- **Endereço/slug (RN-31).** É único e imutável depois que o serviço tem spec publicada.
- **Arquivar (RN-32).** Só quem tem a permissão de arquivar. Tira do catálogo e do mapa, revoga tokens e mantém o histórico. Restaurar não reativa tokens.
- **Um time por serviço (RN-33).** Sem a permissão de editar qualquer serviço, o serviço não sai do seu time.
- **Visibilidade (RN-30).** Serviço restrito ao time some para quem está fora dele.
- **Origem da spec (RN-93 a RN-95).** Uma origem por serviço; leitura por URL protegida contra SSRF; sincronização manual ou por cron.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos): tokens, vínculos e o Novo serviço em um passo.
- [Tirar o /docs público do ar](/receitas/tirar-docs-do-ar): deixe o hub como única vitrine das specs.
- [Times](/admin/times): mude o time responsável criando ou ajustando times.
