"use client";

import { useState } from "react";
import type { FaqRow } from "@/lib/types/database";

export function FaqAccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqRow;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-black/10 transition-colors">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-gold/50"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-masaar-black transition-colors group-hover:text-deep-gold sm:text-lg">
          {faq.question}
        </span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-deep-gold transition-transform duration-200">
          {isOpen ? (
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          ) : (
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
        </span>
      </button>

      {isOpen && (
        <div className="pb-6 pr-6 text-sm leading-relaxed text-masaar-black/70 sm:text-base animate-in fade-in-50 duration-200">
          <p className="whitespace-pre-line">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FaqAccordionList({ faqs }: { faqs: FaqRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="divide-y-0">
      {faqs.map((faq) => (
        <FaqAccordionItem
          key={faq.id}
          faq={faq}
          isOpen={openId === faq.id}
          onToggle={() => toggle(faq.id)}
        />
      ))}
    </div>
  );
}
