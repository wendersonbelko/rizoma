import { prisma } from "@api-hub/db";
import { requirePermission } from "@/lib/guards";
import { getPermissionMatrix } from "@/lib/install";
import { DangerAction, DangerZone } from "@/components/danger-zone";
import { resetPermissions } from "./actions";
import { PermissionMatrix } from "./matrix";

/**
 * Permissões. A página rola inteira, como as outras (achado D5 da auditoria de UX de 02/10/2026): o
 * cabeçalho da matriz gruda na rolagem da página, sem barra interna. "Restaurar padrão" é a ação
 * destrutiva da página e fica numa zona de perigo no fim (achado F3), com confirmação.
 */
export default async function PermissionsPage() {
  await requirePermission("roles:manage");
  const [matrix, counts] = await Promise.all([
    getPermissionMatrix(),
    prisma.user.groupBy({ by: ["role"], where: { status: "ACTIVE" }, _count: true }),
  ]);
  return (
    <div className="max-w-5xl space-y-8">
      <PermissionMatrix
        initial={{ ADMIN: [...matrix.ADMIN], MAINTAINER: [...matrix.MAINTAINER], VIEWER: [...matrix.VIEWER] }}
        counts={Object.fromEntries(counts.map((c) => [c.role, c._count]))}
      />
      <div data-tour="permissions-reset">
        <DangerZone>
          <DangerAction
            title="Restaurar permissões padrão"
            description="Volta a matriz ao padrão de cada papel e descarta tudo o que foi personalizado. A mudança vale na próxima página que cada pessoa abrir."
            actionLabel="Restaurar padrão"
            action={resetPermissions}
          />
        </DangerZone>
      </div>
    </div>
  );
}
