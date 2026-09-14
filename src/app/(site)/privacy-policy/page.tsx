import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: "/privacy-policy", title: "Privacy Policy | Masaar Holidays" });
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      note="Legal copy pending — should be drafted/reviewed by Haseeb or counsel before publishing, alongside the registered-entity details still marked placeholder in the footer."
    />
  );
}
