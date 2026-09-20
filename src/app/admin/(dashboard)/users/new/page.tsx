import type { Metadata } from "next";
import { UserForm } from "../UserForm";

export const metadata: Metadata = { title: "Add Staff User | Masaar Admin", robots: { index: false } };

export default function NewStaffUserPage() {
  return <UserForm />;
}
