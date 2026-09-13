import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Accessibility | Masaar Holidays" };

export default function AccessibilityPage() {
  return <LegalPage title="Accessibility" note="Accessibility statement pending." />;
}
