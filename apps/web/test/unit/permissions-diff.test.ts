import { describe, expect, it } from "vitest";
import { countChanges, diffMatrix, toMatrixState } from "@/app/(hub)/admin/permissions/diff";

const base = toMatrixState({
  ADMIN: ["catalog:read", "team:manage"],
  MAINTAINER: ["catalog:read", "docs:edit"],
  VIEWER: ["catalog:read"],
});

describe("diffMatrix", () => {
  it("sem edição não há mudança", () => {
    expect(diffMatrix(base, toMatrixState({ ADMIN: ["catalog:read", "team:manage"], MAINTAINER: ["catalog:read", "docs:edit"], VIEWER: ["catalog:read"] }))).toEqual([]);
  });

  it("separa o que cada papel ganha e perde, na ordem da tela", () => {
    const edited = toMatrixState({
      ADMIN: ["catalog:read", "team:manage"],
      MAINTAINER: ["catalog:read"],
      VIEWER: ["envvars:read", "catalog:read", "graph:read"],
    });
    expect(diffMatrix(base, edited)).toEqual([
      { role: "MAINTAINER", gained: [], lost: ["docs:edit"] },
      { role: "VIEWER", gained: ["graph:read", "envvars:read"], lost: [] },
    ]);
  });

  it("conta cada célula mudada", () => {
    const edited = toMatrixState({ ADMIN: ["catalog:read"], MAINTAINER: ["catalog:read", "docs:edit", "graph:read"], VIEWER: ["catalog:read"] });
    expect(countChanges(diffMatrix(base, edited))).toBe(2);
  });
});
