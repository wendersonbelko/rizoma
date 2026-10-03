import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyHmacSha256, verifySharedToken } from "../src/webhook";

describe("assinatura de webhook", () => {
  it("aceita o HMAC sha256 do corpo e recusa corpo alterado", () => {
    const secret = "segredo";
    const body = "{\"ref\":\"refs/heads/main\"}";
    const header = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(verifyHmacSha256(secret, body, header)).toBe(true);
    expect(verifyHmacSha256(secret, body + " ", header)).toBe(false);
    expect(verifyHmacSha256(secret, body, null)).toBe(false);
  });
  it("compara o token do GitLab sem aceitar prefixo", () => {
    expect(verifySharedToken("abc", "abc")).toBe(true);
    expect(verifySharedToken("abc", "abcd")).toBe(false);
  });
});