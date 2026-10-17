-- Tema Claro/Escuro/Sistema por pessoa (achado F5 da auditoria de UX de 02/10/2026).
-- Quem já existe começa em SYSTEM, que segue o sistema operacional, então nada muda de repente.
-- O admin passa a definir só a marca (Installation.appName e themeOverrides.accent).
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

ALTER TABLE "User" ADD COLUMN "themePreference" "ThemePreference" NOT NULL DEFAULT 'SYSTEM';
