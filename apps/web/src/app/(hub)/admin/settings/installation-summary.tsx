import { prisma } from "@api-hub/db";
import { personLabel } from "@api-hub/core";
import { getInstallation } from "@/lib/install";

/**
 * Linha de apoio do cabeçalho: desde quando o hub está instalado e quem são os Proprietários.
 * Só quem gerencia as configurações vê isso; quem só muda a aparência recebe uma frase do que a página tem para ele.
 */
export async function InstallationSummary({ canManage }: { canManage: boolean }) {
  if (!canManage) return <p className="text-muted">Nome do sistema e cor de destaque.</p>;
  const [inst, owners] = await Promise.all([
    getInstallation(),
    prisma.user.findMany({ where: { role: "OWNER", status: "ACTIVE" }, select: { name: true, githubLogin: true, email: true } }),
  ]);
  return (
    <p className="text-muted">
      Instalado em {inst.installedAt?.toLocaleDateString("pt-BR") ?? "—"}. Proprietários: {owners.map((o) => personLabel(o)).join(", ") || "nenhum ativo"}.
      {owners.length < 2 && " Recomendado ter pelo menos dois Proprietários ativos."}
    </p>
  );
}
