import { prisma } from "@api-hub/db";
import { requirePermission } from "@/lib/guards";
import { getPermissionMatrix } from "@/lib/install";
import { PermissionMatrix } from "./matrix";

export default async function PermissionsPage() {
  await requirePermission("roles:manage");
  const [matrix, counts] = await Promise.all([
    getPermissionMatrix(),
    prisma.user.groupBy({ by: ["role"], where: { status: "ACTIVE" }, _count: true }),
  ]);
  return (
    <div className="flex flex-col md:-my-8 md:h-dvh md:overflow-hidden md:py-4 lg:-my-10">
      <PermissionMatrix
        initial={{ ADMIN: [...matrix.ADMIN], MAINTAINER: [...matrix.MAINTAINER], VIEWER: [...matrix.VIEWER] }}
        counts={Object.fromEntries(counts.map((c) => [c.role, c._count]))}
      />
    </div>
  );
}
