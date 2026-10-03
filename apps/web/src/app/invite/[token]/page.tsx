import { PasswordPage } from "../password-page";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PasswordPage token={token} kind="INVITE" />;
}
