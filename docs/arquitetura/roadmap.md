---
description: O que o Rizoma ainda não faz e já está assumido nas outras páginas — sem promessa além do que o código e a documentação já registram.
---

# Roadmap

Esta lista é o que as outras páginas já apontam como ausência, não um cronograma. Nada aqui tem data. Se você for implementar um item, comece pela página que o cita e pelo comentário no código.

## Operação

- **Limite de requisições compartilhado.** Publicação (30 por minuto por token) e tentativas de login contam num `Map` em memória do processo. Várias instâncias não compartilham o contador, e reiniciar zera. A troca prevista é Redis.
- **Outro banco além do PostgreSQL.** O assistente lista MySQL, SQLite e SQL Server como "Em breve". O schema usa `String[]` e `Json` do Postgres; outro banco exige rever isso. Veja [Requisitos](/instalacao/requisitos).

## O que não entra nesta lista

Gateway, mock server, execução de requisições, geração de spec e várias empresas na mesma instalação são não-objetivos, não itens adiados. Estão em [Visão geral](/arquitetura/visao-geral).

## Veja também

- [Decisões de arquitetura](/arquitetura/decisoes)
- [Tudo o que o sistema faz](/guia/funcionalidades)
