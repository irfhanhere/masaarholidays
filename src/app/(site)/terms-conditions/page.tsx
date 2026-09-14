import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: "/terms-conditions", title: "Terms & Conditions | Masaar Holidays" });
}

export default function TermsConditionsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      note="Legal copy pending — should be drafted/reviewed by Haseeb or counsel before publishing."
    />
  );
}
