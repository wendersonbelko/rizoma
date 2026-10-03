/** Aparência (RN-110 a RN-113): tema claro e tema escuro, as mesmas cores da documentação, mais ajustes do admin. */
export const THEME_TOKENS = ["paper", "sheet", "ink", "muted", "line", "accent", "accent-ink", "wait", "danger"] as const;
export type ThemeToken = (typeof THEME_TOKENS)[number];
export type Palette = Record<ThemeToken, string>;

export const TOKEN_LABEL: Record<ThemeToken, string> = {
  paper: "Fundo",
  sheet: "Painéis",
  ink: "Texto",
  muted: "Texto secundário",
  line: "Bordas",
  accent: "Destaque (botões e links)",
  "accent-ink": "Texto sobre o destaque",
  wait: "Pendências",
  danger: "Perigo",
};

export const THEMES: { id: string; name: string; description: string; dark: boolean; palette: Palette }[] = [
  { id: "prancheta", name: "Claro", description: "Fundo frio, painel branco e verdete.", dark: false,
    palette: { paper: "#f4f7f5", sheet: "#ffffff", ink: "#16242c", muted: "#5b6b70", line: "#e2e8e4", accent: "#0f7a68", "accent-ink": "#e8f4f1", wait: "#8f5c0c", danger: "#b3261e" } },
  { id: "grafite", name: "Escuro", description: "Painel afastado do fundo grafite, com o mesmo verdete.", dark: true,
    palette: { paper: "#0f1316", sheet: "#1b2329", ink: "#e6ebee", muted: "#9aadb4", line: "#2e3b42", accent: "#3fb59b", "accent-ink": "#0b1a16", wait: "#e0b15a", danger: "#f08a82" } },
];

export const HEX = /^#[0-9a-f]{6}$/i;

export function resolveTheme(themeId: string, overrides?: unknown) {
  const base = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  const palette: Palette = { ...base.palette };
  if (overrides && typeof overrides === "object") {
    for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
      if ((THEME_TOKENS as readonly string[]).includes(k) && typeof v === "string" && HEX.test(v)) palette[k as ThemeToken] = v.toLowerCase();
    }
  }
  return { id: base.id, name: base.name, dark: base.dark, palette };
}

/** Variáveis CSS lidas pelo Tailwind (--color-*). */
export function paletteToCssVars(p: Palette): Record<string, string> {
  return Object.fromEntries(THEME_TOKENS.map((t) => [`--color-${t}`, p[t]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
}

/** RN-112: combinações que ficariam ilegíveis são recusadas (WCAG AA, 4,5:1 para texto de leitura). */
export function paletteProblems(p: Palette): string[] {
  const checks: [ThemeToken, ThemeToken, number, string][] = [
    ["ink", "paper", 4.5, "Texto sobre o fundo"],
    ["ink", "sheet", 4.5, "Texto sobre os painéis"],
    // G1: "muted" é usado como texto de leitura (descrições, contagens), não só decoração —
    // por isso precisa do mesmo mínimo de texto normal (4.5:1), não do mínimo de borda (3:1).
    ["muted", "sheet", 4.5, "Texto secundário sobre os painéis"],
    ["muted", "paper", 4.5, "Texto secundário sobre o fundo"],
    ["accent-ink", "accent", 4.5, "Texto dos botões"],
    ["accent", "sheet", 4.5, "Links sobre os painéis"],
    ["accent", "paper", 4.5, "Links sobre o fundo"],
    ["wait", "sheet", 4.5, "Pendências sobre os painéis"],
    ["wait", "paper", 4.5, "Pendências sobre o fundo"],
    ["danger", "sheet", 4.5, "Avisos de perigo sobre os painéis"],
  ];
  return checks
    .filter(([a, b, min]) => contrastRatio(p[a], p[b]) < min)
    .map(([a, b, min, label]) => `${label}: contraste ${contrastRatio(p[a], p[b]).toFixed(1)}:1, mínimo ${min}:1.`);
}
