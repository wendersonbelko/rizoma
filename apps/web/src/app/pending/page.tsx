import { redirect } from "next/navigation";
import { prisma } from "@api-hub/db";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui";
import { ReasonForm } from "./reason-form";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (user.status === "ACTIVE") redirect("/");

  const request = await prisma.accessRequest.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const who = user.githubLogin ? `@${user.githubLogin}` : user.email;

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md">
        <h1 className="mb-3 text-2xl font-bold">Pedido de acesso enviado</h1>
        <p className="mb-2 text-muted">Sua conta <strong className="text-ink">{who}</strong> ainda não foi liberada. Um administrador vai revisar o pedido.</p>
        {request && (
          <p className="mb-6 text-sm text-muted">
            Enviado em {request.createdAt.toLocaleDateString("pt-BR")}. Se ninguém decidir até {request.expiresAt.toLocaleDateString("pt-BR")}, o pedido expira e você pode entrar de novo para refazê-lo.
          </p>
        )}
        {request?.status === "PENDING" && request.expiresAt > new Date() && <ReasonForm current={request.reason} />}
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <Button tone="quiet">Sair</Button>
        </form>
      </div>
    </main>
  );
}
