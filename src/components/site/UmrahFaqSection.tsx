"use client";

import { useMemo, useState } from "react";
import { Container } from "./Container";
import type { FaqRow } from "@/lib/types/database";

interface Props {
  faqs: FaqRow[];
}

export function UmrahFaqSection({ faqs }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  // In the Umrah page, only show Umrah-related FAQs
  const umrahFaqs = useMemo(() => {
    const list = faqs.filter((f) => f.category === "umrah");
    return list.length > 0 ? list : faqs.slice(0, 6);
  }, [faqs]);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq-section" className="py-16 sm:py-24 bg-[#FAF8F5] border-t border-black/10">
      <Container>
        {/* Centered Header matching inspirations/UMRAH/FAQ SECTION.png */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#A87F12]">
            <span className="h-px w-8 sm:w-12 bg-[#A87F12]/60" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
            <span className="h-px w-8 sm:w-12 bg-[#A87F12]/60" />
          </div>

          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-semibold text-masaar-black">
            Your Questions, Our Guidance
          </h2>

          <p className="mt-3 max-w-xl mx-auto text-xs sm:text-sm text-masaar-black/60 leading-relaxed">
            Find clear answers to common questions about travelling with Masaar Holidays. If you need more help, our team is always here for you.
          </p>
        </div>

        {/* Clean Single-Column Accordion List with Horizontal Dividers */}
        <div className="max-w-3xl mx-auto mt-12 sm:mt-16 divide-y divide-black/10 border-y border-black/10">
          {umrahFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base lg:text-lg font-medium text-masaar-black group-hover:text-[#A87F12] transition-colors">
                    {faq.question}
                  </span>
                  <span className="flex size-7 shrink-0 items-center justify-center text-[#A87F12] font-light text-2xl">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-6 pr-6 text-xs sm:text-sm leading-relaxed text-masaar-black/75 animate-in fade-in-50 duration-150">
                    <p className="whitespace-pre-line">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Ornament matching FAQ SECTION.png */}
        <div className="mt-14 sm:mt-16 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center justify-center gap-3 text-[#A87F12]">
            <span className="h-px w-10 sm:w-16 bg-[#A87F12]/40" />
            <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.418 0-8 3.582-8 8v10h16V11c0-4.418-3.582-8-8-8z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10M8 21v-6a4 4 0 018 0v6" />
            </svg>
            <span className="h-px w-10 sm:w-16 bg-[#A87F12]/40" />
          </div>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#A87F12]">
            A MORE MEANINGFUL JOURNEY
          </p>
        </div>
      </Container>
    </section>
  );
}
