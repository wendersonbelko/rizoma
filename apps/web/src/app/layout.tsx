import type { Metadata } from "next";
import "@fontsource/schibsted-grotesk/latin-400.css";
import "@fontsource/schibsted-grotesk/latin-500.css";
import "@fontsource/schibsted-grotesk/latin-600.css";
import "@fontsource/schibsted-grotesk/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import { paletteToCssVars } from "@api-hub/core/themes";
import { getTheme } from "@/lib/install";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getTheme();
  return { title: appName, icons: { icon: "/logo.svg" }, robots: { index: false, follow: false } };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();
  // RN-110: tema escolhido pelo admin vira variáveis CSS; o Tailwind lê --color-*.
  const style = {
    ...paletteToCssVars(theme.palette),
    "--color-field": theme.dark ? theme.palette.paper : "#ffffff",
    "--font-grotesk": "'Schibsted Grotesk'",
    "--font-code": "'JetBrains Mono'",
    colorScheme: theme.dark ? "dark" : "light",
  } as React.CSSProperties;
  return (
    <html lang="pt-BR" data-theme={theme.dark ? "dark" : "light"} style={style}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
