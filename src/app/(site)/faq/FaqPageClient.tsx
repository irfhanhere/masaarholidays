"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/site/Container";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import type { FaqCategory, FaqRow } from "@/lib/types/database";

const CATEGORIES: {
  key: FaqCategory;
  label: string;
  eyebrow: string;
  heading: string;
  description: string;
}[] = [
  {
    key: "umrah",
    label: "Umrah",
    eyebrow: "UMRAH",
    heading: "Umrah Questions",
    description: "Everything you need to know about our Umrah packages, process, and what to expect.",
  },
  {
    key: "hajj",
    label: "Hajj",
    eyebrow: "HAJJ",
    heading: "Hajj Questions",
    description: "Find answers about our Hajj packages, arrangements, and important information for your journey.",
  },
  {
    key: "hotels",
    label: "Hotels",
    eyebrow: "HOTELS",
    heading: "Hotel Questions",
    description: "Learn more about our hotel options, locations, proximity to the Haram, and amenities.",
  },
  {
    key: "visa",
    label: "Visas",
    eyebrow: "VISAS",
    heading: "Visa Questions",
    description: "Clear details on requirements, processing times, document support, and eligibility.",
  },
  {
    key: "transfers",
    label: "Private Transfers",
    eyebrow: "PRIVATE TRANSFERS",
    heading: "Private Transfer Questions",
    description: "Information on vehicles, routes, flight delay tracking, and luggage capacity.",
  },
  {
    key: "general",
    label: "General",
    eyebrow: "GENERAL",
    heading: "General Questions",
    description: "Common questions about Masaar Holidays, planning, payments, and our support commitment.",
  },
];

export function FaqPageClient({ allFaqs }: { allFaqs: FaqRow[] }) {
  const [activeTab, setActiveTab] = useState<FaqCategory>("umrah");
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set());

  const activeCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.key === activeTab) ?? CATEGORIES[0];
  }, [activeTab]);

  const activeFaqs = useMemo(() => {
    return allFaqs
      .filter((f) => f.category === activeTab)
      .sort((a, b) => a.display_order - b.display_order);
  }, [allFaqs, activeTab]);

  // Split into 2 columns for the responsive 2-column grid
  const col1 = activeFaqs.filter((_, i) => i % 2 === 0);
  const col2 = activeFaqs.filter((_, i) => i % 2 !== 0);

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="py-12 sm:py-16">
      <Container>
        {/* Category Filter Pills (Exact 6 names: Umrah, Hajj, Hotels, Visas, Private Transfers, General) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveTab(cat.key)}
                className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all sm:text-sm ${
                  isActive
                    ? "bg-deep-gold text-white shadow-xs"
                    : "border border-black/15 bg-white text-masaar-black hover:border-deep-gold/50 hover:bg-warm-ivory"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Active Category Section */}
        <div className="mt-12 sm:mt-16">
          {/* Section Header */}
          <div className="grid gap-4 border-b border-black/15 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-deep-gold" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">
                  {activeCategory.eyebrow}
                </p>
              </div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                {activeCategory.heading}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-masaar-black/60 sm:text-sm">
              <p className="max-w-md text-left lg:text-right">{activeCategory.description}</p>
              <span className="rounded-full bg-warm-ivory px-3.5 py-1.5 font-semibold text-deep-gold border border-black/5">
                {activeFaqs.length.toString().padStart(2, "0")} QUESTIONS
              </span>
            </div>
          </div>

          {/* 2-Column Accordion Grid */}
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-6 items-start">
            {/* Column 1 */}
            <div className="space-y-4">
              {col1.map((faq) => {
                const isOpen = openFaqIds.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs transition-all hover:border-deep-gold/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base text-masaar-black focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="leading-snug">{faq.question}</span>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-deep-gold font-bold text-lg bg-warm-ivory/60">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mt-4 border-t border-black/5 pt-3.5 text-xs sm:text-sm leading-relaxed text-masaar-black/75 animate-in fade-in-50 duration-150">
                        <p className="whitespace-pre-line">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              {col2.map((faq) => {
                const isOpen = openFaqIds.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs transition-all hover:border-deep-gold/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base text-masaar-black focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="leading-snug">{faq.question}</span>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-deep-gold font-bold text-lg bg-warm-ivory/60">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mt-4 border-t border-black/5 pt-3.5 text-xs sm:text-sm leading-relaxed text-masaar-black/75 animate-in fade-in-50 duration-150">
                        <p className="whitespace-pre-line">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Closing WhatsApp CTA Band matching FAQ PAGE.png */}
        <div className="mt-24 overflow-hidden rounded-2xl bg-masaar-black text-white shadow-xl">
          <div className="relative grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[auto_1fr_auto] lg:gap-12">
            {/* Decorative Arch / Lamp Illustration */}
            <div className="hidden lg:flex size-24 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-deep-gold">
              <svg className="size-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 16v1M8 8a4 4 0 018 0v4a4 4 0 01-8 0V8zM6 19h12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3" />
              </svg>
            </div>

            {/* Content */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-light-gold">
                Still have a question?
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-white sm:text-3xl">
                We&apos;re Here to Help
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                If you couldn&apos;t find the answer you&apos;re looking for, our team is just a message away. We&apos;re happy to assist you personally with every detail.
              </p>
              <div className="mt-6">
                <WhatsAppButton
                  templateKey="general"
                  className="inline-flex items-center gap-2 rounded-full bg-pure-gold px-6 py-3.5 text-sm font-semibold text-masaar-black transition-all hover:bg-light-gold shadow-md"
                >
                  WhatsApp Us →
                </WhatsAppButton>
              </div>
            </div>

            {/* Brand Core Values Tagline on Right */}
            <div className="hidden border-l border-white/15 pl-8 lg:block">
              <div className="flex flex-col items-center gap-2 text-center text-deep-gold">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11M5 21V9a7 7 0 0114 0v12M5 21h14" />
                </svg>
                <div className="mt-1 space-y-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
                  <p>FAITH</p>
                  <p>CLARITY</p>
                  <p>CARE</p>
                  <p>PEACE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
