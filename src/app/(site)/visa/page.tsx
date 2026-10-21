import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { WhatsAppButton, WhatsAppGlyph } from "@/components/site/WhatsAppButton";
import {
  CheckIcon,
  CompassIcon,
  DocumentIcon,
  HeadsetIcon,
  LocationIcon,
  PassportIcon,
  PaymentIcon,
  PlaneIcon,
  ShieldIcon,
  WarningTriangleIcon,
} from "@/components/site/icons";
import { CONTACT } from "@/lib/contact";
import { getActiveVisaTypes, getVisaLandingContent } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { FaqSection } from "@/components/site/FaqSection";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/visa",
    fallbackTitle: "Visa & Document Assistance | Masaar Holidays",
    fallbackDescription:
      "Reliable visa and travel document assistance from the UAE. Clear guidance on Umrah, Saudi tourist, UAE, Golden Visa and global destinations. Apply online or talk to our team.",
  });
}

const FALLBACK_IMPORTANT_INFO =
  "Visa requirements, processing times and fees can vary by nationality and are subject to change. Please always verify the latest information with the relevant embassy, consulate or authority; Masaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.";

interface VisaCardConfig {
  slug: string;
  name: string;
  mode: "online" | "enquiry";
  image: string;
  icon: (props: { className?: string }) => React.ReactElement;
  description: string;
  bullets: [string, string, string];
  applyHref: string;
  detailHref: string;
}

const VISA_CARDS_CATALOG: VisaCardConfig[] = [
  {
    slug: "uae",
    name: "UAE Visa",
    mode: "online",
    image: "/brand/banners/uae.webp",
    icon: DocumentIcon,
    description: "Apply for your UAE visa online with simple steps, secure payment and expert support.",
    bullets: ["Multiple visa options", "Clear document checklist", "Fast and secure process"],
    applyHref: "/visa/uae",
    detailHref: "/visa/uae",
  },
  {
    slug: "saudi-tourist",
    name: "Saudi Tourist Visa",
    mode: "online",
    image: "/brand/banners/umrah.webp",
    icon: PassportIcon,
    description: "Explore Saudi Arabia with ease. Apply online for your tourist visa with full guidance.",
    bullets: ["Tourist visa assistance", "Document guidance", "Reliable support"],
    applyHref: "/visa/saudi-tourist",
    detailHref: "/visa/saudi-tourist",
  },
  {
    slug: "us-visa",
    name: "US Visa",
    mode: "online",
    image: "/brand/banners/default.webp",
    icon: DocumentIcon,
    description: "Get expert assistance for your US visa application with a smooth and transparent process.",
    bullets: ["Step-by-step application", "Document review guidance", "Dedicated support"],
    applyHref: "/visa/global",
    detailHref: "/visa/global",
  },
  {
    slug: "umrah",
    name: "Umrah Visa",
    mode: "enquiry",
    image: "/trips/umrah-banner.webp",
    icon: PassportIcon,
    description: "Get guidance and support for your Umrah visa application.",
    bullets: ["Latest requirements", "Document checklist", "Personalised support"],
    applyHref: "/visa/umrah",
    detailHref: "/visa/umrah",
  },
  {
    slug: "global",
    name: "Global Visa Assistance",
    mode: "enquiry",
    image: "/brand/banners/Day Trips & Return Journeys.webp",
    icon: PlaneIcon,
    description: "Guidance for visa requirements for international destinations beyond the UAE and Saudi Arabia.",
    bullets: ["Country-specific guidance", "Document support", "Expert assistance"],
    applyHref: "/visa/global",
    detailHref: "/visa/global",
  },
  {
    slug: "golden-visa-assistance",
    name: "Golden Visa Assistance",
    mode: "enquiry",
    image: "/brand/banners/destination.webp",
    icon: ShieldIcon,
    description: "Support for UAE Golden Visa — for long-term residency for eligible individuals and their families.",
    bullets: ["Eligibility guidance", "Document support", "End-to-end assistance"],
    applyHref: "/visa/golden-visa-assistance",
    detailHref: "/visa/golden-visa-assistance",
  },
  {
    slug: "india",
    name: "India Visa",
    mode: "enquiry",
    image: "/brand/banners/hotel.webp",
    icon: LocationIcon,
    description: "Support with visa requirements and documentation for travel to India.",
    bullets: ["Latest requirements", "Document checklist", "Personalised guidance"],
    applyHref: "/visa/india",
    detailHref: "/visa/india",
  },
];

export default async function VisaPage() {
  const [dbVisaTypes, landingContent] = await Promise.all([
    getActiveVisaTypes(),
    getVisaLandingContent(),
  ]);

  const importantInfo = (landingContent?.important_info_text || FALLBACK_IMPORTANT_INFO)
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // Merge database items with rich presentation data
  const displayedCards = VISA_CARDS_CATALOG.map((card) => {
    const matchingDbRow = dbVisaTypes.find(
      (t) => t.slug === card.slug || (card.slug === "golden-visa-assistance" && t.slug.includes("golden"))
    );
    if (!matchingDbRow) return card;

    return {
      ...card,
      name: matchingDbRow.name || card.name,
      description: matchingDbRow.description || card.description,
      detailHref: `/visa/${matchingDbRow.slug}`,
      applyHref: card.mode === "online" ? `/visa/${matchingDbRow.slug}` : card.applyHref,
    };
  });

  return (
    <>
      <Breadcrumbs items={[{ label: "Visa" }]} />

      {/* Hero Section matching V01.png */}
      <Hero
        eyebrow="VISA SERVICES"
        h1="Your Trusted Visa Assistance Across"
        h1Gold="Key Destinations"
        image="/brand/banners/destination.webp"
      >
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-masaar-black/75 sm:text-base">
          Simple process, clear guidance and dedicated support for your international travel needs.
        </p>

        {/* Dual CTA Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="#choose-visa"
            className="inline-flex items-center justify-center rounded-md bg-pure-gold px-6 py-3.5 text-sm font-semibold text-masaar-black shadow-sm transition-all hover:bg-light-gold"
          >
            Apply for Your Visa
          </a>
          <WhatsAppButton
            templateKey="visa"
            params={{ visaType: "General enquiry" }}
            variant="outline"
            className="border-masaar-black/30 bg-white/80 px-6 py-3.5 text-masaar-black hover:bg-white"
          >
            Talk to Our Team
          </WhatsAppButton>
        </div>

        {/* 3 Trust Badges below CTAs */}
        <div className="mt-10 grid grid-cols-1 gap-4 border-t border-black/10 pt-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
              <ShieldIcon className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-masaar-black">Trusted Guidance</p>
              <p className="mt-0.5 text-[11px] leading-tight text-masaar-black/60">
                Accurate information and expert support
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
              <DocumentIcon className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-masaar-black">Hassle-Free Process</p>
              <p className="mt-0.5 text-[11px] leading-tight text-masaar-black/60">
                Step-by-step assistance from start to finish
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
              <HeadsetIcon className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-masaar-black">Dedicated Support</p>
              <p className="mt-0.5 text-[11px] leading-tight text-masaar-black/60">
                Our team is always here to help you
              </p>
            </div>
          </div>
        </div>
      </Hero>

      {/* Choose Your Visa Service Section */}
      <section id="choose-visa" className="scroll-mt-12 py-16 lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-deep-gold/60" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-text">
                Our Visa Services
              </p>
              <span className="h-px w-8 bg-deep-gold/60" />
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
              Choose Your Visa Service
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-masaar-black/65 sm:text-base">
              Select the destination you need assistance with. Apply online for select visas or get
              in touch for expert guidance.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedCards.map((card, idx) => {
              const Icon = card.icon;
              const isOnline = card.mode === "online";

              return (
                <div
                  key={card.slug + idx}
                  className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-pure-gold/60 hover:shadow-md"
                >
                  {/* Destination Photo Header with Badge Overlay */}
                  <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={card.image}
                      alt={card.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Service Mode Badge */}
                    <div className="absolute left-3.5 top-3.5">
                      {isOnline ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-700/90 px-2.5 py-0.5 text-[10.5px] font-semibold text-white shadow-sm backdrop-blur-xs">
                          Online Application
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-700/90 px-2.5 py-0.5 text-[10.5px] font-semibold text-white shadow-sm backdrop-blur-xs">
                          Enquiry Only
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Icon Emblem Circle */}
                  <div className="-mt-6 flex justify-center">
                    <span className="flex size-12 items-center justify-center rounded-full border border-black/10 bg-warm-ivory text-deep-gold shadow-sm transition-colors group-hover:bg-white group-hover:text-pure-gold">
                      <Icon className="size-5.5" />
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-2 text-center">
                    <h3 className="font-semibold text-masaar-black text-base lg:text-lg">
                      {card.name}
                    </h3>
                    <p className="mt-1.5 min-h-[36px] text-xs leading-relaxed text-masaar-black/60">
                      {card.description}
                    </p>

                    {/* 3 Bullet Checklist */}
                    <ul className="mt-4 space-y-2 text-left text-xs text-masaar-black/75">
                      {card.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2">
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                            <CheckIcon className="size-2.5 stroke-[2.5]" />
                          </span>
                          <span className="truncate">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Actions at bottom */}
                    <div className="mt-6 flex flex-col gap-2 pt-2 border-t border-black/5">
                      {isOnline ? (
                        <Link
                          href={card.applyHref}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-pure-gold py-2.5 text-xs font-semibold text-masaar-black transition-colors hover:bg-light-gold"
                        >
                          Apply Online <span>→</span>
                        </Link>
                      ) : (
                        <WhatsAppButton
                          templateKey="visa"
                          params={{ visaType: card.name }}
                          variant="outline"
                          className="py-2.5 text-xs font-semibold border-masaar-black/25 hover:border-masaar-black"
                        >
                          Enquire on WhatsApp <span>→</span>
                        </WhatsAppButton>
                      )}

                      <Link
                        href={card.detailHref}
                        className="inline-flex items-center justify-center gap-1 text-[11.5px] font-medium text-masaar-black/60 transition-colors hover:text-deep-gold"
                      >
                        View Details <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Important Information Callout Banner */}
      <section className="py-2">
        <Container>
          <div className="rounded-xl border border-light-gold/50 bg-warm-ivory p-6 shadow-xs sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-xs">
                <WarningTriangleIcon className="size-5" />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-deep-gold">
                  Important Information
                </h3>
                <div className="mt-2 space-y-2 text-xs leading-relaxed text-masaar-black/75 sm:text-sm">
                  {importantInfo.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section matching V01.png */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-deep-gold/60" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-text">
                Simple and Transparent Process
              </p>
              <span className="h-px w-8 bg-deep-gold/60" />
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-masaar-black/65 sm:text-base">
              Apply for your visa or request assistance in a few easy steps.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="absolute -top-3.5 flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black shadow-xs">
                1
              </span>
              <span className="mt-2 flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <CompassIcon className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold text-masaar-black text-base">Choose Your Visa</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/60">
                Select the destination and visa type you need.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="absolute -top-3.5 flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black shadow-xs">
                2
              </span>
              <span className="mt-2 flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <DocumentIcon className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold text-masaar-black text-base">Complete the Details</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/60">
                Fill in the application form and upload the required documents.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="absolute -top-3.5 flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black shadow-xs">
                3
              </span>
              <span className="mt-2 flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <PaymentIcon className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold text-masaar-black text-base">Secure Payment</h3>
              <p className="mt-0.5 text-[11px] font-medium text-deep-gold">
                (For UAE, Saudi &amp; US Visas)
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-masaar-black/60">
                Pay online securely for applicable visas.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-xs">
              <span className="absolute -top-3.5 flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black shadow-xs">
                4
              </span>
              <span className="mt-2 flex size-12 items-center justify-center rounded-full bg-pure-gold text-masaar-black">
                <WhatsAppGlyph className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold text-masaar-black text-base">Get Confirmation</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/60">
                Our team will review your application or enquiry and keep you updated.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Cross-Link Services: Thoughtful Services for Every Part of Your Journey */}
      <CrossLinkServices exclude="visa" />

      {/* Frequently Asked Questions: Your Questions, Our Guidance */}
      <FaqSection category="visa" />

      {/* Bottom CTA Banner matching V01.png: Speak to Our Visa Experts */}
      <section className="py-12 lg:py-20">
        <Container>
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-warm-ivory shadow-sm grid lg:grid-cols-12 items-center">
            {/* Travel Photography on the left */}
            <div className="relative h-64 lg:h-full lg:min-h-[380px] lg:col-span-5 bg-neutral-200">
              <Image
                src="/trips/visa-assistance-card-home.webp"
                alt="Masaar Visa Experts Travel Documentation"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
            </div>

            {/* Content & Actions on the right */}
            <div className="p-8 lg:p-12 lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-text">
                Need Assistance?
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
                Speak to Our Visa Experts
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-masaar-black/70 sm:text-base max-w-xl">
                Have questions or need personalised guidance? Our team is here to help you with the
                right information for your travel plans.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <WhatsAppButton
                  templateKey="visa"
                  params={{ visaType: "General enquiry" }}
                  variant="solid"
                  className="px-6 py-3.5 shadow-xs"
                >
                  Chat on WhatsApp
                </WhatsAppButton>
                <Link
                  href={`tel:+${CONTACT.whatsappPhoneIntl}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-masaar-black/25 bg-white px-6 py-3.5 text-sm font-semibold text-masaar-black shadow-xs transition-colors hover:border-masaar-black hover:bg-neutral-50"
                >
                  <svg className="size-4 text-deep-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call {CONTACT.phoneDisplay}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
