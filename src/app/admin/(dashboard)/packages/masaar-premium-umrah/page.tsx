import type { Metadata } from "next";
import { getMasaarPremiumPackage } from "@/lib/data/premium-package";
import { PremiumPackageManagerClient } from "./PremiumPackageManagerClient";

export const metadata: Metadata = {
  title: "Masaar Premium Umrah Package Manager | Masaar Admin",
  robots: { index: false },
};

export default async function AdminMasaarPremiumUmrahPage() {
  const pkg = await getMasaarPremiumPackage();

  return <PremiumPackageManagerClient initialPackage={pkg} />;
}

