import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const N = 2 ** 15, R = 8, P = 1, LEN = 64;
const MAXMEM = 64 * 1024 * 1024;

/** RN-S16: senhas com scrypt (N=2^15), sal aleatório por pessoa. Formato: scrypt$N$r$p$sal$hash. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, LEN, { N, r: R, p: P, maxmem: MAXMEM });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    // Mesmo custo quando a conta não existe, para não revelar e-mails cadastrados.
    await scrypt("x", randomBytes(16), LEN, { N, r: R, p: P, maxmem: MAXMEM });
    return false;
  }
  const [alg, n, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const got = await scrypt(password.normalize("NFKC"), Buffer.from(salt, "base64url"), expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM,
  });
  return got.length === expected.length && timingSafeEqual(got, expected);
}

const COMMON = ["123456", "password", "senha", "qwerty", "admin", "letmein", "111111", "abc123"];

/** RN-104: regras de senha. Retorna a lista de problemas (vazia = ok). */
export function passwordProblems(password: string, email?: string): string[] {
  const problems: string[] = [];
  if (password.length < 12) problems.push("Use pelo menos 12 caracteres.");
  if (password.length > 128) problems.push("Use no máximo 128 caracteres.");
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (classes < 3) problems.push("Misture pelo menos três tipos: minúsculas, maiúsculas, números e símbolos.");
  const lower = password.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) problems.push("Evite sequências comuns como 123456 ou senha.");
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 3 && lower.includes(local)) problems.push("A senha não pode conter seu e-mail.");
  return problems;
}

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MINUTES = 15;
