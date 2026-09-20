import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserForm } from "../UserForm";
import { getStaffUser } from "../actions";

export const metadata: Metadata = { title: "Edit Staff User | Masaar Admin", robots: { index: false } };

export default async function EditStaffUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getStaffUser(id);
  if (!user) notFound();

  return <UserForm user={user} />;
}
