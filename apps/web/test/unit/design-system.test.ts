import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../../src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = path.join(dir, entry);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(entry) ? [p] : [];
  });
}

const rel = (p: string) => path.relative(SRC, p).replace(/\\/g, "/");

/**
 * Guarda do design system: listagens tabulares só podem ser montadas com os componentes padrão
 * (components/table.tsx, components/card-list.tsx). Se este teste falhar, troque a marcação
 * feita à mão por <DataTable>/<THead>/<Th>/<TBody>/<Tr>/<Td> (ou <CardList> para itens ricos).
 */
describe("design system", () => {
  const ALLOWED = new Set(["components/table.tsx", "components/card-list.tsx"]);
  const sources = files(SRC).filter((f) => !ALLOWED.has(rel(f)));

  it("nenhuma tela monta <table>/<thead>/<tbody> à mão", () => {
    const offenders = sources.filter((f) => /<(table|thead|tbody)[\s>]/.test(readFileSync(f, "utf8"))).map(rel);
    expect(offenders).toEqual([]);
  });

  it("nenhuma tela monta lista com divisórias à mão (use DataTable ou CardList)", () => {
    const offenders = sources.filter((f) => readFileSync(f, "utf8").includes("divide-y divide-line")).map(rel);
    expect(offenders).toEqual([]);
  });

  /**
   * Toda DataTable de uma listagem que cresce com o uso recebe `pagination`. Só ficam de fora
   * tabelas de tamanho fixo — cada exceção com o motivo.
   */
  const FIXED_SIZE_TABLES: Record<string, number> = {
    "app/(hub)/admin/permissions/matrix.tsx": 1, // matriz: linhas fixas do sistema, um quadro por área
    "app/(hub)/admin/settings/login-settings.tsx": 1, // uma linha por forma de login do sistema
    "app/(hub)/admin/settings/repository-settings.tsx": 1, // uma linha por origem de código do sistema
    "app/(hub)/admin/settings/environment-settings.tsx": 1, // ambientes da instalação, no máximo 10
    "app/(hub)/integrations/[slug]/page.tsx": 1, // endereços: uma linha por ambiente
    "app/setup/database-step.tsx": 1, // migrations do próprio hub, lista curta e fixa por versão
    "app/(hub)/admin/people/person-detail.tsx": 1, // últimos 20 eventos da pessoa; o histórico completo é a visão Histórico
  };

  /** Texto da tag de abertura de cada <DataTable …> do arquivo (os `>` dentro de {…} e "…" não fecham a tag). */
  function dataTableTags(src: string): string[] {
    const tags: string[] = [];
    for (const m of src.matchAll(/<DataTable[\s>]/g)) {
      let depth = 0;
      let quote: string | null = null;
      let i = m.index!;
      for (; i < src.length; i++) {
        const c = src[i];
        if (quote) { if (c === quote) quote = null; continue; }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        else if (depth === 0 && (c === '"' || c === "'")) quote = c;
        else if (depth === 0 && c === ">") break;
      }
      tags.push(src.slice(m.index!, i + 1));
    }
    return tags;
  }

  it("toda DataTable de listagem tem paginação (exceto as de tamanho fixo)", () => {
    const problems = sources.flatMap((f) => {
      const tags = dataTableTags(readFileSync(f, "utf8"));
      const unpaginated = tags.filter((t) => !/\bpagination=\{/.test(t)).length;
      const fixed = FIXED_SIZE_TABLES[rel(f)] ?? 0;
      return unpaginated === fixed ? [] : [`${rel(f)}: ${unpaginated} tabela(s) sem paginação, ${fixed} de tamanho fixo permitida(s)`];
    });
    expect(problems, problems.join("\n")).toEqual([]);
  });
});
