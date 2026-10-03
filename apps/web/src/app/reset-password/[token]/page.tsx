import { PasswordPage } from "../../invite/password-page";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PasswordPage token={token} kind="PASSWORD_RESET" />;
}
