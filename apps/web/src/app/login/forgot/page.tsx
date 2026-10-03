import { notFound } from "next/navigation";
import { mailForScreen } from "@/lib/mail";
import { ForgotPasswordForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  if (!(await mailForScreen())) notFound();
  return <ForgotPasswordForm />;
}
