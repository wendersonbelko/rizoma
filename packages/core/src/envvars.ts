export const ENV_KEY_REGEX = /^[A-Z_][A-Z0-9_]{0,127}$/;

/** Nomes que quase sempre guardam segredo: a tela marca como segredo por padrão (RN-83). */
export function looksSecret(key: string): boolean {
  return /(SECRET|TOKEN|PASSWORD|PASSWD|PWD|PRIVATE|CREDENTIAL|API_?KEY|ACCESS_?KEY|_KEY$|DSN|CONNECTION_STRING)/.test(key);
}

function quote(v: string): string {
  return /^[A-Za-z0-9_./:@,-]*$/.test(v) ? v : `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

/** Arquivo .env de um ambiente. Segredos saem vazios com um comentário (RN-86). */
export function toDotenv(vars: { key: string; value: string | null; isSecret: boolean }[], header: string): string {
  const lines = [`# ${header}`, ""];
  for (const v of [...vars].sort((a, b) => a.key.localeCompare(b.key))) {
    if (v.isSecret) lines.push(`# segredo: peça a quem mantém o serviço`, `${v.key}=`);
    else lines.push(`${v.key}=${quote(v.value ?? "")}`);
  }
  return lines.join("\n") + "\n";
}
