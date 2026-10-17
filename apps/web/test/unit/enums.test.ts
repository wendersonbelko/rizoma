import { describe, expect, it } from "vitest";
import {
  AccessGrant, AuthProviderType, ChannelProtocol, LinkKind, OutsiderPolicy, ResourceKind, ResourceRelation,
  Role, ServiceKind, ServiceRepoRole, SourceProviderType, SpecSource, ThemePreference, UserStatus,
} from "@prisma/client";
import { ACCESS_GRANTS, CHANNEL_PROTOCOLS, LINK_KINDS, OUTSIDER_POLICIES, RESOURCE_KIND_LABEL, RESOURCE_RELATION_LABEL, ROLES, SERVICE_KINDS, SERVICE_REPO_ROLES, THEME_PREFERENCES, THEME_PREFERENCE_LABEL, USER_STATUSES } from "@api-hub/core/types";
import { AUTH_PROVIDER_TYPES } from "@api-hub/core/auth-providers";
import { SOURCE_PROVIDERS, SPEC_SOURCE_LABEL } from "@api-hub/core/sources";

const values = (e: Record<string, string>) => Object.values(e).sort();

describe("enums do Prisma espelhados no core", () => {
  it("cada lista do core tem os mesmos valores do enum gerado", () => {
    expect(values(Role)).toEqual([...ROLES].sort());
    expect(values(UserStatus)).toEqual([...USER_STATUSES].sort());
    expect(values(AccessGrant)).toEqual([...ACCESS_GRANTS].sort());
    expect(values(OutsiderPolicy)).toEqual([...OUTSIDER_POLICIES].sort());
    expect(values(LinkKind)).toEqual([...LINK_KINDS].sort());
    expect(values(ServiceRepoRole)).toEqual([...SERVICE_REPO_ROLES].sort());
    expect(values(ServiceKind)).toEqual([...SERVICE_KINDS].sort());
    expect(values(ThemePreference)).toEqual([...THEME_PREFERENCES].sort());
    expect(values(ThemePreference)).toEqual(Object.keys(THEME_PREFERENCE_LABEL).sort());
    expect(values(ChannelProtocol)).toEqual([...CHANNEL_PROTOCOLS].sort());
    expect(values(ResourceKind)).toEqual(Object.keys(RESOURCE_KIND_LABEL).sort());
    expect(values(ResourceRelation)).toEqual(Object.keys(RESOURCE_RELATION_LABEL).sort());
    expect(values(AuthProviderType)).toEqual([...AUTH_PROVIDER_TYPES].sort());
    expect(values(SourceProviderType)).toEqual([...SOURCE_PROVIDERS].sort());
    expect(values(SpecSource)).toEqual(Object.keys(SPEC_SOURCE_LABEL).sort());
  });
});