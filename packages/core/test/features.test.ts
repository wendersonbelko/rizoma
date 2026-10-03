import { describe, expect, it } from "vitest";
import { branchMatches, resolveEnvironment } from "../src/environments";
import { hashPassword, passwordProblems, verifyPassword } from "../src/password";
import { affiliationFromProfile, emailDomainAllowed } from "../src/affiliation";
import { providerInputSchema } from "../src/auth-providers";
import { contrastRatio, paletteProblems, resolveTheme } from "../src/themes";
import { expandEnvTemplate, repoFileApiUrl, unsafeHostReason } from "../src/sources";
import { looksSecret, toDotenv } from "../src/envvars";

describe("ambientes por branch", () => {
  const envs = [
    { id: "d", slug: "dev", branchPatterns: ["develop", "feature/**"], position: 0 },
    { id: "h", slug: "hml", branchPatterns: ["release/*"], position: 1 },
    { id: "p", slug: "prod", branchPatterns: ["main"], position: 2 },
  ];
  it("resolve pelo padrão, com * sem barra e ** com barra", () => {
    expect(resolveEnvironment(envs, "main")?.slug).toBe("prod");
    expect(resolveEnvironment(envs, "refs/heads/release/2.4")?.slug).toBe("hml");
    expect(resolveEnvironment(envs, "release/2.4/hotfix")).toBeNull();
    expect(resolveEnvironment(envs, "feature/pagamento/pix")?.slug).toBe("dev");
    expect(branchMatches(["hotfix-*"], "hotfix-12")).toBe(true);
  });
});

describe("senha", () => {
  it("hash scrypt verifica e rejeita", async () => {
    const h = await hashPassword("Correta-Cavalo-9");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Correta-Cavalo-9", h)).toBe(true);
    expect(await verifyPassword("errada", h)).toBe(false);
    expect(await verifyPassword("x", null)).toBe(false);
  });
  it("regras de senha", () => {
    expect(passwordProblems("curta")).not.toEqual([]);
    expect(passwordProblems("marinaCosta#2026", "marinacosta@acme.com")[0]).toMatch(/e-mail/);
    expect(passwordProblems("Tr3s-Tigres-Tristes")).toEqual([]);
  });
});

describe("vínculo com a empresa", () => {
  it("domínio e subdomínio", () => {
    expect(emailDomainAllowed("ana@time.acme.com", ["acme.com"])).toBe(true);
    expect(emailDomainAllowed("ana@acme.com.evil.io", ["acme.com"])).toBe(false);
  });
  it("Google exige e-mail verificado; Microsoft aceita pelo tenant; Facebook nunca", () => {
    const cfg = { allowedEmailDomains: ["acme.com"], tenantId: "11111111-2222-3333-4444-555555555555" };
    expect(affiliationFromProfile("GOOGLE", { email: "a@acme.com", email_verified: false }, cfg)).toBe("not_member");
    expect(affiliationFromProfile("GOOGLE", { email: "a@acme.com", email_verified: true }, cfg)).toBe("member");
    expect(affiliationFromProfile("MICROSOFT", { email: "a@outro.com", tid: cfg.tenantId }, cfg)).toBe("member");
    expect(affiliationFromProfile("FACEBOOK", { email: "a@acme.com", email_verified: true }, cfg)).toBe("not_member");
  });
  it("valida configuração de provedor", () => {
    expect(providerInputSchema.safeParse({ type: "GOOGLE", clientId: "abc", clientSecret: "12345678" }).success).toBe(false);
    expect(providerInputSchema.safeParse({ type: "OIDC", clientId: "hub", clientSecret: "12345678", issuer: "https://sso.acme.com/realms/x", label: "Keycloak" }).success).toBe(true);
    expect(providerInputSchema.safeParse({ type: "CREDENTIALS", allowSignup: true }).success).toBe(true);
  });
});

describe("temas", () => {
  it("sobrescreve só cores válidas e mede contraste", () => {
    const t = resolveTheme("oceano", { accent: "#FF0000", ink: "vermelho", xyz: "#000000" });
    expect(t.palette.accent).toBe("#ff0000");
    // "oceano" não existe: cai na prancheta e ignora ink inválido.
    expect(t.palette.ink).toBe("#16242c");
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("todos os temas prontos passam na checagem de contraste", async () => {
    const { THEMES } = await import("../src/themes");
    for (const th of THEMES) expect(paletteProblems(th.palette), th.id).toEqual([]);
  });
  it("recusa botão ilegível", () => {
    const t = resolveTheme("prancheta", { accent: "#eeeeee", "accent-ink": "#ffffff" });
    expect(paletteProblems(t.palette).join()).toMatch(/botões/);
  });
});

describe("origens e variáveis", () => {
  it("URL por ambiente e arquivo por provedor", () => {
    expect(expandEnvTemplate("https://pedidos.{env}.acme.internal/openapi.json", "hml")).toBe("https://pedidos.hml.acme.internal/openapi.json");
    expect(repoFileApiUrl("GITLAB", null, "acme/backend/pedidos", "docs/openapi.yaml", "main")?.url).toBe(
      "https://gitlab.com/api/v4/projects/acme%2Fbackend%2Fpedidos/repository/files/docs%2Fopenapi.yaml/raw?ref=main");
    expect(repoFileApiUrl("GITHUB", null, "acme/pedidos", "openapi.yaml", "release/1")?.url).toContain("?ref=release%2F1");
  });
  it("bloqueia metadados de nuvem e loopback", () => {
    expect(unsafeHostReason("169.254.169.254")).not.toBeNull();
    expect(unsafeHostReason("127.0.0.1")).not.toBeNull();
    expect(unsafeHostReason("pedidos.internal")).toBeNull();
  });
  it("segredos: detecção e .env sem valor", () => {
    expect(looksSecret("STRIPE_API_KEY")).toBe(true);
    expect(looksSecret("LOG_LEVEL")).toBe(false);
    expect(toDotenv([{ key: "LOG_LEVEL", value: "info", isSecret: false }, { key: "DB_PASSWORD", value: null, isSecret: true }], "x")).toContain("DB_PASSWORD=\n");
  });
});
