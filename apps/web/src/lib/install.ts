import { cache } from "react";
import { Prisma, prisma } from "@api-hub/db";
import { buildMatrix, resolveTheme } from "@api-hub/core";

/** Linha única com o estado da instalação. Criada na primeira leitura. */
export const getInstallation = cache(async () => {
  try {
    return await prisma.installation.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
    }
    throw error;
  }
});

export const getEnvironments = cache(async () => prisma.environment.findMany({ orderBy: { position: "asc" } }));

export const getAuthProviders = cache(async () => prisma.authProvider.findMany({ where: { enabled: true } }));

export const getPermissionMatrix = cache(async () => buildMatrix(await prisma.rolePermission.findMany()));

export const getTheme = cache(async () => {
  try {
    const inst = await getInstallation();
    return { ...resolveTheme(inst.themeId, inst.themeOverrides), appName: inst.appName };
  } catch {
    // Banco indisponível (ex.: build): tema padrão.
    return { ...resolveTheme("prancheta"), appName: "Rizoma" };
  }
});
