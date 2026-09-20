import type { Metadata } from "next";
import { PasswordSecurityClient } from "./PasswordSecurityClient";
import { getMfaFactors } from "./actions";

export const metadata: Metadata = { title: "Password & 2FA | Masaar Admin", robots: { index: false } };

export default async function PasswordTwoFactorPage() {
  const factors = await getMfaFactors();
  return <PasswordSecurityClient initialFactors={factors} />;
}
