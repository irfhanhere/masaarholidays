"use client";

import { useState } from "react";
import type { AdditionalServiceFaq } from "@/lib/types/database";

interface ServiceFaqAccordionProps {
  faqs: AdditionalServiceFaq[];
}

export function ServiceFaqAccordion({ faqs }: ServiceFaqAccordionProps) {
  // First item open by default for engaging UX
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-btn-${idx}`;

        return (
          <div
            key={idx}
            className={`rounded-xl border transition-all duration-200 ${
              isOpen
                ? "border-pure-gold/50 bg-white shadow-xs"
                : "border-black/10 bg-white/80 hover:border-black/20"
            }`}
          >
            <button
              id={buttonId}
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="group flex w-full items-center justify-between gap-4 p-5 text-left transition-colors"
            >
              <span className="font-semibold text-xs sm:text-sm text-masaar-black transition-colors group-hover:text-deep-gold">
                {faq.q}
              </span>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200 ${
                  isOpen
                    ? "border-pure-gold/50 bg-pure-gold/10 text-deep-gold"
                    : "border-black/15 bg-black/5 text-masaar-black/60 group-hover:border-black/30 group-hover:text-masaar-black"
                }`}
                aria-hidden="true"
              >
                {isOpen ? (
                  <svg
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                ) : (
                  <svg
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                )}
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="border-t border-black/5 px-5 pb-5 pt-3"
              >
                <p className="text-xs sm:text-sm leading-relaxed text-masaar-black/75">
                  {faq.a}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

