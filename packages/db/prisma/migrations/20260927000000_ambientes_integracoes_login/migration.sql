-- Ambientes por branch, variáveis de ambiente, integrações externas, documentação em Markdown
-- e múltiplas formas de login (GitHub, Google, Microsoft, GitLab, Facebook, OIDC, e-mail e senha).

-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('GITHUB', 'GOOGLE', 'MICROSOFT', 'GITLAB', 'FACEBOOK', 'OIDC', 'CREDENTIALS');
CREATE TYPE "InviteKind" AS ENUM ('INVITE', 'PASSWORD_RESET');
CREATE TYPE "ResourceKind" AS ENUM ('HTTP_API', 'QUEUE', 'TOPIC', 'WEBHOOK', 'DATABASE', 'CACHE', 'STORAGE', 'EMAIL_SMS', 'OTHER');
CREATE TYPE "ResourceRelation" AS ENUM ('CONSUMES', 'PROVIDES', 'PUBLISHES', 'SUBSCRIBES', 'SENDS_WEBHOOK', 'RECEIVES_WEBHOOK', 'READS', 'WRITES');

-- Formas de login
CREATE TABLE "AuthProvider" (
    "type" "AuthProviderType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT,
    "clientSecretEnc" TEXT,
    "issuer" TEXT,
    "tenantId" TEXT,
    "label" TEXT,
    "allowSignup" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthProvider_pkey" PRIMARY KEY ("type")
);

-- Migra o OAuth App do GitHub que estava na instalação
INSERT INTO "AuthProvider" ("type", "enabled", "clientId", "clientSecretEnc", "updatedAt")
SELECT 'GITHUB', true, "githubClientId", "githubClientSecretEnc", CURRENT_TIMESTAMP
FROM "Installation" WHERE "githubClientId" IS NOT NULL;

ALTER TABLE "Installation" DROP COLUMN "githubClientId",
DROP COLUMN "githubClientSecretEnc",
ADD COLUMN "allowedEmailDomains" TEXT[];
ALTER TABLE "Installation" RENAME COLUMN "ownerGithubLogin" TO "ownerIdentifier";
ALTER TABLE "Installation" RENAME COLUMN "recoveryGithubLogin" TO "recoveryIdentifier";

-- Login por e-mail e senha; sessões passam a ser JWT
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3),
ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

DROP TABLE "Session";

CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "kind" "InviteKind" NOT NULL DEFAULT 'INVITE',
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserInvite_tokenHash_key" ON "UserInvite"("tokenHash");
CREATE INDEX "UserInvite_email_idx" ON "UserInvite"("email");
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ambientes
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchPatterns" TEXT[],
    "color" TEXT NOT NULL DEFAULT '#5b6b70',
    "isProduction" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Environment_slug_key" ON "Environment"("slug");

INSERT INTO "Environment" ("id", "slug", "name", "branchPatterns", "color", "isProduction", "position") VALUES
  ('env_dev',  'dev',  'Desenvolvimento', '{develop,dev,feature/**}', '#2f6fa8', false, 0),
  ('env_hml',  'hml',  'Homologação',     '{release/*,homolog,hml,staging}', '#a86a12', false, 1),
  ('env_prod', 'prod', 'Produção',        '{main,master}', '#0f7a68', true, 2);

-- Specs passam a pertencer a um ambiente
ALTER TABLE "ApiSpec" ADD COLUMN "environmentId" TEXT;
UPDATE "ApiSpec" SET "environmentId" = CASE
  WHEN "branch" IN ('develop', 'dev') OR "branch" LIKE 'feature/%' THEN 'env_dev'
  WHEN "branch" LIKE 'release/%' OR "branch" IN ('homolog', 'hml', 'staging') THEN 'env_hml'
  ELSE 'env_prod' END;
ALTER TABLE "ApiSpec" ALTER COLUMN "environmentId" SET NOT NULL;

UPDATE "ApiSpec" SET "isLatest" = false;
UPDATE "ApiSpec" SET "isLatest" = true WHERE "id" IN (
  SELECT DISTINCT ON ("serviceId", "environmentId") "id" FROM "ApiSpec" ORDER BY "serviceId", "environmentId", "createdAt" DESC
);

DROP INDEX "ApiSpec_serviceId_checksum_key";
DROP INDEX "ApiSpec_serviceId_isLatest_idx";
CREATE UNIQUE INDEX "ApiSpec_serviceId_environmentId_checksum_key" ON "ApiSpec"("serviceId", "environmentId", "checksum");
CREATE INDEX "ApiSpec_serviceId_environmentId_isLatest_idx" ON "ApiSpec"("serviceId", "environmentId", "isLatest");
ALTER TABLE "ApiSpec" ADD CONSTRAINT "ApiSpec_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Variáveis de ambiente
CREATE TABLE "ServiceEnvVar" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "valueEnc" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceEnvVar_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceEnvVar_serviceId_environmentId_key_key" ON "ServiceEnvVar"("serviceId", "environmentId", "key");
ALTER TABLE "ServiceEnvVar" ADD CONSTRAINT "ServiceEnvVar_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceEnvVar" ADD CONSTRAINT "ServiceEnvVar_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrações externas
CREATE TABLE "ExternalResource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ResourceKind" NOT NULL,
    "provider" TEXT,
    "description" TEXT,
    "docsUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalResource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalResource_slug_key" ON "ExternalResource"("slug");

CREATE TABLE "ResourceEndpoint" (
    "resourceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ResourceEndpoint_pkey" PRIMARY KEY ("resourceId","environmentId")
);
ALTER TABLE "ResourceEndpoint" ADD CONSTRAINT "ResourceEndpoint_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ExternalResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceEndpoint" ADD CONSTRAINT "ResourceEndpoint_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ServiceResource" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "relation" "ResourceRelation" NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceResource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceResource_serviceId_resourceId_relation_key" ON "ServiceResource"("serviceId", "resourceId", "relation");
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ExternalResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Documentação em Markdown
CREATE TABLE "ServiceDoc" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDoc_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceDoc_serviceId_slug_key" ON "ServiceDoc"("serviceId", "slug");
ALTER TABLE "ServiceDoc" ADD CONSTRAINT "ServiceDoc_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Aparência e título
ALTER TABLE "Installation" ADD COLUMN "appName" TEXT NOT NULL DEFAULT 'API Hub',
ADD COLUMN "themeId" TEXT NOT NULL DEFAULT 'prancheta',
ADD COLUMN "themeOverrides" JSONB;

-- Permissões configuráveis (a aplicação preenche o padrão na primeira leitura)
CREATE TABLE "RolePermission" (
    "role" "Role" NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role","permission")
);

-- Origem das specs e hospedagem de código
CREATE TYPE "SourceProviderType" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET', 'GENERIC');

CREATE TABLE "SourceIntegration" (
    "type" "SourceProviderType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "baseUrl" TEXT,
    "tokenEnc" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceIntegration_pkey" PRIMARY KEY ("type")
);

ALTER TYPE "SpecSource" RENAME VALUE 'GITHUB_FILE' TO 'REPO_FILE';

ALTER TABLE "Service" RENAME COLUMN "githubSpecPath" TO "specPath";
ALTER TABLE "Service" ADD COLUMN "specRepositoryId" TEXT,
ADD COLUMN "lastSyncAt" TIMESTAMP(3),
ADD COLUMN "lastSyncError" TEXT;

ALTER TABLE "Repository" ADD COLUMN "provider" "SourceProviderType" NOT NULL DEFAULT 'GITHUB',
ADD COLUMN "externalId" TEXT;
UPDATE "Repository" SET "externalId" = "githubId"::text WHERE "githubId" IS NOT NULL;
DROP INDEX "Repository_githubId_key";
ALTER TABLE "Repository" DROP COLUMN "githubId";

ALTER TABLE "Environment" ADD COLUMN "syncBranch" TEXT;
UPDATE "Environment" SET "syncBranch" = CASE "slug" WHEN 'dev' THEN 'develop' WHEN 'hml' THEN 'homolog' WHEN 'prod' THEN 'main' END;
