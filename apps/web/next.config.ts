import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// RN-S07: cabeçalhos de segurança em todas as respostas.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://avatars.githubusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' https://github.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const config: NextConfig = {
  output: "standalone",
  // Monorepo: rastreia dependências a partir da raiz para a imagem Docker ficar completa.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/**": [
      "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**",
      "../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_compiler_bg.postgresql*",
    ],
  },
  transpilePackages: ["@api-hub/core", "@api-hub/db"],
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/cadastro", destination: "/signup", permanent: false },
      { source: "/convite/:token", destination: "/invite/:token", permanent: false },
      { source: "/redefinir/:token", destination: "/reset-password/:token", permanent: false },
      { source: "/login/esqueci", destination: "/login/forgot", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default config;
