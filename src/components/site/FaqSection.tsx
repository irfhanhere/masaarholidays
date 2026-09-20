import { Container } from "./Container";
import { FaqAccordionList } from "./FaqAccordion";
import { getPublishedFaqs } from "@/lib/data/public";
import type { FaqCategory } from "@/lib/types/database";

export async function FaqSection({
  category,
  title = "Your Questions, Our Guidance",
  subtitle = "Find clear answers to common questions about travelling with Masaar Holidays. If you need more help, our team is always here for you.",
  className = "py-20 bg-warm-ivory/40",
}: {
  category: FaqCategory;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const faqs = await getPublishedFaqs(category);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className={className}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow with gold flanking lines matching FAQ SECTION.png */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-deep-gold/60" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-deep-gold">
              Frequently Asked Questions
            </p>
            <span className="h-px w-10 bg-deep-gold/60" />
          </div>

          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
            {title}
          </h2>

          {subtitle && (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-masaar-black/70 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <FaqAccordionList faqs={faqs} />
        </div>

        {/* Brand emblem at bottom matching FAQ SECTION.png */}
        <div className="mt-16 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-deep-gold/40" />
            <svg
              className="size-6 text-deep-gold"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21V11M5 21V9a7 7 0 0114 0v12M5 21h14"
              />
            </svg>
            <span className="h-px w-12 bg-deep-gold/40" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-deep-gold/80">
            A More Meaningful Journey
          </p>
        </div>
      </Container>
    </section>
  );
}
