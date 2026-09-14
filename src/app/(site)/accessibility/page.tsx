import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: "/accessibility", title: "Accessibility | Masaar Holidays" });
}

export default function AccessibilityPage() {
  return <LegalPage title="Accessibility" note="Accessibility statement pending." />;
}
