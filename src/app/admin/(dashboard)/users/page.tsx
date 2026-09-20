import type { Metadata } from "next";
import { AdminUsersListClient } from "./AdminUsersListClient";
import { getCurrentUserId, listStaffUsers } from "./actions";

export const metadata: Metadata = { title: "Admin Users | Masaar Admin", robots: { index: false } };

export default async function AdminUsersPage() {
  const [users, currentUserId] = await Promise.all([listStaffUsers(), getCurrentUserId()]);

  return <AdminUsersListClient users={users} currentUserId={currentUserId} />;
}
