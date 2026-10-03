export type Opt = { id: string; label: string };
export type Env = { id: string; name: string; isProduction: boolean };
export type StepId = 1 | 2 | 3 | 4;
export type Outcome = "done" | "skipped";
export type Created = { id: string; slug: string; name: string };

export const STEPS: { id: StepId; label: string; optional?: boolean }[] = [
  { id: 1, label: "Dados básicos" },
  { id: 2, label: "Time & visibilidade" },
  { id: 3, label: "Repositório", optional: true },
  { id: 4, label: "Spec inicial", optional: true },
];

export const PROVIDER_LABEL: Record<string, string> = { GITHUB: "GitHub", GITLAB: "GitLab", BITBUCKET: "Bitbucket", GENERIC: "Outro" };
