import { Container } from "./Container";
import { WhatsAppButton } from "./WhatsAppButton";
import type { UmrahContentRow } from "@/lib/types/database";

export function GuidedUmrahAssistance({ content }: { content: UmrahContentRow }) {
  if (!content || !content.is_active) {
    return null;
  }

  const eyebrow = content.guided_assistance_eyebrow || "RITUAL GUIDANCE";
  const heading = content.guided_assistance_heading || "Guided Umrah Assistance";
  const duration = content.guided_assistance_duration || "~3-4 hours (full ritual coverage)";
  const description =
    content.guided_assistance_description ||
    "Step-by-step spiritual and practical accompaniment through your Umrah rituals, ensuring peace of mind and strict adherence to the Sunnah.";

  const features = content.guided_assistance_features && content.guided_assistance_features.length > 0
    ? content.guided_assistance_features
    : [
        {
          title: "Sunnah-Guided",
          description: "Step-by-step guidance strictly according to Sunnah",
        },
        {
          title: "Side-by-Side Support",
          description: "Accompanies you through Tawaf, Sa'ai, and prayers",
        },
        {
          title: "Recitation Support",
          description: "Helps lead and recite supplications (duas) throughout",
        },
      ];

  const badges = content.guided_assistance_badges && content.guided_assistance_badges.length > 0
    ? content.guided_assistance_badges
    : [
        "Personal & Dedicated Guide",
        "Authentic Sunnah Guidance",
        "End-to-End Ritual Companion (3-4 Hours)",
      ];

  function renderFeatureIcon(index: number) {
    const iconIdx = index % 3;
    if (iconIdx === 0) {
      return (
        <svg className="size-6 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    }
    if (iconIdx === 1) {
      return (
        <svg className="size-6 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    }
    return (
      <svg className="size-6 text-deep-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    );
  }

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 border-t border-black/10">
      <Container>
        {/* Header Block */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-widest text-deep-gold uppercase">
            {eyebrow}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
            {heading}
          </h2>

          {/* Duration Badge */}
          {duration && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-warm-ivory px-3 py-1 text-xs font-medium text-deep-gold border border-black/5">
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{duration}</span>
            </div>
          )}

          {description && (
            <p className="mt-4 text-sm leading-relaxed text-masaar-black/70 sm:text-base">
              {description}
            </p>
          )}

          {/* 3 Feature Badges/Pills */}
          {badges.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E6C65C]/60 bg-[#FAF5E8] px-3.5 py-1.5 text-xs font-semibold text-masaar-black shadow-2xs"
                >
                  <span className="size-1.5 rounded-full bg-[#A87F12]" />
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3 Feature Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-2xl border border-black/10 bg-warm-ivory/40 p-6 shadow-2xs transition-all hover:border-[#E6C65C] hover:shadow-xs"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-white shadow-2xs">
                {renderFeatureIcon(idx)}
              </div>

              <h3 className="mt-5 font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-masaar-black/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Single WhatsApp CTA Bar */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 text-center">
          <WhatsAppButton
            templateKey="guidedUmrah"
            className="bg-[#A87F12] text-white hover:bg-[#C9A227] px-8 py-3.5 text-sm font-semibold shadow-sm"
          >
            Enquire on WhatsApp
          </WhatsAppButton>

          <p className="text-xs text-masaar-black/50">
            Have questions about Umrah guidance? We&apos;re happy to assist with all details.
          </p>
        </div>
      </Container>
    </section>
  );
}
