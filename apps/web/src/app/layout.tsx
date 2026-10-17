import type { Metadata } from "next";
import "@fontsource/schibsted-grotesk/latin-400.css";
import "@fontsource/schibsted-grotesk/latin-500.css";
import "@fontsource/schibsted-grotesk/latin-600.css";
import "@fontsource/schibsted-grotesk/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import { themeStyleSheet } from "@api-hub/core";
import { getTheme } from "@/lib/install";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getTheme();
  return { title: appName, icons: { icon: "/logo.svg" }, robots: { index: false, follow: false } };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();
  // RN-110: o admin define só a marca (destaque); as paletas Claro e Escuro nascem dela e viram
  // variáveis CSS (o Tailwind lê --color-*). Quem decide qual vale é o data-theme, que vem do
  // cookie da pessoa (claro, escuro ou sistema), então a página já chega no tema certo, sem piscar.
  const style = {
    "--font-grotesk": "'Schibsted Grotesk'",
    "--font-code": "'JetBrains Mono'",
  } as React.CSSProperties;
  return (
    <html lang="pt-BR" data-theme={theme.choice} style={style}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyleSheet(theme.accent) }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
