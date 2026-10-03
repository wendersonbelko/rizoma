# syntax=docker/dockerfile:1.7
# Imagem de produção do API Hub.
#   docker build -t api-hub .                       → app (alvo padrão "runner")
#   docker build -t api-hub-migrate --target migrate .  → migrações e comandos administrativos

ARG NODE_VERSION=22-bookworm-slim

FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
# openssl: o schema engine do "prisma migrate" (estágio migrate) depende dele.
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# Dependências (cache separado do código)
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY docs/package.json docs/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build
FROM deps AS build
COPY . .
RUN pnpm --filter @api-hub/db generate
# Variáveis fictícias só para o build; os valores reais entram no runtime.
RUN AUTH_SECRET=build-only DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm --filter @api-hub/web build

# Migrações + CLI administrativo (pnpm admin:recover)
FROM deps AS migrate
COPY . .
RUN pnpm --filter @api-hub/db generate
CMD ["pnpm", "db:deploy"]

# Runtime enxuto
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd -r app && useradd -r -g app app
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
