"use client";

import { SERVICE_REPO_ROLES, SERVICE_REPO_ROLE_LABEL, type ServiceRepoRole } from "@api-hub/core/types";
import { Field, Select } from "@/components/ui";

export function RoleField({ role, setRole }: { role: ServiceRepoRole; setRole: (r: ServiceRepoRole) => void }) {
  return (
    <Field label="Papel do repositório" hint="O que esse repositório é para o serviço.">
      <Select value={role} onChange={(e) => setRole(e.target.value as ServiceRepoRole)}>
        {SERVICE_REPO_ROLES.map((r) => <option key={r} value={r}>{SERVICE_REPO_ROLE_LABEL[r]}</option>)}
      </Select>
    </Field>
  );
}
