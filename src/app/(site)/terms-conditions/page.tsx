import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getLegalPage } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/terms-conditions",
    title: "Terms & Conditions | Masaar Holidays",
    description:
      "Review the booking terms, payment policies, cancellation guidelines, and service agreements for Umrah and Hajj packages with Masaar Holidays UAE.",
  });
}

export default async function TermsConditionsPage() {
  const legal = await getLegalPage("terms_conditions");
  return (
    <LegalPage
      title={legal?.title ?? "Terms & Conditions"}
      content={legal?.content}
      updatedAt={legal?.updated_at}
      note="Legal copy pending — should be drafted/reviewed by counsel before publishing."
    />
  );
}
