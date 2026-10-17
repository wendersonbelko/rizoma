---
description: Definições curtas dos termos usados na documentação e na interface do Rizoma.
---

# Glossário

Definições de uma linha. O contexto de cada termo está em [Conceitos principais](/guia/conceitos).

**Ambiente.** Estágio da API (desenvolvimento, homologação, produção ou o nome que você der). Specs e variáveis são separadas por ambiente.

**Auditoria.** Registro de quem fez uma ação administrativa, quando e sobre o quê. Não guarda valor de segredo.

**Branch de leitura.** Branch que o hub usa ao buscar a spec de um arquivo no repositório, para aquele ambiente.

**Checksum.** Impressão da spec normalizada. A mesma impressão no mesmo ambiente não gera versão nova.

**Cifra.** AES-256-GCM com a `ENCRYPTION_KEY`. Usada no que o hub precisa ler de volta (segredos, client secrets, tokens de repositório).

**Instalação.** A configuração única da empresa neste hub: nome, vínculo com a empresa, regras de acesso e marca. O identificador curto não muda depois de concluir o assistente.

**Integração externa.** Dependência que não é um serviço do catálogo: API de terceiro, fila, tópico, webhook, banco, cache, armazenamento ou e-mail. É cadastrada em **Integrações externas** e ligada ao serviço por um vínculo, com uma relação (por exemplo, "publica em").

**Marca.** Nome do sistema e cor de destaque, definidos por quem administra em **Configurações → Aparência**. Valem para todas as pessoas.

**Mapa.** Grafo de serviços, repositórios, times e integrações. Abre em foco num item, com alcance de 1º grau, 2º grau ou tudo. Também existe como tabela.

**Origem da spec.** De onde a spec daquele serviço vem: **Enviada pelo CI**, **Arquivo no repositório**, **Lida de uma URL** ou **Importação manual**.

**Papel.** Proprietário (`OWNER`), Administrador (`ADMIN`), Mantenedor (`MAINTAINER`) ou Leitor (`VIEWER`). Define o conjunto de permissões da pessoa. As telas mostram o nome em português; o código aparece em textos técnicos, como a linha de comando e o banco.

**Permissão.** Uma ação nomeada, como `envvars:reveal`. Há 21. A matriz diz quais cada papel tem.

**Regra de branch.** Padrão (`main`, `release/*`, `feature/**`) que associa uma branch a um ambiente. Vale a primeira regra que casar, na ordem dos ambientes.

**Regras de negócio (do hub).** As regras RN desta documentação, sobre o comportamento do produto.

**Regras de negócio (do serviço).** Páginas Markdown que o time escreve sobre a API dele. Valem para todos os ambientes.

**Repositório.** Projeto no GitHub, GitLab, Bitbucket ou uma URL ("Outro"), ligado a serviços com um papel: código-fonte, SDK cliente, infraestrutura ou contrato.

**Segredo.** Variável marcada como sensível. O valor fica cifrado, não aparece na tela e revelá-lo exige permissão e gera auditoria.

**Serviço.** A unidade do catálogo: uma API, com dono, spec, variáveis e ligações. O slug aparece na URL (`/services/pedidos-api`).

**Slug.** Identificador curto em minúsculas, números e hífen, também chamado de endereço nas telas. O do serviço congela depois da primeira spec publicada.

**Solicitação de acesso.** Estado de quem entrou e ainda não foi liberado. A pessoa vê uma tela de espera e pode explicar quem é e por que precisa de acesso. Quem tem permissão decide em **Pessoas e acesso**.

**Spec.** Arquivo OpenAPI 3.x ou Swagger 2.0 que descreve a API. Até 5 MB.

**Status da pessoa.** Aguardando, ativo, suspenso ou recusado.

**Tema.** Claro, Escuro ou Sistema (segue o sistema operacional). Cada pessoa escolhe o seu no menu da conta, no pé da barra lateral.

**Time.** Grupo de pessoas responsável por serviços. A pessoa participa como líder ou membro. O time não tem permissões próprias.

**Token de publicação.** Também chamado de token de CI (página **Tokens de CI**). Credencial `ahub_…` que o CI usa para enviar a spec de um serviço. Mostrada uma vez. O banco guarda o hash.

**Variável.** Par `NOME=valor` de um serviço em um ambiente.

**Versão.** Uma spec recebida, guardada por serviço e por ambiente. O nome vem de `info.version`. As 20 anteriores à atual ficam navegáveis.

**Vínculo (ligação).** Relação entre dois serviços, entre serviço e repositório, entre dois repositórios ou entre um serviço e uma integração externa, desenhada no mapa. Cria-se em **Vínculos** (a integração externa se liga pela aba **Integrações** do serviço). Não é o mesmo que vínculo com a empresa.

**Vínculo com a empresa.** Prova de que a pessoa é da organização: organização do GitHub, domínio de e-mail ou diretório Microsoft.

**Visibilidade.** **Toda a empresa** ou **Só o time responsável**. No segundo caso, quem está fora não vê o serviço.
