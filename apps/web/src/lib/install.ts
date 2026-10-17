import { cache } from "react";
import { cookies } from "next/headers";
import { Prisma, prisma } from "@api-hub/db";
import { DEFAULT_ACCENT, THEME_COOKIE, buildMatrix, readThemeCookie, resolveAccent } from "@api-hub/core";

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

/**
 * Marca da instalação (nome e cor de destaque, definidos pelo admin) e a escolha de tema desta
 * pessoa (cookie `rizoma-theme`: claro, escuro ou sistema). Achado F5 da auditoria de UX de
 * 02/10/2026: o tema deixou de ser global; o admin só decide a marca.
 *
 * `dark` é verdadeiro só quando a pessoa escolheu Escuro. Em "sistema" o servidor não sabe o que o
 * navegador prefere (quem decide é o CSS), então fica falso.
 */
export const getTheme = cache(async () => {
  const choice = readThemeCookie((await cookies()).get(THEME_COOKIE)?.value);
  const dark = choice === "dark";
  try {
    const inst = await getInstallation();
    return { accent: resolveAccent(inst.themeOverrides), appName: inst.appName, choice, dark };
  } catch {
    // Banco indisponível (ex.: build): marca padrão.
    return { accent: DEFAULT_ACCENT, appName: "Rizoma", choice, dark };
  }
});
