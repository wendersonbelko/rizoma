import { createHmac, timingSafeEqual } from "node:crypto";
import { safeEqual } from "./crypto";

/** Assinatura do GitHub e do Bitbucket: header `sha256=<hex>` do corpo cru. */
export function verifyHmacSha256(secret: string, body: string, header: string | null | undefined): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const got = header.slice("sha256=".length);
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** GitLab manda o segredo em texto no header, comparado em tempo constante. */
export function verifySharedToken(secret: string, header: string | null | undefined): boolean {
  if (!header) return false;
  return safeEqual(header, secret);
}
