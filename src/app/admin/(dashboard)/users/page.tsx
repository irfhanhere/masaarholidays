import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata = { title: "Admin Users | Masaar Admin", robots: { index: false } };

export default function AdminUsersPage() {
  return (
    <ComingSoon
      title="Admin Users"
      description="Manage who can sign in to this portal — needs the Supabase Auth Admin API via lib/supabase/admin.ts (service role, server-only)."
      inspirationFile="ADMIN-USERS.png"
    />
  );
}
