-- Tipo de sistema, canais, chamadas de endpoint e operação descontinuada.

CREATE TYPE "ServiceKind" AS ENUM ('API', 'FRONTEND', 'WORKER');
CREATE TYPE "ChannelProtocol" AS ENUM ('HTTP', 'GRPC', 'WEBSOCKET');

ALTER TABLE "Service" ADD COLUMN "kind" "ServiceKind" NOT NULL DEFAULT 'API';
ALTER TABLE "ServiceDependency" ADD COLUMN "protocol" "ChannelProtocol";
ALTER TABLE "SpecOperation" ADD COLUMN "deprecated" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ServiceChannel" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "protocol" "ChannelProtocol" NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "ServiceChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChannelAddress" (
    "channelId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "ChannelAddress_pkey" PRIMARY KEY ("channelId","environmentId")
);

CREATE TABLE "OperationCall" (
    "id" TEXT NOT NULL,
    "fromServiceId" TEXT NOT NULL,
    "toServiceId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    CONSTRAINT "OperationCall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceChannel_serviceId_protocol_name_key" ON "ServiceChannel"("serviceId", "protocol", "name");
CREATE UNIQUE INDEX "OperationCall_fromServiceId_toServiceId_method_path_key" ON "OperationCall"("fromServiceId", "toServiceId", "method", "path");

ALTER TABLE "ServiceChannel" ADD CONSTRAINT "ServiceChannel_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChannelAddress" ADD CONSTRAINT "ChannelAddress_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "ServiceChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChannelAddress" ADD CONSTRAINT "ChannelAddress_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationCall" ADD CONSTRAINT "OperationCall_fromServiceId_fkey" FOREIGN KEY ("fromServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationCall" ADD CONSTRAINT "OperationCall_toServiceId_fkey" FOREIGN KEY ("toServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
