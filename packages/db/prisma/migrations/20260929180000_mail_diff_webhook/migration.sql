-- SMTP, diff de spec, índice de endpoints, segredo de webhook e token do cron.

ALTER TABLE "Installation" ADD COLUMN "syncTokenHash" TEXT;

ALTER TABLE "SourceIntegration" ADD COLUMN "webhookSecretEnc" TEXT;

CREATE TABLE "MailSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "user" TEXT,
    "passwordEnc" TEXT,
    "fromAddress" TEXT NOT NULL,
    "publicBaseUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ApiSpec" ADD COLUMN "changeSummary" JSONB;

CREATE TABLE "SpecOperation" (
    "serviceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    CONSTRAINT "SpecOperation_pkey" PRIMARY KEY ("serviceId","environmentId","method","path")
);

CREATE INDEX "SpecOperation_path_idx" ON "SpecOperation"("path");

ALTER TABLE "UserInvite" ALTER COLUMN "createdById" DROP NOT NULL;
