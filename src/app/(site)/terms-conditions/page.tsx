import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getLegalPage } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: "/terms-conditions", title: "Terms & Conditions | Masaar Holidays" });
}

export default async function TermsConditionsPage() {
  const legal = await getLegalPage("terms_conditions");
  return (
    <LegalPage
      title={legal?.title ?? "Terms & Conditions"}
      content={legal?.content}
      updatedAt={legal?.updated_at}
      note="Legal copy pending — should be drafted/reviewed by Haseeb or counsel before publishing."
    />
  );
}
