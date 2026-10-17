import type { ThemePreference } from "./types";

/**
 * Aparência (RN-110 a RN-113). Dois temas fixos, Claro e Escuro, escolhidos por pessoa
 * (achado F5 da auditoria de UX de 02/10/2026). O admin define só a marca: a cor de destaque.
 * As duas paletas nascem dela, então claro e escuro ficam sempre juntos e legíveis.
 */
export const THEME_TOKENS = [
  "paper", "sheet", "raised", "field", "ink", "muted", "line", "line-strong",
  "accent", "accent-ink", "wait", "danger", "overlay", "shadow",
] as const;
export type ThemeToken = (typeof THEME_TOKENS)[number];
export type Palette = Record<ThemeToken, string>;

export type ThemeMode = "light" | "dark";
export const THEME_MODES: ThemeMode[] = ["light", "dark"];
export const THEME_MODE_LABEL: Record<ThemeMode, string> = { light: "Claro", dark: "Escuro" };

export const HEX = /^#[0-9a-f]{6}$/i;

/** Verdete da marca. É o destaque quando o admin ainda não escolheu outro. */
export const DEFAULT_ACCENT = "#0f7a68";

/**
 * Cookie com a escolha da pessoa. O servidor lê para pintar o `<html>` já no tema certo (sem
 * piscar) e o banco (`User.themePreference`) é a fonte que vale entre aparelhos.
 */
export const THEME_COOKIE = "rizoma-theme";
export type ThemeChoice = "light" | "dark" | "system";

export function readThemeCookie(value: string | null | undefined): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

export function themeChoiceFromPreference(preference: ThemePreference): ThemeChoice {
  return preference === "LIGHT" ? "light" : preference === "DARK" ? "dark" : "system";
}

/**
 * Valores fixos de cada tema. Só o destaque (accent e accent-ink) muda com a marca.
 *
 * Escuro com elevação em 3 degraus (p.11 da auditoria): fundo, painel e modal/pop-over, para o
 * modal não se confundir com a página (antes eram 1,17:1). A borda de campo (`line-strong`) fica
 * em pelo menos 3:1 contra o campo e contra cada superfície em que ele aparece (WCAG 1.4.11);
 * `line` continua sutil, para cartões e divisórias.
 */
const BASE: Record<ThemeMode, Omit<Palette, "accent" | "accent-ink">> = {
  light: {
    paper: "#f4f7f5", sheet: "#ffffff", raised: "#ffffff", field: "#ffffff",
    ink: "#16242c", muted: "#5b6b70", line: "#e2e8e4", "line-strong": "#7f8f89",
    wait: "#8f5c0c", danger: "#b3261e",
    // Tinta a 45%, igual ao backdrop antigo do modal.
    overlay: "rgb(22 36 44 / 0.45)", shadow: "#16242c",
  },
  dark: {
    paper: "#0f1316", sheet: "#161d22", raised: "#1f2830", field: "#0f1316",
    ink: "#e6ebee", muted: "#9aadb4", line: "#33434b", "line-strong": "#62747c",
    wait: "#e0b15a", danger: "#f08a82",
    // Preto a 60%: com a tinta clara do texto o fundo ficava acinzentado em vez de escurecer.
    overlay: "rgb(0 0 0 / 0.6)", shadow: "#000000",
  },
};

const INK_ON_ACCENT = { light: "#ffffff", dark: "#0a0f12" } as const;

// ─── Cor ────────────────────────────────────────────────────────────────

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
}

const ratio = (n: number) => n.toFixed(1).replace(".", ",");

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

const toHex = (channels: number[]) => `#${channels.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/** `t` da cor `b` por cima da cor `a` (0 = só `a`, 1 = só `b`). */
function mixHex(a: string, b: string, t: number): string {
  const [ra, rb] = [rgb(a), rgb(b)];
  return toHex(ra.map((v, i) => v * (1 - t) + rb[i]! * t));
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return toHex([channel(0), channel(8), channel(4)]);
}

// ─── Marca ──────────────────────────────────────────────────────────────

/**
 * RN-112: o destaque escolhido pelo admin precisa servir de texto (links) e de botão no tema
 * claro. Cor ilegível é recusada com uma mensagem que diz como corrigir. No escuro não há o que
 * recusar: `darkAccent` clareia qualquer cor até ficar legível.
 */
export function accentProblems(accent: string): string[] {
  if (!HEX.test(accent)) return ["Use uma cor no formato #rrggbb, por exemplo #0f7a68."];
  const { paper, sheet } = BASE.light;
  const worst = Math.min(contrastRatio(accent, paper), contrastRatio(accent, sheet));
  if (worst >= 4.5) return [];
  return [`Essa cor é clara demais para o tema claro: links e botões ficariam ilegíveis (contraste ${ratio(worst)}:1, o mínimo é 4,5:1). Escolha um tom mais escuro.`];
}

/** Destaque gravado em `Installation.themeOverrides` (`{ accent }`). Valor ausente ou ilegível volta ao padrão. */
export function resolveAccent(overrides?: unknown): string {
  const raw = overrides && typeof overrides === "object" ? (overrides as Record<string, unknown>).accent : undefined;
  const accent = typeof raw === "string" ? raw.toLowerCase() : "";
  return HEX.test(accent) && accentProblems(accent).length === 0 ? accent : DEFAULT_ACCENT;
}

/**
 * Destaque no escuro: o mesmo tom, clareado até o texto passar de 4,5:1 sobre o modal (a superfície
 * mais clara) e sobre a própria tinta dele (selos como "bg-accent/15 text-accent").
 */
function darkAccent(accent: string): string {
  const { raised } = BASE.dark;
  const readable = (c: string) => contrastRatio(c, raised) >= 4.5 && contrastRatio(c, mixHex(raised, c, 0.15)) >= 4.5;
  const [h, s, l0] = hexToHsl(accent);
  let l = l0;
  let color = accent;
  while (!readable(color) && l < 1) {
    l = Math.min(1, l + 0.01);
    color = hslToHex(h, s, l);
  }
  return color;
}

/** Preto ou branco, o que tiver mais contraste sobre o destaque. */
function inkOn(accent: string): string {
  return contrastRatio(accent, INK_ON_ACCENT.light) >= contrastRatio(accent, INK_ON_ACCENT.dark) ? INK_ON_ACCENT.light : INK_ON_ACCENT.dark;
}

/** Paleta de um tema a partir do destaque da marca. Aceita só um destaque que já passou em `accentProblems`. */
export function buildPalette(mode: ThemeMode, accent: string = DEFAULT_ACCENT): Palette {
  const base = HEX.test(accent) ? accent.toLowerCase() : DEFAULT_ACCENT;
  const color = mode === "dark" ? darkAccent(base) : base;
  return { ...BASE[mode], accent: color, "accent-ink": inkOn(color) };
}

export function buildPalettes(accent: string = DEFAULT_ACCENT): Record<ThemeMode, Palette> {
  return { light: buildPalette("light", accent), dark: buildPalette("dark", accent) };
}

/** Variáveis CSS lidas pelo Tailwind (--color-*). */
export function paletteToCssVars(p: Palette): Record<string, string> {
  return Object.fromEntries(THEME_TOKENS.map((t) => [`--color-${t}`, p[t]]));
}

/**
 * CSS que o layout raiz escreve no `<head>`. `html:root` (claro) tem mais peso que o `:root` do
 * Tailwind; `data-theme="system"` só escurece quando o sistema operacional pede. Todo valor sai de
 * constantes e de um destaque já validado como #rrggbb, então não há texto livre no CSS.
 */
export function themeStyleSheet(accent: string = DEFAULT_ACCENT): string {
  const { light, dark } = buildPalettes(accent);
  const declarations = (p: Palette, scheme: ThemeMode) =>
    `${Object.entries(paletteToCssVars(p)).map(([k, v]) => `${k}:${v}`).join(";")};color-scheme:${scheme}`;
  return [
    `html:root{${declarations(light, "light")}}`,
    `html[data-theme="dark"]{${declarations(dark, "dark")}}`,
    `@media (prefers-color-scheme: dark){html[data-theme="system"]{${declarations(dark, "dark")}}}`,
  ].join("\n");
}

/** RN-112: combinações que ficariam ilegíveis são recusadas (WCAG AA: 4,5:1 para texto, 3:1 para bordas de campo). */
export function paletteProblems(p: Palette): string[] {
  const checks: [ThemeToken, ThemeToken, number, string][] = [
    ["ink", "paper", 4.5, "Texto sobre o fundo"],
    ["ink", "sheet", 4.5, "Texto sobre os painéis"],
    ["ink", "raised", 4.5, "Texto sobre modais e pop-overs"],
    // G1: "muted" é usado como texto de leitura (descrições, contagens), não só decoração —
    // por isso precisa do mesmo mínimo de texto normal (4.5:1), não do mínimo de borda (3:1).
    ["muted", "sheet", 4.5, "Texto secundário sobre os painéis"],
    ["muted", "paper", 4.5, "Texto secundário sobre o fundo"],
    ["muted", "raised", 4.5, "Texto secundário sobre modais e pop-overs"],
    ["accent-ink", "accent", 4.5, "Texto dos botões"],
    ["accent", "sheet", 4.5, "Links sobre os painéis"],
    ["accent", "paper", 4.5, "Links sobre o fundo"],
    ["accent", "raised", 4.5, "Links sobre modais e pop-overs"],
    ["wait", "sheet", 4.5, "Pendências sobre os painéis"],
    ["wait", "paper", 4.5, "Pendências sobre o fundo"],
    ["wait", "raised", 4.5, "Pendências sobre modais e pop-overs"],
    ["danger", "sheet", 4.5, "Avisos de perigo sobre os painéis"],
    ["danger", "paper", 4.5, "Avisos de perigo sobre o fundo"],
    ["danger", "raised", 4.5, "Avisos de perigo sobre modais e pop-overs"],
    // WCAG 1.4.11: a borda é o que identifica o campo, então precisa de 3:1 contra o campo e contra onde ele fica.
    ["line-strong", "field", 3, "Borda dos campos sobre o fundo do campo"],
    ["line-strong", "sheet", 3, "Borda dos campos sobre os painéis"],
    ["line-strong", "paper", 3, "Borda dos campos sobre o fundo"],
    ["line-strong", "raised", 3, "Borda dos campos sobre modais e pop-overs"],
  ];
  return checks
    .filter(([a, b, min]) => contrastRatio(p[a], p[b]) < min)
    .map(([a, b, min, label]) => `${label}: contraste ${ratio(contrastRatio(p[a], p[b]))}:1, mínimo ${ratio(min)}:1.`);
}
