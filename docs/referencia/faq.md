---
description: Respostas curtas sobre o que o Rizoma é, como as pessoas entram, de onde vem a spec e o que ele deliberadamente não faz.
---

# Perguntas frequentes

## O que é o Rizoma?

Um catálogo fechado das APIs da empresa. Ele reúne a spec OpenAPI ou Swagger de cada serviço, por ambiente, com login, times, integrações, variáveis e o mapa de quem depende de quem. Você instala no seu servidor. Veja [O que é o Rizoma](/guia/o-que-e).

## Ele substitui o API gateway?

Não. O hub não recebe o tráfego das suas APIs, não autentica chamadas e não limita o uso delas. Ele guarda e mostra o contrato.

## Dá para testar a requisição na documentação?

Não. O renderizador sobe sem "testar requisição", telemetria e assistente. Uma chamada de teste sairia do navegador de quem lê, direto para os servidores da spec. As chamadas continuam nas ferramentas de sempre.

## Ele gera a spec?

Não. O serviço ou o pipeline gera. O hub valida, versiona e exibe. Formatos aceitos: OpenAPI 3.0, 3.1 e Swagger 2.0, em JSON ou YAML, até 5 MB.

## Preciso pagar ou pedir uma licença?

Não. O projeto é código aberto. Não há token de instalação: quem alcança a URL do servidor pode concluir o assistente, por isso deixe essa URL fora de redes públicas até terminar.

## Quantas empresas cabem numa instalação?

Uma. Não é multiempresa. Cada instalação tem a própria organização, os próprios provedores de login e o próprio banco.

## Como uma pessoa da empresa entra sem pedir nada?

Ela entra com uma forma de login que comprova vínculo (GitHub de uma organização aceita, ou e-mail verificado de um domínio aceito) e a liberação automática está ligada. O papel inicial é Leitor. O passo a passo está em [Acesso automático](/receitas/acesso-automatico-pela-organizacao).

## Facebook ou e-mail com senha comprovam que a pessoa é da empresa?

Não. Essas formas só entram por convite ou por aprovação. Veja [Convidar por e-mail](/receitas/convidar-por-email).

## O hub manda o e-mail do convite?

Com SMTP salvo em **Configurações → Conexões** (bloco **E-mail**), sim: o hub envia o link e ainda o mostra para copiar. Sem SMTP, quem administra copia o link e envia pelo canal da empresa. O mesmo vale para o link de nova senha. O aviso de contrato quebrado, quando o SMTP está salvo, vai para os Proprietários e Administradores ativos, para o time do serviço e para os times que dependem dele.

## Onde publico a spec?

O caminho recomendado é o CI: `POST /api/v1/specs` com um token `ahub_`. Também dá para ler um arquivo do repositório, uma URL interna ou importar pela tela. Veja [Do zero ao primeiro serviço](/receitas/primeiro-servico).

## Por que a mesma spec não criou uma versão nova?

O hub compara um checksum. Reenviar o mesmo conteúdo no mesmo ambiente responde `unchanged` e não cria versão.

## Posso usar MySQL?

Não hoje. O modelo usa listas e JSON do PostgreSQL. MySQL, SQLite e SQL Server aparecem no assistente como "Em breve". Veja o [roadmap](/arquitetura/roadmap).

## Posso subir várias instâncias atrás de um balanceador?

O aplicativo sobe, mas o limite de publicações e de tentativas de login é em memória, por processo. Com mais de uma instância cada uma conta separado. O desenho atual é uma instância.

## Perdi o acesso de todos os administradores. E agora?

No servidor, `pnpm admin:recover --login usuario-ou-email`. O comando pede confirmação. Quem já entrou vira Proprietário na hora. Veja [Recuperação de OWNER](/admin/recuperacao-de-owner).

## Como troco entre o tema claro e o escuro?

Clique no seu nome, no pé da barra lateral, e escolha **Claro**, **Escuro** ou **Sistema** em **Aparência**. A escolha é só sua e vale em qualquer aparelho. Quem administra define apenas o nome do sistema e a cor de destaque, em **Configurações → Aparência**.

## Como acho um serviço ou uma tela rápido?

Aperte **Ctrl+K** (**⌘K** no Mac) ou clique em **Buscar**, na barra lateral. A busca leva às telas do menu, acha serviços por nome, endereço (slug), descrição ou endpoint (por exemplo, `GET /pedidos`) e abre os cadastros que você pode criar. O botão **+ Novo** tem os mesmos atalhos de criação.

## Troquei a `ENCRYPTION_KEY` e os segredos sumiram. Dá para recuperar?

Não com a chave nova. Os valores foram cifrados com a chave antiga. Restaure a chave do cofre ou o backup que foi feito junto com ela.

## Onde está o código de cada regra?

Em [Regras de negócio](/referencia/regras-de-negocio), com o código RN. As páginas Markdown de um serviço são outra coisa: o texto que o time escreve sobre a API dele.
