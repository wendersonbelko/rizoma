import { sha256 } from "./crypto";
import { parseHubManifest } from "./hub-file";

/** Página criada a partir do README. A gravação devolve esse slug para README.md. */
export const README_DOC_SLUG = "readme";

export const README_CANDIDATES = ["README.md", "README.markdown"] as const;
export const OPENAPI_CANDIDATES = [
  "openapi.yaml", "openapi.yml", "openapi.json",
  "swagger.json", "swagger.yaml", "swagger.yml",
  "docs/openapi.yaml", "docs/openapi.yml", "docs/openapi.json",
] as const;
export const MANIFEST_CANDIDATES = ["package.json", "go.mod", "pyproject.toml", "pom.xml", "composer.json", "Cargo.toml"] as const;

const PACKAGE_TECH: [string, string][] = [
  ["next", "Next.js"],
  ["react", "React"],
  ["vue", "Vue"],
  ["@angular/core", "Angular"],
  ["express", "Express"],
  ["fastify", "Fastify"],
  ["@nestjs/core", "NestJS"],
  ["prisma", "Prisma"],
];

export type SyncField = "description" | "tags" | "readme" | "spec" | "hub";

export type SyncAction =
  | { field: SyncField; kind: "fill"; value: string }
  | { field: SyncField; kind: "conflict"; hub: string; git: string }
  | { field: SyncField; kind: "match" };

export function docRepoPath(slug: string): string {
  return slug === README_DOC_SLUG ? "README.md" : `docs/${slug}.md`;
}

/** Título da primeira página: o primeiro heading, ou "Leia-me". */
export function readmeTitle(markdown: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/[#*`]/g, "").trim() ?? "";
  return heading.length >= 2 ? heading.slice(0, 80) : "Leia-me";
}

export function technologyFromFileName(fileName: string): string[] {
  return fileName.toLowerCase().endsWith(".csproj") ? [".NET"] : [];
}

/** Linguagem e alguns frameworks declarados no manifesto. Não lista toda dependência. */
export function technologiesFromManifest(path: string, text: string): string[] {
  const file = path.split("/").pop() ?? path;
  const found = new Set<string>(technologyFromFileName(file));
  const lower = text.toLowerCase();
  if (file === "package.json") {
    found.add("Node.js");
    let deps: Record<string, unknown>;
    try {
      const pkg = JSON.parse(text) as { dependencies?: Record<string, unknown>; devDependencies?: Record<string, unknown> };
      deps = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch {
      return [...found];
    }
    for (const [name, label] of PACKAGE_TECH) if (name in deps) found.add(label);
  } else if (file === "go.mod") found.add("Go");
  else if (file === "pyproject.toml") {
    found.add("Python");
    if (/\bdjango\b/.test(lower)) found.add("Django");
    if (lower.includes("fastapi")) found.add("FastAPI");
    if (/\bflask\b/.test(lower)) found.add("Flask");
  } else if (file === "pom.xml") {
    found.add("Java");
    if (lower.includes("springframework")) found.add("Spring");
  } else if (file === "composer.json") {
    found.add("PHP");
    if (lower.includes("laravel/framework")) found.add("Laravel");
    if (lower.includes("symfony/framework-bundle")) found.add("Symfony");
  } else if (file === "Cargo.toml") found.add("Rust");
  return [...found];
}

function sameText(a: string, b: string): boolean {
  return a.replace(/\r\n/g, "\n").trim() === b.replace(/\r\n/g, "\n").trim();
}

function tagsKey(tags: string[]): string {
  return [...new Set(tags.map((t) => t.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)).join("\n");
}

function hubCanonical(text: string): string | null {
  const parsed = parseHubManifest(text);
  return parsed.ok ? JSON.stringify(parsed.manifest) : null;
}

/** O que preencher, o que já bate e o que um administrador precisa escolher. Campo vazio no Git não gera ação. */
export function planRepoSync(input: {
  description: { hub: string; git: string };
  tags: { hub: string[]; git: string[] };
  readme: { hub: string | null; git: string | null; hasOtherDocs: boolean };
  spec: { hubPath: string; hasPublishedSpec: boolean; gitPath: string | null };
  hubFile: { hub: string; git: string | null; hubIsEmpty: boolean };
}): SyncAction[] {
  const actions: SyncAction[] = [];

  const gitDescription = input.description.git.trim();
  const hubDescription = input.description.hub.trim();
  if (gitDescription) {
    if (!hubDescription) actions.push({ field: "description", kind: "fill", value: gitDescription });
    else if (hubDescription === gitDescription) actions.push({ field: "description", kind: "match" });
    else actions.push({ field: "description", kind: "conflict", hub: hubDescription, git: gitDescription });
  }

  const gitTags = tagsKey(input.tags.git);
  const hubTags = tagsKey(input.tags.hub);
  if (gitTags) {
    if (!hubTags) actions.push({ field: "tags", kind: "fill", value: gitTags });
    else if (hubTags === gitTags) actions.push({ field: "tags", kind: "match" });
    else actions.push({ field: "tags", kind: "conflict", hub: hubTags, git: gitTags });
  }

  const gitReadme = input.readme.git?.trim() ? input.readme.git : null;
  if (gitReadme) {
    if (input.readme.hub === null && !input.readme.hasOtherDocs) actions.push({ field: "readme", kind: "fill", value: gitReadme });
    else if (input.readme.hub !== null && sameText(input.readme.hub, gitReadme)) actions.push({ field: "readme", kind: "match" });
    else if (input.readme.hub !== null) actions.push({ field: "readme", kind: "conflict", hub: input.readme.hub, git: gitReadme });
  }

  const gitSpec = input.spec.gitPath;
  if (gitSpec) {
    if (!input.spec.hasPublishedSpec && !input.spec.hubPath) actions.push({ field: "spec", kind: "fill", value: gitSpec });
    else if (input.spec.hubPath && input.spec.hubPath === gitSpec) actions.push({ field: "spec", kind: "match" });
    else if (input.spec.hubPath && input.spec.hubPath !== gitSpec) actions.push({ field: "spec", kind: "conflict", hub: input.spec.hubPath, git: gitSpec });
  }

  const gitHub = input.hubFile.git;
  if (gitHub !== null && gitHub.trim()) {
    if (input.hubFile.hubIsEmpty) actions.push({ field: "hub", kind: "fill", value: gitHub });
    else if (hubCanonical(input.hubFile.hub) !== null && hubCanonical(input.hubFile.hub) === hubCanonical(gitHub)) actions.push({ field: "hub", kind: "match" });
    else actions.push({ field: "hub", kind: "conflict", hub: input.hubFile.hub, git: gitHub });
  }

  return actions;
}

/** Não reescreve um arquivo que mudou no Git desde a última sincronização. */
export function fileWriteDecision(lastHash: string | undefined, remote: string | null, desired: string): "write" | "skip" | "conflict" {
  const desiredHash = sha256(desired.replace(/\r\n/g, "\n"));
  if (remote === null) return "write";
  const remoteHash = sha256(remote.replace(/\r\n/g, "\n"));
  if (remoteHash === desiredHash) return "skip";
  // Sem snapshot anterior, um arquivo diferente no Git não é sobrescrito.
  if (lastHash && lastHash === remoteHash) return "write";
  return "conflict";
}

export function contentHash(text: string): string {
  return sha256(text.replace(/\r\n/g, "\n"));
}
