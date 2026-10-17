---
description: "A página de um serviço no Rizoma: cabeçalho com tags, selo Rascunho e próximos passos, seletor de ambiente, aviso de origem da spec, edição em formulário único e as abas de documentação, regras, integrações, variáveis e configurações."
---

# Página do serviço

Cada serviço do catálogo tem uma página própria, com tudo o que a equipe precisa saber sobre ele: quem cuida, de onde vem a spec, a documentação da API por ambiente, as regras de negócio, as integrações e as variáveis de ambiente. Esta página descreve cada parte dela e é para quem consulta ou mantém um serviço.

## Para que serve

A página também mostra os **canais** que o sistema oferece (HTTP, gRPC, WebSocket), o resumo da última publicação, a comparação com outro ambiente e o `hub.json` gerado para o repositório. Frontend e worker não precisam de spec OpenAPI: a aba de documentação lista os endpoints que eles chamam. Veja [hub.json do repositório](/receitas/hub-json).

## Quem vê

Quem tem a permissão de ver o catálogo e enxerga o serviço (RN-30):

- serviços com visibilidade **Toda a empresa** abrem para qualquer pessoa ativa;
- serviços com **Só o time responsável** abrem apenas para o time e para quem vê serviços restritos de outros times; para os demais a página responde "não encontrada";
- serviços **arquivados** só abrem para quem pode gerenciá-los.

O que cada pessoa faz dentro da página depende do papel e do time. As ações de edição valem para serviços do **próprio time**, a menos que a pessoa tenha a permissão de editar qualquer serviço. O selo **Rascunho** e os próximos passos aparecem só para quem gerencia o serviço. Veja [Papéis e permissões](/referencia/permissoes).

## O endereço da página

O endereço é `/services/<slug>`, por exemplo `/services/pedidos-api`. Três parâmetros controlam o que aparece:

| Parâmetro | Valores | Efeito |
|---|---|---|
| `env` | O identificador de um ambiente, como `hml` | Escolhe o ambiente. Sem ele, vale o ambiente de produção (ou o primeiro da lista). |
| `tab` | `api`, `rules`, `integrations`, `variables` ou `config` | Escolhe a aba. Sem ele, abre a **Documentação da API**. |
| `compare` | O identificador de outro ambiente | Compara a spec atual deste ambiente com a daquele. |

Se você abrir um endereço com um `env` ou `tab` inválido (por exemplo, um link salvo errado), o hub corrige a URL para o que está sendo mostrado. Os valores antigos de `tab` em português (`regras`, `integracoes` e `variaveis`) continuam funcionando.

![Página de um serviço, com a documentação da API, de uma versão anterior da interface](/prints/05-servico-documentacao.png)

*A página de um serviço, numa versão anterior da interface. Hoje o cabeçalho tem o caminho Catálogo › nome e as tags, e a lista de endpoints fica ao lado do leitor.*

## O que aparece na tela

### Cabeçalho

O topo da página resume o serviço:

- o caminho **Catálogo › nome do serviço**. Clique em **Catálogo** para voltar à lista;
- o **nome** do serviço, seguido da **situação** (Experimental, Em produção ou Descontinuado) e, se for o caso, dos selos **Rascunho** e **Arquivado**;
- o botão **Editar serviço**, para quem pode gerenciá-lo (veja [Editar e arquivar serviços](/admin/editar-servico));
- a descrição;
- as **tags**, como pílulas com `#`. Cada tag leva ao [Catálogo](/uso/catalogo) já filtrado por ela (`/?tag=checkout`);
- três blocos: **Time**, **Repositórios** e **Origem da spec**.

| Bloco | O que mostra |
|---|---|
| **Time** | O nome do time responsável (ou "Sem responsável") e as pessoas do time. |
| **Repositórios** | Os repositórios ligados ao serviço, com link para o código no provedor. Sem nenhum, aparece **Vincular** (para quem pode gerenciar o serviço e editar vínculos), que abre o formulário **Novo vínculo** já com este serviço em **De**, ou "Nenhum". |
| **Origem da spec** | De onde vem a spec: **Enviada pelo CI**, **Arquivo no repositório**, **Lida de uma URL** ou **Importação manual**. Para as origens que o hub lê sozinho, mostra "Sincronizada" e há quanto tempo (passe o mouse para ver a data e a hora) e, se a última leitura falhou, o erro em vermelho. |

### Rascunho e próximos passos

Criar um serviço pede só nome, time e tipo. O resto (repositório, origem da spec, token) fica para depois, e a página lembra o que falta. Enquanto houver passo pendente, quem gerencia o serviço vê o selo **Rascunho** ao lado do nome e, abaixo do cabeçalho, o cartão **Próximos passos**, que diz "Faltam 3 passos para ele aparecer completo no catálogo e no mapa." (ou "Falta 1 passo ...").

| Passo | Quando fica feito | Botão |
|---|---|---|
| **Serviço criado** | Sempre. Mostra o time e a visibilidade. | Nenhum |
| **Vincular repositório** | Há um repositório com o papel **Código-fonte** ligado ao serviço. | **Vincular**: abre o **Novo vínculo** com este serviço em **De** |
| **Escolher como a spec chega** | Já existe uma spec publicada, em qualquer ambiente. | **Configurar**: leva à aba **Configurações** |
| **Gerar token de CI** | Há um token ativo (sem revogação e dentro da validade). Só aparece quando a origem é **Enviada pelo CI**. | **Gerar**: abre **Tokens de CI** com este serviço já escolhido |

O botão de um passo só aparece se você tem a permissão daquela tela; senão o passo diz "Peça a quem tem acesso a este cadastro.". Cada passo é opcional e reversível, e pode ser feito por quem tem a informação (repositório e CI costumam ser de outra pessoa). Quando não falta mais nada, o selo e o cartão somem. Quem não gerencia o serviço não vê nenhum dos dois, e um serviço arquivado também não.

### Situação do serviço

A situação é uma informação de ciclo de vida, definida na edição do serviço. Diferente do **Rascunho**, ela não some sozinha.

| Situação | Como aparece |
|---|---|
| **Em produção** | Selo ao lado do nome. No Catálogo, não ganha selo. |
| **Experimental** | Selo ao lado do nome e selo de atenção no Catálogo. |
| **Descontinuado** | Selo vermelho ao lado do nome e selo vermelho no Catálogo. |

Um serviço descontinuado continua com a documentação disponível, mas sinaliza para quem consome que deve migrar.

### Serviço arquivado

Quando um serviço é arquivado, o cabeçalho mostra **Arquivado** ao lado do nome. O serviço some do Catálogo e do mapa e seus tokens de publicação são revogados (RN-32), mas o histórico de specs continua guardado. Só quem pode gerenciá-lo abre a página, e é na tela de edição que a restauração acontece, pelo botão **Restaurar serviço**.

### Seletor de ambiente

Logo abaixo do cabeçalho há um botão para cada ambiente cadastrado (por exemplo, Desenvolvimento, Homologação e Produção). O ambiente atual fica destacado, e o de produção leva um escudo e a marca "prod". Ao lado há o seletor **Comparar**: escolha outro ambiente para ver quantos endpoints são novos, removidos, alterados ou descontinuados entre os dois. Se um dos dois ambientes não tem spec, o hub avisa "Os dois ambientes precisam ter spec publicada para comparar."

O ambiente vale para as abas **Documentação da API**, **Integrações** (que mostra o endereço da integração naquele ambiente), **Variáveis de ambiente** e **Configurações** (a spec publicada é a daquele ambiente). As **Regras de negócio** valem para todos os ambientes. Ao trocar de ambiente, você continua na mesma aba.

Quando a versão atual do ambiente tem mudanças em relação à anterior, a página mostra o aviso **O que mudou na versão X**, com os totais e alguns exemplos. Se a versão removeu endpoints, o título é **A versão X removeu endpoints**.

### As abas

As abas ficam logo abaixo do seletor. Cada uma tem uma chave na URL (`?tab=`), em inglês:

| Aba | Chave |
|---|---|
| **Documentação da API** | `api` |
| **Regras de negócio** | `rules` |
| **Integrações** | `integrations` |
| **Variáveis de ambiente** | `variables` |
| **Configurações** | `config` |

Trocar de aba limpa a versão, a página de regras e a edição que estavam abertas.

## Aba Documentação da API

Mostra a spec OpenAPI/Swagger publicada no ambiente escolhido. A tela tem duas partes: à esquerda, a lista **Endpoints**, agrupada por tag, com o campo **Buscar path ou resumo**; à direita, o leitor (Scalar) com o contrato do endpoint escolhido, com parâmetros, exemplos e respostas. O primeiro endpoint abre por padrão. Endpoints descontinuados levam a marca **Descontinuado** na lista.

O leitor segue o tema da sua conta: em **Escuro**, ele fica escuro; em **Sistema**, acompanha o seu aparelho; e a troca no menu da conta vale na hora, sem recarregar a página.

::: info Um leitor sem chamadas para fora
O hub é privado, então o leitor roda sem recursos que enviam dados para fora: não há "testar requisição", assistente de IA, compartilhamento nem telemetria (RN-S15). Os textos fixos do próprio leitor podem aparecer em inglês; o conteúdo vem da spec.
:::

Acima do leitor, uma faixa mostra "Contrato em" o ambiente. Em frontends e workers, a aba avisa que o sistema não precisa de spec e mostra com quem ele fala. Quando há chamadas entre serviços ou operações descontinuadas, pílulas acima da lista resumem, por exemplo, "Chama `GET /pedidos` em Estoque".

### Versões

Na mesma faixa ficam as versões publicadas naquele ambiente, da mais recente para a mais antiga (até 20). A versão atual leva a palavra **atual** (por exemplo, `2.4.0 atual`) e abre por padrão. Clique em outra para lê-la; passe o mouse para ver a data, a origem e a branch em que foi publicada.

Cada ambiente tem o seu histórico. Enviar de novo a mesma spec para o mesmo ambiente não cria uma versão nova (RN-42).

Se a versão nova remove um path ou um método, a página mostra "A versão X removeu endpoints". Com SMTP salvo, o hub também manda e-mail para Proprietário e Administrador ativos, para as pessoas ativas do time deste serviço e para as pessoas ativas dos times que o consomem ou que chamam o endpoint removido. Sem SMTP, o aviso fica só nesta página.

### Aviso de origem

Se a versão atual veio de um jeito diferente do configurado (por exemplo, você importou à mão um serviço configurado como "Enviada pelo CI"), um aviso amarelo explica: "Esta versão não veio do CI." A frase se ajusta à origem configurada: **do CI**, **do repositório**, **da URL configurada** ou **da importação manual**. Passe o mouse sobre ela para ver a explicação completa, com as duas origens. O botão **Ver origem** leva à aba **Configurações** (`?tab=config`), onde a origem aparece e pode ser alterada.

### Quando ainda não há spec

Se o ambiente não recebeu nenhuma spec, a aba mostra **Sem spec em** o ambiente, com a explicação conforme a origem configurada:

| Origem | O que a aba diz |
|---|---|
| **Enviada pelo CI** | O CI publica a spec quando uma branch daquele ambiente passa pelo pipeline. Há os botões **Como configurar o CI** (abre a documentação) e, para quem pode, **Gerar token de CI**, que abre **Tokens de CI** com este serviço escolhido. |
| **Arquivo no repositório** | A spec é lida do repositório, na branch de leitura do ambiente. O link **Sincronizar em Configurações** leva à aba **Configurações**. |
| **Lida de uma URL** | A spec é lida da URL configurada. O link **Sincronizar em Configurações** leva à aba **Configurações**. |
| **Importação manual** | O link **Publicar em Configurações** leva à aba **Configurações**. |

::: tip Spec inválida?
O hub aceita OpenAPI 3.0, 3.1 e Swagger 2.0, em JSON ou YAML, com até 5 MB, e a spec precisa ter `info` e `paths`, `webhooks` ou `components`. Se algo estiver errado, a mensagem de erro diz o que faltou.
:::

## Aba Regras de negócio

As páginas em Markdown que o time escreve sobre o serviço: o que ele faz, as regras que aplica e os pontos de atenção. Há uma lista de páginas à esquerda e o conteúdo à direita, e quem pode editar ganha os botões de criar, editar e excluir. As regras valem para todos os ambientes.

O detalhe completo está em [Regras de negócio](/uso/regras-de-negocio).

## Aba Integrações

Mostra como o serviço se liga ao resto do ecossistema.

**Canais** lista HTTP, gRPC e WebSocket que este sistema oferece, com o endereço de cada ambiente. Quem edita o serviço adiciona pelo botão **Novo canal** (um modal com **Protocolo** e **Nome**; o endereço de um ambiente fica em "Detalhes opcionais") e remove pelo **Remover** de cada canal, que tem **Desfazer** por alguns segundos. O HTTP da spec continua valendo mesmo sem um canal extra.

### Outros serviços do hub

O título é **Outros serviços do hub**, com a descrição "Vínculos entre este serviço e os demais." e três atalhos:

- **Ver no mapa**: abre o [Mapa de ligações](/uso/mapa) já em foco neste serviço;
- **Novo vínculo**: abre **Vínculos** com o formulário já aberto e este serviço em **De** (para quem pode editar o serviço e vínculos);
- **Registrar chamada**: abre um modal para dizer que este serviço chama um endpoint de outro (**Serviço chamado**, **Método** e **Caminho**). A chamada aparece na aba da API dos dois serviços.

A tabela tem:

| Coluna | O que mostra |
|---|---|
| **Direção** | **sai daqui** (este serviço depende do outro) ou **chega aqui** (o outro depende deste). |
| **Serviço** | O outro serviço, com link para a página dele no mesmo ambiente. |
| **Relação** | A frase do vínculo, por exemplo "este serviço consome a API de Estoque". |
| **Origem** | **declarado na spec** ou **manual**. Some em telas estreitas. |

Sem vínculos, aparece "Nenhum vínculo registrado". Os vínculos são criados em [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos), no [Mapa de ligações](/uso/mapa) ou pela própria spec, com `x-api-hub.dependsOn` (veja a [extensão x-api-hub](/referencia/extensao-x-api-hub)).

### Integrações externas

A seção **Integrações externas** lista as APIs de terceiros, filas, webhooks e bancos usados pelo serviço, com o endereço no ambiente escolhido. As colunas são:

| Coluna | O que mostra |
|---|---|
| **Integração** | O nome (link para o detalhe), o tipo, o provedor e a observação do vínculo. |
| **Relação** | Como este serviço usa a integração: consome, fornece, publica em, assina, lê de, grava em, envia ou recebe webhook. |
| **Endereço em** o ambiente | O endereço cadastrado para aquele ambiente, ou "não informado". |
| **Também usam** | Os outros serviços que usam a mesma integração, na frase "Pedidos publica em Fila pedido.criado". Some em telas estreitas. |

Quem pode editar o serviço vê o botão **Remover** em cada linha, que tem **Desfazer** por alguns segundos antes de a remoção valer, e os botões **PostgreSQL**, **RabbitMQ** e **Ligar integração**. Os dois primeiros são atalhos: cadastram a integração (se ela ainda não existe) e já a ligam ao serviço, com a relação mais comum (lê de, para o banco; publica em, para a fila; assina, se o serviço for um worker). **Ligar integração** abre o modal **Ligar integração externa**:

1. Escolha a **Integração** na lista, agrupada por tipo. Nada vem escolhido, a menos que só exista uma.
2. Escolha em **Este serviço…** a relação. O campo só abre depois de você escolher a integração, e as opções mudam com o tipo (RN-81): uma fila aceita "publica em" e "assina"; um banco aceita "lê de" e "grava em".
3. Se quiser, abra **Detalhes opcionais** e escreva uma **Observação** em Markdown, por exemplo "publica `pedido.criado` depois do pagamento aprovado".
4. Clique em **Ligar integração**. O modal fecha e a integração aparece na tabela.

Se você tentar repetir uma ligação que já existe, o modal avisa "Essa integração já está ligada a este serviço com essa relação." Se nenhuma integração existe ainda, o modal manda cadastrar uma em **Integrações externas**, e a tabela mostra "Nenhuma integração externa ligada". O cadastro da integração em si fica em [Integrações externas](/uso/integracoes).

As duas tabelas da aba têm paginação própria, com 10 linhas por página.

## Aba Variáveis de ambiente

Lista as variáveis do serviço no ambiente escolhido. Segredos ficam cifrados e só aparecem sob pedido, para quem tem permissão, e cada revelação fica registrada na auditoria. Quem pode editar cria, altera e exclui variáveis, copia chaves de outro ambiente e baixa o `.env` do ambiente.

O detalhe completo está em [Variáveis de ambiente](/uso/variaveis).

## Aba Configurações

Aqui ficam a origem da spec, a publicação da spec e o `hub.json`, fora da leitura do contrato. Os canais ficam em **Integrações**. A aba tem três cartões:

**Origem da spec** mostra a origem atual (por exemplo, **Enviada pelo CI**) e uma frase que explica como ela funciona. Quem pode gerenciar o serviço vê o botão **Alterar origem**, que leva à edição do serviço, na seção da origem. Quando a origem é o CI, há também o link **Gerar token de CI**. É para este cartão que o botão **Ver origem** do aviso e o passo **Configurar** dos próximos passos levam.

**Publicar spec** vale para o ambiente selecionado no topo, que aparece no canto do cartão. O botão **Publicar spec** abre o modal **Publicar spec em** o ambiente: quem pode publicar escolhe **Enviar arquivo** (JSON ou YAML, até 5 MB) ou **Colar conteúdo** e clica em **Publicar spec**. Se o conteúdo for idêntico a uma versão existente, o hub avisa "Essa spec já existia" e não cria outra. Serviços que leem de repositório ou URL também têm **Sincronizar agora**. Quem não pode publicar lê "Você não publica spec neste serviço."

**hub.json** mostra o arquivo gerado para a raiz do repositório, com o botão **Copiar**. **Sincronizar repositório** preenche descrição, tecnologias, README e o caminho da spec quando esses campos ainda estão vazios. Se o hub e o Git discordam, o conflito aparece no cartão **Conflitos com o repositório**, no alto da aba, e nada é sobrescrito. Se o token não grava sozinho, copie o `hub.json` dali.

## Editar o serviço

O botão **Editar serviço**, no cabeçalho, abre `/services/<slug>/edit`, com o caminho **Catálogo › nome › Editar**. Os dados e a origem da spec ficam num formulário só, com dois blocos: **Dados do serviço** (nome, endereço, descrição, time responsável, quem pode ver, tipo, situação e tags) e **Origem da spec** (as quatro formas de a spec chegar e os campos de cada uma).

Em vez de um botão de salvar por bloco, uma barra aparece no fim da tela quando você muda alguma coisa: "Alterações não salvas", com **Descartar** e **Salvar alterações**. Sem mudança, a barra some. Se você tentar sair com alteração pendente, o hub avisa. Um recado "Alterações salvas" confirma o resultado, inclusive se o `hub.json` foi gravado no repositório.

O endereço (slug) aparece como texto pequeno abaixo do nome, com o link **editar endereço**. Depois que o serviço publicou a primeira spec, o endereço fica fixo (RN-31), porque outros serviços podem depender dele.

No fim da página fica a **Zona de perigo**, para quem pode arquivar:

- **Arquivar serviço** abre uma confirmação (sem digitar nada, porque dá para restaurar). O serviço sai do catálogo e do mapa, e os tokens de CI são revogados. Se houver vínculos de outros serviços apontando para ele, a confirmação avisa quantos. Depois de arquivar, você volta para a lista **Serviços** em `/admin/services`.
- Num serviço arquivado, o cartão **Serviço arquivado** traz o botão **Restaurar serviço**, que devolve o serviço ao catálogo e ao mapa. Os tokens revogados continuam revogados: gere outros em **Tokens de CI**.

O passo a passo está em [Editar e arquivar serviços](/admin/editar-servico).

## Regras importantes

- **Visibilidade (RN-30).** Serviço restrito ao time não abre para quem está fora dele.
- **Ambiente por spec (RN-42, RN-46).** Cada ambiente guarda o próprio histórico de versões, e a mais recente é a padrão.
- **Origem da spec (RN-93).** Cada serviço escolhe uma origem: **Enviada pelo CI**, **Arquivo no repositório**, **Lida de uma URL** ou **Importação manual**. Ela se altera em **Editar serviço**.
- **Próprio time (RN-22).** Importar spec, editar regras, editar variáveis e ligar integrações valem para serviços dos times de que você participa, salvo quem pode editar qualquer serviço.
- **Arquivado (RN-32).** Some do catálogo e do mapa, revoga os tokens e mantém o histórico.

## Próximos passos

- [Regras de negócio](/uso/regras-de-negocio): escrever e ler as páginas do time.
- [Variáveis de ambiente](/uso/variaveis): segredos, revelar, `.env` e copiar entre ambientes.
- [Editar e arquivar serviços](/admin/editar-servico): mudar dados, origem da spec e situação.
- [Do zero ao primeiro serviço](/receitas/primeiro-servico): um passo a passo completo.
