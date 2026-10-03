---
description: Como reportar uma vulnerabilidade no Rizoma em particular, o que incluir no relato e o que não fazer numa issue pública.
---

# Reportar uma vulnerabilidade

Não abra issue, discussão nem pull request público para uma falha de segurança. Um exemplo de exploração no histórico do Git fica disponível para quem ainda não atualizou.

## Para onde enviar

Use o reporte privado do GitHub:

[github.com/wendersonbelko/rizoma/security/advisories/new](https://github.com/wendersonbelko/rizoma/security/advisories/new)

Quem mantém um fork publica o advisory no repositório de origem.

## O que incluir

- Versão ou commit, e se a instalação é Docker ou `pnpm dev`.
- O que uma pessoa sem permissão consegue fazer, ou o que vaza.
- Passos para reproduzir, com o mínimo de dado. Não anexe `.env`, token real, spec de cliente nem backup.
- O efeito: leitura de segredo, contorno de permissão, SSRF, sessão de outra pessoa, e assim por diante.

Descrição sem exploit completo já ajuda. Se você tiver correção, descreva a ideia no reporte; o patch pode vir num pull request **depois** que quem mantém confirmar que o detalhe não precisa ficar público.

## O que tratamos como segurança

Algo que quebra as defesas descritas em [Segurança](/referencia/seguranca): cifra, sessão, permissão no servidor, leitura de URL, renderizador da spec, vazamento na auditoria ou no log. Falha de produto sem exposição (texto errado, layout, uma spec válida recusada) é issue normal.

## O que acontece depois

Quem mantém confirma o recebimento, reproduz e combina se a correção sai numa versão antes do detalhe público. A versão mais recente é a que recebe correção. Não há, hoje, suporte paralelo a versões antigas: veja [Pull requests e releases](/contribuindo/pull-requests).

Não espere recompensa em dinheiro. O projeto não tem programa de bug bounty.

## Enquanto a correção não sai

Se você administra um hub: restrinja a rede, confirme que `ENCRYPTION_KEY` e `AUTH_SECRET` não estão no repositório e, se o relato envolver sessão, use **Encerrar todas as sessões** depois de atualizar.
