UPDATE "Installation" SET "appName" = 'Rizoma' WHERE "appName" = 'API Hub';
ALTER TABLE "Installation" ALTER COLUMN "appName" SET DEFAULT 'Rizoma';
