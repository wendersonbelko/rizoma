import { redirect } from "next/navigation";
import { getInstallation } from "@/lib/install";
import { SetupWizard } from "./wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instalação · Rizoma" };

export default async function SetupPage() {
  const inst = await getInstallation();
  if (inst.installed) redirect("/");
  return <SetupWizard />;
}
