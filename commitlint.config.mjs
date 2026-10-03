/** Conventional Commits do Rizoma. Descrição em pt-BR, minúsculas, sem ponto final. Escopos de docs/contribuindo/pull-requests.md. */

const types = ["feat", "fix", "docs", "refactor", "test", "perf", "build", "ci", "chore"];

const scopes = [
  "catalog", "service", "graph", "integrations", "variables", "people", "teams",
  "permissions", "audit", "appearance", "settings", "login", "setup", "api",
  "core", "db", "docs", "web", "ci", "deps", "release",
];

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", types],
    "scope-enum": [2, "always", scopes],
    "scope-empty": [0, "never"],
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72],
  },
};
