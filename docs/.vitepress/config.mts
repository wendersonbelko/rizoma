import { defineConfig, type DefaultTheme } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

/**
 * Repositório no GitHub ("dono/nome"). É usado no link do GitHub, no "Editar esta página" e no
 * caminho do site no GitHub Pages (https://dono.github.io/nome/). Troque ao publicar o fork.
 */
const REPO = process.env.DOCS_REPO ?? "wendersonbelko/rizoma";
const REPO_NAME = REPO.split("/")[1] ?? "rizoma";
/** "/" para domínio próprio (ex.: docs.suaempresa.com); "/<repo>/" no GitHub Pages padrão. */
const BASE = process.env.DOCS_BASE ?? `/${REPO_NAME}/`;

const guia: DefaultTheme.SidebarItem[] = [
  {
    text: "Introdução",
    items: [
      { text: "O que é o Rizoma", link: "/guia/o-que-e" },
      { text: "Tudo o que o sistema faz", link: "/guia/funcionalidades" },
      { text: "Início rápido", link: "/guia/inicio-rapido" },
      { text: "Conceitos principais", link: "/guia/conceitos" },
    ],
  },
  {
    text: "Instalação",
    items: [
      { text: "Visão geral", link: "/instalacao/" },
      { text: "Requisitos", link: "/instalacao/requisitos" },
      { text: "Desenvolvimento local", link: "/instalacao/desenvolvimento-local" },
      { text: "Produção com Docker", link: "/instalacao/docker" },
      { text: "HTTPS com proxy reverso", link: "/instalacao/proxy-https" },
      { text: "Assistente de instalação", link: "/instalacao/assistente" },
      { text: "Provedores de login", link: "/instalacao/provedores-de-login" },
      { text: "Variáveis de ambiente", link: "/instalacao/variaveis-de-ambiente" },
      { text: "Atualização e backup", link: "/instalacao/atualizacao-e-backup" },
    ],
  },
  {
    text: "Usando o hub",
    items: [
      { text: "Primeiro acesso e tour", link: "/uso/primeiro-acesso" },
      { text: "Catálogo", link: "/uso/catalogo" },
      { text: "Página do serviço", link: "/uso/servico" },
      { text: "Mapa de ligações", link: "/uso/mapa" },
      { text: "Integrações externas", link: "/uso/integracoes" },
      { text: "Variáveis de ambiente", link: "/uso/variaveis" },
      { text: "Regras de negócio", link: "/uso/regras-de-negocio" },
    ],
  },
  {
    text: "Administração",
    items: [
      { text: "Visão geral", link: "/admin/" },
      { text: "Serviços e repositórios", link: "/admin/servicos-e-vinculos" },
      { text: "Editar e arquivar serviços", link: "/admin/editar-servico" },
      { text: "Times", link: "/admin/times" },
      { text: "Pessoas e acesso", link: "/admin/pessoas-e-acesso" },
      { text: "Permissões", link: "/admin/permissoes" },
      { text: "Aparência", link: "/admin/aparencia" },
      { text: "Configurações", link: "/admin/configuracoes" },
      { text: "Auditoria", link: "/admin/auditoria" },
      { text: "Recuperação de OWNER", link: "/admin/recuperacao-de-owner" },
    ],
  },
];

const receitas: DefaultTheme.SidebarItem[] = [
  { text: "Todos os cenários", link: "/receitas/" },
  {
    text: "Specs e publicação",
    items: [
      { text: "Do zero ao primeiro serviço", link: "/receitas/primeiro-servico" },
      { text: "Publicar pelo GitHub Actions", link: "/receitas/publicar-pelo-github-actions" },
      { text: "Publicar pelo GitLab CI", link: "/receitas/publicar-pelo-gitlab-ci" },
      { text: "Publicar por outros CIs", link: "/receitas/publicar-por-outros-ci" },
      { text: "Ler a spec do repositório", link: "/receitas/spec-do-repositorio" },
      { text: "Ler a spec de uma URL", link: "/receitas/spec-por-url" },
      { text: "Importar a spec manualmente", link: "/receitas/importar-spec-manualmente" },
      { text: "Tirar o /docs público do ar", link: "/receitas/tirar-docs-do-ar" },
    ],
  },
  {
    text: "Organização do catálogo",
    items: [
      { text: "Ambientes por branch", link: "/receitas/ambientes-por-branch" },
      { text: "Mapear dependências", link: "/receitas/mapear-dependencias" },
      { text: "hub.json do repositório", link: "/receitas/hub-json" },
      { text: "Cadastrar uma integração externa", link: "/receitas/integracao-externa" },
      { text: "Segredos, .env e cópia entre ambientes", link: "/receitas/segredos-e-env" },
    ],
  },
  {
    text: "Pessoas e acesso",
    items: [
      { text: "Acesso automático para a empresa", link: "/receitas/acesso-automatico-pela-organizacao" },
      { text: "Acesso temporário para terceiros", link: "/receitas/acesso-temporario-para-terceiros" },
      { text: "Convidar por e-mail", link: "/receitas/convidar-por-email" },
      { text: "Login com Keycloak (OIDC)", link: "/receitas/login-com-keycloak" },
      { text: "Papel com permissões sob medida", link: "/receitas/papel-personalizado" },
      { text: "Onboarding de uma pessoa nova", link: "/receitas/onboarding-de-pessoa-nova" },
    ],
  },
  {
    text: "Avaliação",
    items: [{ text: "Hub com dados de demonstração", link: "/receitas/dados-de-demonstracao" }],
  },
];

const referencia: DefaultTheme.SidebarItem[] = [
  {
    text: "Referência",
    items: [
      { text: "API HTTP", link: "/referencia/api" },
      { text: "Extensão x-api-hub", link: "/referencia/extensao-x-api-hub" },
      { text: "Comandos (CLI)", link: "/referencia/cli" },
      { text: "Papéis e permissões", link: "/referencia/permissoes" },
      { text: "Regras de negócio", link: "/referencia/regras-de-negocio" },
      { text: "Segurança", link: "/referencia/seguranca" },
    ],
  },
  {
    text: "Ajuda",
    items: [
      { text: "Solução de problemas", link: "/referencia/solucao-de-problemas" },
      { text: "Perguntas frequentes", link: "/referencia/faq" },
      { text: "Glossário", link: "/referencia/glossario" },
    ],
  },
];

const arquitetura: DefaultTheme.SidebarItem[] = [
  {
    text: "Como foi pensado",
    items: [
      { text: "Visão geral e princípios", link: "/arquitetura/visao-geral" },
      { text: "Decisões de arquitetura", link: "/arquitetura/decisoes" },
      { text: "Tecnologias", link: "/arquitetura/tecnologias" },
      { text: "Estrutura do monorepo", link: "/arquitetura/monorepo" },
      { text: "Modelo de dados", link: "/arquitetura/modelo-de-dados" },
      { text: "Autenticação e acesso", link: "/arquitetura/autenticacao-e-acesso" },
      { text: "Ingestão de specs", link: "/arquitetura/ingestao-de-specs" },
      { text: "Interface e design system", link: "/arquitetura/interface" },
      { text: "Roadmap", link: "/arquitetura/roadmap" },
    ],
  },
];

const contribuindo: DefaultTheme.SidebarItem[] = [
  {
    text: "Contribuir",
    items: [
      { text: "Como contribuir", link: "/contribuindo/" },
      { text: "Preparar o ambiente", link: "/contribuindo/ambiente" },
      { text: "Padrões de código", link: "/contribuindo/padroes-de-codigo" },
      { text: "Testes", link: "/contribuindo/testes" },
      { text: "Pull requests e releases", link: "/contribuindo/pull-requests" },
      { text: "Esta documentação", link: "/contribuindo/documentacao" },
    ],
  },
  {
    text: "Guias para quem contribui",
    items: [
      { text: "Criar uma tela nova", link: "/contribuindo/guias/nova-tela" },
      { text: "Criar uma permissão", link: "/contribuindo/guias/nova-permissao" },
      { text: "Mudar o banco (migração)", link: "/contribuindo/guias/migracao-de-banco" },
      { text: "Adicionar um provedor de login", link: "/contribuindo/guias/novo-provedor-de-login" },
    ],
  },
  {
    text: "Comunidade",
    items: [
      { text: "Código de conduta", link: "/contribuindo/codigo-de-conduta" },
      { text: "Reportar uma vulnerabilidade", link: "/contribuindo/seguranca" },
    ],
  },
];

export default withMermaid(
  defineConfig({
    lang: "pt-BR",
    title: "Rizoma",
    description:
      "O catálogo fechado das APIs da sua empresa: documentação OpenAPI por ambiente, times, integrações, variáveis e o mapa de ligações. Código aberto e auto-hospedado.",
    base: BASE,
    srcExclude: ["AGENTS.md", "CLAUDE.md"],
    cleanUrls: true,
    lastUpdated: true,
    head: [
      ["link", { rel: "icon", type: "image/svg+xml", href: `${BASE}logo.svg` }],
      ["meta", { name: "theme-color", content: "#0f7a68" }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:locale", content: "pt_BR" }],
      ["meta", { property: "og:title", content: "Rizoma — o catálogo fechado das APIs da sua empresa" }],
      ["meta", { property: "og:image", content: `${BASE}prints/04-catalogo.png` }],
    ],
    markdown: {
      container: { tipLabel: "Dica", warningLabel: "Atenção", dangerLabel: "Cuidado", infoLabel: "Informação", detailsLabel: "Detalhes" },
    },
    themeConfig: {
      logo: "/logo.svg",
      nav: [
        { text: "Guia", link: "/guia/o-que-e", activeMatch: "^/(guia|instalacao|uso|admin)/" },
        { text: "Passo a passo", link: "/receitas/", activeMatch: "^/receitas/" },
        { text: "Referência", link: "/referencia/api", activeMatch: "^/referencia/" },
        { text: "Arquitetura", link: "/arquitetura/visao-geral", activeMatch: "^/arquitetura/" },
        { text: "Contribuir", link: "/contribuindo/", activeMatch: "^/contribuindo/" },
      ],
      sidebar: {
        "/guia/": guia,
        "/instalacao/": guia,
        "/uso/": guia,
        "/admin/": guia,
        "/receitas/": receitas,
        "/referencia/": referencia,
        "/arquitetura/": arquitetura,
        "/contribuindo/": contribuindo,
      },
      socialLinks: [{ icon: "github", link: `https://github.com/${REPO}` }],
      editLink: { pattern: `https://github.com/${REPO}/edit/main/docs/:path`, text: "Editar esta página no GitHub" },
      search: {
        provider: "local",
        options: {
          translations: {
            button: { buttonText: "Buscar", buttonAriaLabel: "Buscar na documentação" },
            modal: {
              displayDetails: "Mostrar detalhes",
              resetButtonTitle: "Limpar busca",
              backButtonTitle: "Fechar busca",
              noResultsText: "Nada encontrado para",
              footer: { selectText: "abrir", navigateText: "navegar", closeText: "fechar" },
            },
          },
        },
      },
      outline: { level: [2, 3], label: "Nesta página" },
      docFooter: { prev: "Anterior", next: "Próxima" },
      lastUpdated: { text: "Atualizado em", formatOptions: { dateStyle: "short" } },
      darkModeSwitchLabel: "Tema",
      lightModeSwitchTitle: "Mudar para o tema claro",
      darkModeSwitchTitle: "Mudar para o tema escuro",
      sidebarMenuLabel: "Menu",
      returnToTopLabel: "Voltar ao topo",
      externalLinkIcon: true,
      notFound: { title: "Página não encontrada", quote: "O endereço pode ter mudado. Use a busca ou volte ao início.", linkLabel: "voltar ao início", linkText: "Voltar ao início" },
      footer: {
        message: "Código aberto e gratuito. Contribuições são bem-vindas.",
        copyright: "Desenvolvido por <a href=\"https://belko.com.br\">Belko</a> e colaboradores.",
      },
    },
    mermaid: { theme: "neutral" },
  }),
);
