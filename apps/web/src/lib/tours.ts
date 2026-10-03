/**
 * Conteúdo do tour guiado (botão "?" flutuante + tour obrigatório no primeiro acesso).
 * Sem import de Prisma nem de código client-only: é seguro usar tanto no servidor
 * (layout, gate) quanto no cliente (HelpButton, TourProvider).
 */
export type TourStep = { selector?: string; title: string; description: string; side?: "top" | "right" | "bottom" | "left" };
export type TourDef = { title: string; description: string; steps: TourStep[] };

const t = (id: string) => `[data-tour="${id}"]`;

/** Primeiro acesso: um panorama do menu, no Catálogo. Não percorre as outras telas. */
export const MANDATORY_TOUR: TourDef = {
  title: "Visão geral",
  description: "O menu do hub e o botão que ensina cada tela.",
  steps: [
    { title: "Bem-vindo", description: "Este primeiro tour é só uma visão geral do menu. Ele não entra em cada tela. Quando você quiser aprender um lugar, a interrogação daquela tela ensina." },
    { selector: t("hub-nav"), title: "Menu completo", description: "Aqui está tudo o que o seu papel pode abrir. O que não aparece nesta lista, você não usa.", side: "right" },
    { selector: t("hub-nav-catalog"), title: "Consultar", description: "Catálogo, mapa de ligações e integrações externas. É a parte de ver a documentação e as ligações, mesmo para quem só lê.", side: "right" },
    { selector: t("hub-nav-admin"), title: "Administrar", description: "Serviços, times, pessoas, auditoria, permissões, aparência e configurações. Este grupo só aparece para quem administra.", side: "right" },
    { selector: t("help-button"), title: "Interrogação", description: "Toda tela tem este botão. Ele explica a tela e inicia o tour dela, para ensinar a usar aquele lugar.", side: "left" },
  ],
};

export const TOURS: Record<string, TourDef> = {
  "/": {
    title: "Catálogo",
    description: "A tela inicial: a lista de todos os serviços/APIs cadastrados, com busca e um resumo de cada um.",
    steps: [
      { selector: t("catalog-search"), title: "Busca", description: "Busque um serviço por nome, slug, descrição ou endpoint.", side: "bottom" },
      { selector: t("catalog-list"), title: "Lista de serviços", description: "Cada linha mostra o time, a versão em cada ambiente e as ligações. Clique no nome para abrir a documentação. A paginação fica no rodapé.", side: "top" },
      { selector: t("user-menu"), title: "Sua conta", description: "Seu papel aparece aqui. Sair fica abaixo do nome.", side: "top" },
    ],
  },
  "/graph": {
    title: "Mapa de ligações",
    description: "O grafo de dependências entre serviços, integrações, repositórios, times e pessoas.",
    steps: [
      { selector: t("graph-mode"), title: "Mapa ou lista", description: "Alterne entre o grafo visual e uma tabela navegável por teclado com as mesmas ligações.", side: "bottom" },
      { selector: t("graph-toolbar"), title: "Filtros", description: "Escolha quais tipos de item aparecem: serviços, integrações, repositórios, times e pessoas.", side: "bottom" },
      { selector: t("graph-canvas"), title: "Navegação", description: "Clique em um item para focar na vizinhança dele; duplo clique abre o serviço, a integração ou o repositório. \"Mostrar tudo\" volta à visão completa.", side: "top" },
      { selector: t("graph-add-link"), title: "Novo vínculo", description: "Abre o cadastro de vínculos. Se houver itens selecionados, o último serviço ou repositório da seleção já vem no campo De.", side: "left" },
      { selector: t("graph-print"), title: "Print", description: "A câmera baixa uma imagem das ligações que estão na tela, com nome, tipo e o sentido de cada seta. O hub pede confirmação e registra quem tirou o print.", side: "left" },
    ],
  },
  "/integrations": {
    title: "Integrações externas",
    description: "APIs de terceiros, filas, tópicos, webhooks e bancos usados pelos serviços.",
    steps: [
      { selector: t("integrations-header"), title: "O que é uma integração", description: "Qualquer dependência externa que não é um serviço seu — Stripe, uma fila, um banco. Quem tem permissão pode cadastrar uma nova aqui.", side: "bottom" },
      { selector: t("integrations-filters"), title: "Filtrar por tipo", description: "Restrinja a lista por tipo de integração.", side: "bottom" },
      { selector: t("integrations-list"), title: "Lista de integrações", description: "Cada linha mostra o tipo e quais serviços usam aquela integração. Clique no nome para ver os detalhes.", side: "top" },
    ],
  },
  "/admin/catalog": {
    title: "Serviços e repositórios",
    description: "Cadastro de serviços, repositórios de código, vínculos entre eles e tokens de publicação para o CI.",
    steps: [
      { selector: t("catalog-admin-tabs"), title: "Abas", description: "Serviços, Repositórios, Vínculos e Tokens. Em cada aba, o botão de criar abre um modal. A lista fica na tela.", side: "bottom" },
      { selector: t("catalog-admin-mine"), title: "Serviços que você mantém", description: "Os serviços dos seus times, inclusive os arquivados. Editar abre a página do serviço.", side: "top" },
      { selector: t("catalog-admin-new-service"), title: "Novo serviço", description: "Abre o assistente: dados, time, repositório e spec inicial. Os dois últimos passos são opcionais.", side: "left" },
    ],
  },
  "/admin/teams": {
    title: "Times",
    description: "Cadastro de times e de quem participa de cada um.",
    steps: [
      { selector: t("teams-new"), title: "Novo time", description: "Abre o cadastro: nome, identificador curto e descrição.", side: "bottom" },
      { selector: t("teams-filters"), title: "Busca e filtros", description: "Busque por time, serviço ou pessoa. Todos, Com membros e Sem membros restringem a lista.", side: "bottom" },
      { selector: t("teams-first"), title: "Lista de times", description: "Clique no nome. A tabela some e aparecem as pessoas daquele time, para adicionar ou remover.", side: "top" },
    ],
  },
  "/admin/people": {
    title: "Pessoas e acesso",
    description: "Pedidos de acesso, convites, papéis e o histórico de decisões.",
    steps: [
      { selector: t("people-requests"), title: "Pedidos", description: "Este filtro troca a lista por quem pediu acesso e ainda espera uma decisão.", side: "bottom" },
      { selector: t("people-invite"), title: "Convidar usuário", description: "Abre o convite. O link fica no modal para copiar, e o e-mail sai se o SMTP estiver configurado.", side: "left" },
      { selector: t("people-list"), title: "Pessoas", description: "Clique no nome para mudar o papel, suspender, reativar ou gerar um link de nova senha.", side: "top" },
      { selector: t("people-history"), title: "Histórico", description: "Este filtro mostra aprovações, recusas e os outros eventos de acesso.", side: "bottom" },
    ],
  },
  "/admin/audit": {
    title: "Auditoria",
    description: "Registro de ações administrativas, com filtros e exportação.",
    steps: [
      { selector: t("audit-filters"), title: "Filtros", description: "Busque uma pessoa, escolha o período e o tipo de evento. Limpar volta à lista inteira.", side: "bottom" },
      { selector: t("audit-table"), title: "Registros", description: "Cada linha é uma ação. Clique na frase para ver quem fez, o alvo, o IP e os dados do evento.", side: "top" },
      { selector: t("audit-export"), title: "Exportar", description: "Baixa em CSV os registros dos filtros atuais, não só a página que está na tela.", side: "left" },
    ],
  },
  "/admin/permissions": {
    title: "Permissões",
    description: "A matriz de permissões por papel: o que cada papel pode fazer, em linguagem simples.",
    steps: [
      { selector: t("permissions-matrix"), title: "Matriz de permissões", description: "Cada coluna é um papel; cada linha, uma permissão agrupada por área.", side: "bottom" },
      { selector: t("permissions-rules"), title: "Regras fixas", description: "Owner sempre tem tudo. Ver o catálogo é obrigatório para todo mundo. Permissões administrativas só podem ir para o Admin.", side: "top" },
      { selector: t("permissions-actions"), title: "Salvar ou restaurar", description: "Salvar grava a matriz. Restaurar padrão volta ao original dos papéis.", side: "left" },
    ],
  },
  "/admin/appearance": {
    title: "Aparência",
    description: "Nome do sistema, tema e paleta de cores — a personalização visual da instalação.",
    steps: [
      { selector: t("appearance-title"), title: "Nome do sistema", description: "O nome que aparece no menu e no título das páginas.", side: "bottom" },
      { selector: t("appearance-themes"), title: "Tema", description: "Dois temas: claro e escuro, nas mesmas cores da documentação.", side: "bottom" },
      { selector: t("appearance-palette"), title: "Paleta de cores", description: "Ajuste fino de cada cor do tema escolhido. Combinações com contraste baixo demais são recusadas.", side: "top" },
      { selector: t("appearance-preview"), title: "Prévia", description: "Veja o resultado antes de salvar.", side: "left" },
      { selector: t("appearance-save"), title: "Salvar", description: "Aplica o tema para todo mundo que usa esta instalação.", side: "top" },
    ],
  },
  "/admin/settings": {
    title: "Configurações",
    description: "Login, repositórios, ambientes e regras de acesso da instalação.",
    steps: [
      { selector: t("settings-header"), title: "Sobre a instalação", description: "Quando foi instalada e quem são os administradores (OWNER).", side: "bottom" },
      { selector: t("settings-tabs"), title: "Seções", description: "Organização, formas de login, e-mail, repositórios, ambientes, regras de acesso e sessões.", side: "right" },
      { selector: t("settings-section"), title: "Conteúdo da seção", description: "O que você configura muda conforme a seção escolhida ao lado.", side: "left" },
    ],
  },
  "/services/[slug]": {
    title: "Detalhe do serviço",
    description: "O hub de documentação de uma API: spec, regras, integrações, variáveis e configurações.",
    steps: [
      { selector: t("service-header"), title: "Sobre o serviço", description: "Time responsável, repositórios ligados e de onde vem a spec da API.", side: "bottom" },
      { selector: t("service-env"), title: "Ambiente", description: "Cada aba abaixo é filtrada pelo ambiente escolhido aqui (desenvolvimento, homologação, produção).", side: "bottom" },
      { selector: t("service-tab-api"), title: "Documentação da API", description: "A spec OpenAPI/Swagger publicada, navegável como referência.", side: "bottom" },
      { selector: t("service-tab-rules"), title: "Regras de negócio", description: "Documentação em Markdown escrita pelo time — o que a API faz e por quê.", side: "bottom" },
      { selector: t("service-tab-integrations"), title: "Integrações", description: "Canais que este sistema oferece, ligações com outros serviços e integrações externas.", side: "bottom" },
      { selector: t("service-tab-variables"), title: "Variáveis de ambiente", description: "As variáveis de cada ambiente. Segredos ficam cifrados e só aparecem sob pedido.", side: "bottom" },
      { selector: t("service-tab-config"), title: "Configurações", description: "Publicar a spec deste ambiente, sincronizar o repositório e copiar o hub.json.", side: "bottom" },
    ],
  },
};

const DYNAMIC_TOURS: { pattern: RegExp; key: string }[] = [
  // /services/algum-slug → tour da tela de detalhe; /services/algum-slug/edit fica de fora
  // (mensagem genérica), porque não é uma tela com tour próprio.
  { pattern: /^\/services\/[^/]+$/, key: "/services/[slug]" },
];

/** Acha a chave de tour certa para um pathname, incluindo rotas dinâmicas. */
export function resolveTourKey(pathname: string): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (TOURS[p]) return p;
  return DYNAMIC_TOURS.find((d) => d.pattern.test(p))?.key ?? null;
}

export function getTour(key: string | null | undefined): TourDef | null {
  return key ? (TOURS[key] ?? null) : null;
}
