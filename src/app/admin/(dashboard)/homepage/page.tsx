import type { Metadata } from "next";
import { getHomepageCmsSettings } from "@/lib/data/homepage-cms";
import { getUmrahPackagesAction } from "../umrah-packages/actions";
import { HomepageCmsClient } from "./HomepageCmsClient";

export const metadata: Metadata = {
  title: "Homepage Content Management | Masaar Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function HomepageCmsPage() {
  const [settings, { packages }] = await Promise.all([
    getHomepageCmsSettings(),
    getUmrahPackagesAction(),
  ]);

  return <HomepageCmsClient initialSettings={settings} packages={packages} />;
}
