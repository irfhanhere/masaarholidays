import type { Metadata } from "next";
import { getUmrahPackagesAction } from "./actions";
import { UmrahPackagesListClient } from "./UmrahPackagesListClient";

export const metadata: Metadata = {
  title: "Umrah Packages | Masaar Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function UmrahPackagesPage() {
  const { packages } = await getUmrahPackagesAction();

  return <UmrahPackagesListClient initialPackages={packages} />;
}
