import { describe, expect, it } from "vitest";
import { AUDIT_GROUPS, AUDIT_GROUP_LIST, auditGroupLabel, auditTargetName, describeAuditEvent } from "@/app/(hub)/admin/audit/events";

const phrase = (action: string, metadata: Record<string, unknown> | null = null, target?: string) =>
  describeAuditEvent({ action, metadata: metadata as never }, target);

describe("describeAuditEvent", () => {
  it("devolve frase com verbo, sem o autor", () => {
    expect(phrase("auth.sign_in")).toBe("entrou no sistema");
    expect(phrase("service.created", null, "Pedidos API")).toBe("criou o serviço Pedidos API");
    expect(phrase("link.deleted", { fromName: "Pedidos API", toName: "Estoque API" })).toBe("removeu o vínculo Pedidos API → Estoque API");
  });

  it("omite o alvo quando ele não existe e nunca escreve null ou undefined", () => {
    expect(phrase("service.created")).toBe("criou um serviço");
    expect(phrase("team.created")).toBe("criou um time");
    expect(phrase("user.tour_completed")).toBe("concluiu o tour guiado");
    expect(phrase("access.requested")).toBe("pediu acesso");
    for (const action of ["service.updated", "link.created", "team.member_added", "user.role_changed", "access.approved", "roles.updated", "settings.sessions_revoked"]) {
      expect(phrase(action)).not.toMatch(/null|undefined|@null/);
    }
  });

  it("usa o nome do papel em português, nunca o código", () => {
    expect(phrase("user.role_changed", { from: "VIEWER", to: "MAINTAINER" }, "Ana Souza")).toBe("mudou o papel de Ana Souza de Leitor para Mantenedor");
    expect(phrase("access.approved", { role: "ADMIN" }, "Bruno Lima")).toBe("aprovou o acesso de Bruno Lima como Administrador");
    expect(phrase("user.invited", { email: "novo@empresa.com", role: "OWNER" })).toBe("convidou novo@empresa.com como Proprietário");
    expect(phrase("user.role_changed", { from: "SUPER", to: "ADMIN" })).toBe("mudou o papel para Administrador");
  });

  it("descreve a marca atualizada (pendência da F-A)", () => {
    expect(phrase("appearance.updated", { from: { appName: "Rizoma", accent: "#116a50" }, to: { appName: "Rizoma", accent: "#aa3300" } })).toBe("atualizou a marca (nome e cor de destaque)");
  });

  it("conta as mudanças da matriz de permissões", () => {
    const meta = { ADMIN: { added: ["a"], removed: [] }, VIEWER: { added: ["b", "c"], removed: ["d"] } };
    expect(phrase("roles.updated", meta)).toBe("alterou a matriz de permissões (4 mudanças)");
    expect(phrase("roles.updated", { ADMIN: { added: ["a"], removed: [] } })).toBe("alterou a matriz de permissões (1 mudança)");
  });

  it("lê `users` das sessões encerradas (e `count` dos registros antigos) e distingue a remoção de ambiente", () => {
    expect(phrase("settings.sessions_revoked", { users: 3 })).toBe("encerrou as sessões de 3 pessoas");
    expect(phrase("settings.sessions_revoked", { count: 1 })).toBe("encerrou as sessões de 1 pessoa");
    expect(phrase("settings.sessions_revoked")).toBe("encerrou as sessões de todas as pessoas");
    expect(phrase("settings.environments", { removed: "staging", envs: [] })).toBe("removeu o ambiente staging");
    expect(phrase("settings.environments", { envs: [] })).toBe("atualizou os ambientes");
  });

  it("lê o nome gravado pela ação ao adicionar e remover membros", () => {
    expect(phrase("team.member_added", { login: "ana", name: "Ana Souza" }, "Pagamentos")).toBe("adicionou Ana Souza ao time Pagamentos");
    expect(phrase("team.member_added", { login: "ana" }, "Pagamentos")).toBe("adicionou @ana ao time Pagamentos");
    expect(phrase("team.member_added", { login: "ana@empresa.com" }, "Pagamentos")).toBe("adicionou ana@empresa.com ao time Pagamentos");
    expect(phrase("team.member_removed", { name: "Ana Souza" }, "Pagamentos")).toBe("removeu Ana Souza do time Pagamentos");
  });

  it("ação sem frase própria mostra o código entre aspas", () => {
    expect(phrase("coisa.nova")).toBe('registrou a ação "coisa.nova"');
  });
});

describe("auditTargetName", () => {
  const names = { u1: "Ana Souza", s1: "Pedidos API" };
  it("some quando o alvo é o próprio autor", () => {
    expect(auditTargetName({ actorId: "u1", targetType: "user", targetId: "u1" }, names)).toBeUndefined();
  });
  it("devolve o nome do alvo de outra pessoa ou de um serviço", () => {
    expect(auditTargetName({ actorId: "u2", targetType: "user", targetId: "u1" }, names)).toBe("Ana Souza");
    expect(auditTargetName({ actorId: "u1", targetType: "service", targetId: "s1" }, names)).toBe("Pedidos API");
  });
  it("some quando o registro já não existe, em vez de mostrar o id", () => {
    expect(auditTargetName({ actorId: "u1", targetType: "service", targetId: "apagado" }, names)).toBeUndefined();
    expect(auditTargetName({ actorId: "u1", targetType: null, targetId: null }, names)).toBeUndefined();
  });
});

describe("tipos de evento", () => {
  it("cada ação cai num tipo e o filtro mantém as chaves de URL antigas", () => {
    expect(auditGroupLabel("auth.sign_in")).toBe("Login e saída");
    expect(auditGroupLabel("appearance.updated")).toBe("Configurações");
    expect(auditGroupLabel("roles.reset")).toBe("Permissões");
    expect(auditGroupLabel("algo.desconhecido")).toBe("Sistema");
    for (const old of ["auth.", "access.", "user.", "team.", "service.", "link.", "repository.", "token.", "spec.", "settings.", "owner.", "setup."]) {
      expect(AUDIT_GROUPS[old], old).toBeTruthy();
    }
  });
  it("nenhum rótulo de tipo mostra o código de papel", () => {
    expect(AUDIT_GROUP_LIST.map((g) => g.label).join(" ")).not.toMatch(/OWNER|ADMIN|MAINTAINER|VIEWER/);
  });
});
