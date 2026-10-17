---
description: O que o Rizoma ainda não faz e já está assumido nas outras páginas — sem promessa além do que o código e a documentação já registram.
---

# Roadmap

Esta lista é o que as outras páginas já apontam como ausência, não um cronograma. Nada aqui tem data. Se você for implementar um item, comece pela página que o cita e pelo comentário no código.

## Operação

- **Limite de requisições compartilhado.** Publicação (30 por minuto por token) e tentativas de login contam num `Map` em memória do processo. Várias instâncias não compartilham o contador, e reiniciar zera. A troca prevista é Redis.
- **Outro banco além do PostgreSQL.** O assistente lista MySQL, SQLite e SQL Server como "Em breve". O schema usa `String[]` e `Json` do Postgres; outro banco exige rever isso. Veja [Requisitos](/instalacao/requisitos).

## Concluído na revisão de UX de 02/10/2026

O que a revisão de interface entregou e já está descrito nas outras páginas:

- **Menu e cadastros.** Doze itens em quatro grupos (**Explorar**, **Cadastros**, **Pessoas** e **Sistema**), com o item do menu igual ao título da página. A antiga página com abas virou **Serviços**, **Repositórios**, **Vínculos** e **Tokens de CI**, e **Aparência** virou aba de **Configurações**, que agora tem quatro abas.
- **Serviço em um passo.** Criar um serviço pede nome, time e tipo. O resto vira o quadro **Próximos passos**, na página do serviço. A edição salva dados e origem da spec juntos.
- **Modal-padrão.** Todo formulário de criar ou editar abre o mesmo modal, com confirmação ao descartar. A edição ganhou a barra **Alterações não salvas**, e as ações destrutivas têm um estilo só.
- **Tema por pessoa.** Claro, Escuro ou Sistema, no menu da conta. O administrador define só a marca: nome e cor de destaque.
- **Busca e atalhos.** Busca global **Ctrl+K**/**⌘K** e o botão **+ Novo**, ambos com os atalhos de criação filtrados por permissão.
- **Catálogo e mapa.** O Catálogo ganhou filtros e linha compacta, com os filtros aplicados em SQL. O mapa abre em foco, com alcance de 1º grau, 2º grau ou tudo.
- **Tour.** O tour obrigatório virou um panorama único no Catálogo, e cada tela tem o seu, pelo botão **?**.

## O que não entra nesta lista

Gateway, mock server, execução de requisições, geração de spec e várias empresas na mesma instalação são não-objetivos, não itens adiados. Estão em [Visão geral](/arquitetura/visao-geral).

## Veja também

- [Decisões de arquitetura](/arquitetura/decisoes)
- [Tudo o que o sistema faz](/guia/funcionalidades)
