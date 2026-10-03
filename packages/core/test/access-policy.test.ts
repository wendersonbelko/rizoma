import { describe, expect, it } from "vitest";
import { decideAccess, REASON_ORG_LOST } from "../src/access-policy";

const policy = { autoApproveOrgMembers: true, outsiderPolicy: "REQUEST_APPROVAL" as const };

describe("decideAccess", () => {
  it("primeiro admin vira OWNER", () => {
    const d = decideAccess({ current: null, isOrgMember: false, isOwnerClaim: true, policy });
    expect(d).toMatchObject({ kind: "set", status: "ACTIVE", role: "OWNER" });
  });
  it("membro da org entra direto como VIEWER", () => {
    const d = decideAccess({ current: null, isOrgMember: true, isOwnerClaim: false, policy });
    expect(d).toMatchObject({ status: "ACTIVE", role: "VIEWER", accessGrant: "ORG_MEMBERSHIP" });
  });
  it("de fora da org gera pedido de aprovação", () => {
    const d = decideAccess({ current: null, isOrgMember: false, isOwnerClaim: false, policy });
    expect(d).toMatchObject({ status: "PENDING", createRequest: true });
  });
  it("de fora da org é barrado com política BLOCK", () => {
    const d = decideAccess({ current: null, isOrgMember: false, isOwnerClaim: false, policy: { ...policy, outsiderPolicy: "BLOCK" } });
    expect(d.kind).toBe("deny");
  });
  it("quem sai da org é suspenso e volta sozinho ao retornar", () => {
    const active = { status: "ACTIVE" as const, accessGrant: "ORG_MEMBERSHIP" as const, statusReason: null, accessExpiresAt: null };
    const out = decideAccess({ current: active, isOrgMember: false, isOwnerClaim: false, policy });
    expect(out).toMatchObject({ status: "SUSPENDED", statusReason: REASON_ORG_LOST });
    const back = decideAccess({ current: { ...active, status: "SUSPENDED", statusReason: REASON_ORG_LOST }, isOrgMember: true, isOwnerClaim: false, policy });
    expect(back).toMatchObject({ status: "ACTIVE" });
  });
  it("aprovação manual com prazo vencido suspende", () => {
    const d = decideAccess({
      current: { status: "ACTIVE", accessGrant: "MANUAL_APPROVAL", statusReason: null, accessExpiresAt: new Date("2020-01-01") },
      isOrgMember: false, isOwnerClaim: false, policy,
    });
    expect(d).toMatchObject({ status: "SUSPENDED" });
  });
});
