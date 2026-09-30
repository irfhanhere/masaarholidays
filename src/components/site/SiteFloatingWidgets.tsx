"use client";

import dynamic from "next/dynamic";

const WhatsAppFloat = dynamic(() => import("@/components/site/WhatsAppFloat").then((m) => m.WhatsAppFloat), { ssr: false });
const DirectCallFloat = dynamic(() => import("@/components/site/DirectCallFloat").then((m) => m.DirectCallFloat), { ssr: false });
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
