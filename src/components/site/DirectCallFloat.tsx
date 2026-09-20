"use client";

import { useWhatsAppTemplates } from "./WhatsAppTemplatesProvider";

/** The fixed bottom-right "call now" bubble, sitting beside the WhatsApp bubble on every page — uses the same admin-editable number as WhatsApp so the two never drift apart. */
export function DirectCallFloat() {
  const { phoneNumber } = useWhatsAppTemplates();

  return (
    <a
      href={`tel:+${phoneNumber}`}
      aria-label="Call Masaar Holidays"
      className="fixed bottom-6 right-24 z-40 flex size-14 items-center justify-center rounded-full bg-[#A87F12] text-white shadow-lg transition-transform hover:scale-105"
    >
      <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    </a>
  );
}
