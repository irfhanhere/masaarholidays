import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getLegalPage } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: "/accessibility", title: "Accessibility | Masaar Holidays" });
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
