import type { Metadata } from "next";
import { PasswordSecurityClient } from "./PasswordSecurityClient";

export const metadata: Metadata = { title: "Change Password | Masaar Admin", robots: { index: false } };

export default function PasswordTwoFactorPage() {
  return <PasswordSecurityClient />;
}
