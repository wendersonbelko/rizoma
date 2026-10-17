import { notFound } from "next/navigation";
import { prisma } from "@api-hub/db";
import { getInstallation } from "@/lib/install";
import { SignupForm } from "./form";
import { HubLogo } from "@/components/hub-logo";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const [inst, cred] = await Promise.all([getInstallation(), prisma.authProvider.findUnique({ where: { type: "CREDENTIALS" } })]);
  if (!inst.installed || !cred?.enabled || !cred.allowSignup || inst.outsiderPolicy === "BLOCK") notFound();
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <HubLogo className="mb-4 size-12" />
        <p className="text-sm text-muted">{inst.appName}</p>
        <h1 className="mb-2 text-2xl font-bold">Pedir acesso</h1>
        <p className="mb-6 text-muted">Um administrador revisa toda solicitação antes de liberar.</p>
        <SignupForm />
      </div>
    </main>
  );
}
