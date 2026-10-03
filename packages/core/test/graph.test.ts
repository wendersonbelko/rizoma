import { describe, expect, it } from "vitest";
import { parseNodeId } from "../src/graph";

describe("parseNodeId", () => {
  it("reconhece cada prefixo de nó", () => {
    expect(parseNodeId("s:abc")).toEqual({ kind: "service", realId: "abc" });
    expect(parseNodeId("r:xyz")).toEqual({ kind: "repository", realId: "xyz" });
    expect(parseNodeId("t:1")).toEqual({ kind: "team", realId: "1" });
    expect(parseNodeId("p:1")).toEqual({ kind: "person", realId: "1" });
    expect(parseNodeId("x:1")).toEqual({ kind: "resource", realId: "1" });
  });
  it("devolve null para ids sem prefixo reconhecido ou malformados", () => {
    expect(parseNodeId("zz")).toBeNull();
    expect(parseNodeId("q:1")).toBeNull();
    expect(parseNodeId("s:")).toBeNull();
    expect(parseNodeId(":abc")).toBeNull();
  });
});
