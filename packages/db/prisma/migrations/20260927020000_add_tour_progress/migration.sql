-- Tour guiado obrigatório (progresso por usuário). O pedido foi "todos os usuários são
-- obrigados a fazer um tour completo", então não fazemos backfill: todo mundo (inclusive
-- quem já usa o hub) começa com tourCompletedAt nulo e é levado pelo tour no próximo acesso.
ALTER TABLE "User" ADD COLUMN "tourStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tourCompletedAt" TIMESTAMP(3);
