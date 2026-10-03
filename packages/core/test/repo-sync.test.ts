import { describe, expect, it } from "vitest";
import { contentHash, docRepoPath, fileWriteDecision, planRepoSync, readmeTitle, technologiesFromManifest } from "../src/repo-sync";

const empty = {
  description: { hub: "", git: "" },
  tags: { hub: [] as string[], git: [] as string[] },
  readme: { hub: null as string | null, git: null as string | null, hasOtherDocs: false },
  spec: { hubPath: "", hasPublishedSpec: false, gitPath: null as string | null },
  hubFile: { hub: "", git: null as string | null, hubIsEmpty: true },
};

describe("sincronização com o repositório", () => {
  it("tira o título do primeiro heading e manda o readme para a raiz", () => {
    expect(readmeTitle("# Pedidos API\n\nTexto.")).toBe("Pedidos API");
    expect(readmeTitle("sem título")).toBe("Leia-me");
    expect(docRepoPath("readme")).toBe("README.md");
    expect(docRepoPath("regras-de-negocio")).toBe("docs/regras-de-negocio.md");
  });

  it("reconhece a linguagem e um framework, sem listar toda dependência", () => {
    const pkg = JSON.stringify({ dependencies: { next: "15.0.0", leftpad: "1.0.0" } });
    expect(technologiesFromManifest("package.json", pkg)).toEqual(["Node.js", "Next.js"]);
    expect(technologiesFromManifest("go.mod", "module example.com/pedidos\n")).toEqual(["Go"]);
    expect(technologiesFromManifest("pom.xml", "<dependency>org.springframework</dependency>")).toEqual(["Java", "Spring"]);
  });

  it("preenche o que está vazio e abre conflito quando os dois lados diferem", () => {
    const actions = planRepoSync({
      ...empty,
      description: { hub: "", git: "API de pedidos" },
      tags: { hub: ["pagamentos"], git: ["Node.js"] },
      readme: { hub: null, git: "# Pedidos\n", hasOtherDocs: false },
      spec: { hubPath: "docs/old.yaml", hasPublishedSpec: false, gitPath: "openapi.yaml" },
    });
    expect(actions.find((a) => a.field === "description")).toMatchObject({ kind: "fill", value: "API de pedidos" });
    expect(actions.find((a) => a.field === "tags")).toMatchObject({ kind: "conflict" });
    expect(actions.find((a) => a.field === "readme")).toMatchObject({ kind: "fill" });
    expect(actions.find((a) => a.field === "spec")).toMatchObject({ kind: "conflict", hub: "docs/old.yaml", git: "openapi.yaml" });
  });

  it("não troca a origem da spec quando o CI já publicou e o caminho está vazio", () => {
    const actions = planRepoSync({ ...empty, spec: { hubPath: "", hasPublishedSpec: true, gitPath: "openapi.yaml" } });
    expect(actions.some((a) => a.field === "spec")).toBe(false);
  });

  it("não importa o README quando o serviço já tem outra página", () => {
    const actions = planRepoSync({ ...empty, readme: { hub: null, git: "# Pedidos\n", hasOtherDocs: true } });
    expect(actions.some((a) => a.field === "readme")).toBe(false);
  });

  it("recusa gravar por cima de um arquivo que mudou no Git", () => {
    expect(fileWriteDecision(undefined, null, "novo")).toBe("write");
    expect(fileWriteDecision(undefined, "igual", "igual")).toBe("skip");
    expect(fileWriteDecision(undefined, "deles", "nosso")).toBe("conflict");
    expect(fileWriteDecision(undefined, "nosso", "nosso")).toBe("skip");
    expect(fileWriteDecision(contentHash("nosso"), "nosso", "novo")).toBe("write");
  });
});
