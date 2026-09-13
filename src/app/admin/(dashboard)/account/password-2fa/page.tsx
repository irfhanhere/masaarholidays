import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata = { title: "Password & 2FA | Masaar Admin", robots: { index: false } };

export default function PasswordTwoFactorPage() {
  return (
    <ComingSoon
      title="Password & 2FA"
      description="Change password and enable 2FA via Supabase Auth (supabase.auth.updateUser / MFA enrollment)."
      inspirationFile="ADMIN-PASSWORD AND 2FA.png"
    />
  );
}
