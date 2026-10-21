import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getLegalPage } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/accessibility",
    fallbackTitle: "Accessibility Statement | Masaar Holidays",
    fallbackDescription:
      "Read the Masaar Holidays accessibility statement outlining our commitment to digital accessibility for all Umrah and Hajj pilgrims.",
  });
}

export default async function AccessibilityPage() {
  const legal = await getLegalPage("accessibility");
  return (
    <LegalPage
      title={legal?.title ?? "Accessibility"}
      content={legal?.content}
      updatedAt={legal?.updated_at}
      note="Accessibility statement pending."
    />
  );
}
