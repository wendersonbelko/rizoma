---
description: O arquivo hub.json na raiz do repositório descreve tipo, canais e ligações do sistema. O hub lê esse arquivo e, ao salvar na tela, gera ou grava a versão nova.
---

# hub.json do repositório

O `hub.json` na raiz do repositório de código-fonte é a fonte da verdade das ligações daquele sistema: tipo, canais, quem ele consome e quais recursos usa (banco, RabbitMQ e os demais).

## Antes de começar

- O repositório está ligado ao sistema com o papel **Código-fonte**.
- A integração do provedor está em **Configurações → Conexões** (bloco **Repositórios**), com token de leitura.
- Para o hub gravar o arquivo sozinho, esse token também precisa poder escrever. Senha e token não entram no arquivo.

## Passo a passo

1. Crie `hub.json` na raiz, na branch padrão. Um exemplo de frontend:

```json
{
  "slug": "loja-web",
  "kind": "frontend",
  "channels": [{ "protocol": "websocket", "name": "Ao vivo", "addresses": { "prod": "wss://loja.exemplo/ws" } }],
  "consumes": [{ "service": "pedidos", "protocol": "http", "calls": [{ "method": "GET", "path": "/pedidos" }] }],
  "resources": [{ "name": "Fila de pedidos", "kind": "queue", "provider": "RabbitMQ", "relation": "publishes" }]
}
```

2. Na aba **Configurações** da página do sistema, use **Sincronizar repositório** (o botão fica junto do painel **hub.json**), ou espere o webhook de push. O hub lê o arquivo na branch padrão.
3. Se o repositório estiver ligado a mais de um sistema, o campo `slug` escolhe qual. Com um só, o slug pode faltar.
4. Ao salvar tipo, canal, ligação ou recurso na tela, o hub monta o `hub.json` de novo. Se o token escreve e o arquivo no Git não mudou desde a última sincronização, ele é atualizado na branch padrão. Se o Git divergiu, a aba **Configurações** mostra o conflito e nada é sobrescrito até alguém que edita o serviço escolher o hub ou o Git. Se o token não escreve, a página mostra o texto para copiar e subir à mão.

**Sincronizar repositório** também preenche o que ainda está vazio: a descrição do repositório, as tecnologias lidas dos manifestos, o `README.md` como primeira página de regras e o caminho de um OpenAPI encontrado na raiz ou em `docs/`. Variáveis e senhas não vão para o Git. Salvar uma página de regras grava `README.md` ou `docs/<slug>.md` na branch padrão, com a mesma trava de conflito.

Um slug de sistema que o hub não conhece fica de fora e aparece no resultado. O resto do arquivo aplica. A spec OpenAPI continua sendo o contrato HTTP.

## Como saber que deu certo

O mapa mostra o tipo no nó e o protocolo na aresta. A aba **Integrações** lista os canais, e a documentação lista os endpoints chamados. A **Auditoria** registra que o `hub.json` foi aplicado ou gravado, sem o corpo do arquivo.

## Problemas comuns

| Mensagem | O que fazer |
|---|---|
| O token não escreve | Copie o `hub.json` da página do sistema e suba no repositório. |
| `hub.json` sem slug | O repositório está ligado a mais de um sistema. Informe o `slug`. |
| Serviço desconhecido | O slug em `consumes` ainda não existe no catálogo. Cadastre o sistema ou corrija o nome. |

## Veja também

- [Mapa de ligações](/uso/mapa)
- [Página do serviço](/uso/servico)
- [Cadastrar uma integração externa](/receitas/integracao-externa)
