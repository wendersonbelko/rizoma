-- Sem SETUP_TOKEN: o assistente não gate mais por token (produto open-source, sem chave central).
-- Instalações novas já nascem depois das etapas "Bem-vindo"/"Banco de dados" (que não usam o banco).
ALTER TABLE "Installation" ALTER COLUMN "currentStep" SET DEFAULT 'login';
