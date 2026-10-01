"use client";

import dynamic from "next/dynamic";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { DirectCallFloat } from "@/components/site/DirectCallFloat";

const ScrollToTopButton = dynamic(() => import("@/components/site/ScrollToTopButton").then((m) => m.ScrollToTopButton), { ssr: false });
const LanguagePrompt = dynamic(() => import("@/components/site/LanguagePrompt").then((m) => m.LanguagePrompt), { ssr: false });

export function SiteFloatingWidgets() {
  return (
    <>
      <WhatsAppFloat />
      <DirectCallFloat />
      <ScrollToTopButton />
      <LanguagePrompt />
    </>
  );
}
