import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getLegalPage } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: "/privacy-policy", title: "Privacy Policy | Masaar Holidays" });
}

export default async function PrivacyPolicyPage() {
  const legal = await getLegalPage("privacy_policy");
  return (
    <LegalPage
      title={legal?.title ?? "Privacy Policy"}
      content={legal?.content}
      updatedAt={legal?.updated_at}
      note="Legal copy pending — should be drafted/reviewed by counsel before publishing, alongside the registered-entity details still marked placeholder in the footer."
    />
  );
}
