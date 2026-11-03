import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CONTACT } from "@/lib/contact";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/visa/golden-visa-assistance",
    title: "UAE Golden Visa Concierge & Advisory (10-Year Residency) | Masaar Holidays",
    description:
      "Expert UAE Golden Visa advisory and concierge services. Comprehensive document review, VIP government liaising, and fast-track processing for investors, entrepreneurs, and specialists.",
    ogImageUrl: "/trips/visa-assistance-card-home.webp",
  });
}

const CATEGORIES = [
  {
    title: "Real Estate Investors",
    badge: "Property Owners",
    description:
      "For property buyers and investors holding residential or commercial real estate in the UAE. We coordinate directly with land departments for title deed verification and eligibility clearance.",
    highlights: ["Ready or off-plan properties", "Coordination with Dubai Land Department (DLD)", "Mortgage-supported property pathways"],
  },
  {
    title: "Entrepreneurs & Business Owners",
    badge: "Business Leaders",
    description:
      "For founders, partners, and shareholders of verified UAE businesses, commercial enterprises, or accredited startups with demonstrable economic contribution.",
    highlights: ["Audited financial review assistance", "Trade license & MOA verification", "Ministry of Economy / Hub endorsements"],
  },
  {
    title: "Specialized Talents & Executives",
    badge: "Senior Professionals",
    description:
      "For high-level C-suite executives, senior managers, doctors, engineers, IT specialists, and creative professionals holding accredited qualifications and active UAE employment contracts.",
    highlights: ["Attested degree & MoHRE verification", "Salary certificate & bank statement audit", "Professional licensing clearance"],
  },
  {
    title: "Scientists, Researchers & Innovators",
    badge: "Academic & Tech",
    description:
      "For published researchers, patent holders, and accredited scientists who have contributed to recognized research institutions or technology advancement in the UAE.",
    highlights: ["Emirates Scientists Council clearance", "Patents and academic publication review", "Fast-track VIP liaison"],
  },
];

const BENEFITS = [
  {
    title: "10-Year Renewable Residency",
    desc: "Long-term self-sponsored legal residency in the UAE without the need for an employer or traditional local sponsor.",
  },
  {
    title: "100% Foreign Business Ownership",
    desc: "Full foreign ownership of commercial entities on the UAE mainland and free zones, retaining complete equity.",
  },
  {
    title: "Comprehensive Family Sponsorship",
    desc: "Sponsor your spouse and children of any age with identical 10-year residency privileges, plus domestic staff.",
  },
  {
    title: "Unrestricted Travel Outside UAE",
    desc: "Stay outside the UAE for more than the usual 6-month limit without risking visa cancellation or expiry.",
  },
  {
    title: "Exclusive Esaad Privilege Card",
    desc: "Golden Visa holders are eligible to obtain the prestigious Dubai Esaad Card offering exclusive government and retail discounts.",
  },
  {
    title: "Safety & World-Class Quality of Life",
    desc: "Enjoy the UAE's world-leading safety, healthcare, education infrastructure, and 0% personal income tax environment.",
  },
];

const DOCUMENTS = [
  {
    category: "Identity & Status",
    items: [
      "Original passport (minimum 6 months validity)",
      "High-resolution passport photo with white background",
      "Current UAE residence visa and Emirates ID copy (for existing residents)",
    ],
  },
  {
    category: "Financial & Investment",
    items: [
      "Property title deed or trade license / company MOA",
      "Official bank account statements (typically 3–6 months)",
      "Audited financial statements or salary certificates (if executive category)",
    ],
  },
  {
    category: "Clearance & Medical",
    items: [
      "Attested educational degree certificates (equalized via Ministry of Education where required)",
      "Approved UAE medical fitness screening certificate",
      "Valid comprehensive UAE health insurance policy",
    ],
  },
];

const STEPS = [
  {
    step: "01",
    title: "Confidential Eligibility Assessment",
    desc: "Our senior visa advisors evaluate your documents, category fit, and credentials against current ICP and GDRFA regulations.",
  },
  {
    step: "02",
    title: "Document Legalization & File Preparation",
    desc: "We ensure all required degrees, title deeds, audit reports, and company documents are properly attested and translated into legal Arabic.",
  },
  {
    step: "03",
    title: "Authority Submission & Initial Approval",
    desc: "We file the nomination and application directly through official channels (ICP, GDRFA, or Dubai Land Department) and monitor processing daily.",
  },
  {
    step: "04",
    title: "VIP Medical Screening & Biometrics",
    desc: "Enjoy fast-track appointment scheduling for your mandatory medical fitness test and Emirates ID biometric fingerprinting.",
  },
  {
    step: "05",
    title: "Visa Issuance & Emirates ID Delivery",
    desc: "Your 10-year Golden Visa residency is officially stamped/issued digitally, followed by direct handover of your new Emirates ID card.",
  },
];

const FAQS = [
  {
    q: "Who is eligible for the UAE 10-Year Golden Visa?",
    a: "Eligible categories under UAE immigration laws include real estate investors, entrepreneurs, exceptional talents, senior executives, scientists, and outstanding academic graduates. Eligibility criteria are strictly defined by UAE government authorities (ICP and GDRFA).",
  },
  {
    q: "How does Masaar Holidays assist with the Golden Visa?",
    a: "We act as your dedicated concierge and advisory partner. We review your documentation for compliance, coordinate certified translations and attestations, handle official filings, fast-track medical fitness appointments, and liaise with authorities until your Emirates ID is issued.",
  },
  {
    q: "Can I sponsor my family members?",
    a: "Yes. Golden Visa holders can sponsor their spouse and children of any age. Furthermore, in the event of the primary holder's demise, family members may continue residing in the UAE until the conclusion of the visa's validity.",
  },
  {
    q: "How long can I remain outside the UAE without invalidating the visa?",
    a: "Unlike standard residence visas which expire if the holder remains outside the UAE for more than 180 days, Golden Visa holders may remain outside the country for any duration without visa nullification.",
  },
  {
    q: "How do I start the process?",
    a: "Click 'Request Confidential Consultation' on WhatsApp or submit our enquiry form. A specialist will review your profile confidentially and provide a clear assessment.",
  },
];

export default function GoldenVisaAssistancePage() {
  const whatsappUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    "Hello Masaar Holidays, I would like to request a confidential eligibility assessment for the UAE 10-Year Golden Visa."
  )}`;

  return (
    <div className="min-h-screen bg-warm-ivory/30 text-masaar-black">
      {/* Breadcrumbs */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Visa Services", href: "/visa" },
              { label: "UAE Golden Visa" },
            ]}
          />
        </Container>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white sm:py-24">
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-pure-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pure-gold border border-pure-gold/30">
              — UAE 10-YEAR RESIDENCY ADVISORY —
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl lg:text-6xl text-white">
              UAE Golden Visa Concierge &amp; Advisory
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base sm:leading-relaxed">
              Secure long-term peace of mind in the United Arab Emirates. Masaar Holidays provides bespoke, confidential advisory, document legalization, and VIP government liaising to navigate your 10-year Golden Visa application seamlessly.
            </p>

            {/* Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                ✨ 10-Year Renewable Residency
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                🏢 100% Business Ownership
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                👨‍👩‍👧‍👦 Family &amp; Staff Sponsorship
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                ✈️ No 6-Month Exit Limit
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-masaar-black shadow-lg hover:bg-light-gold transition-all"
              >
                <span>Request Confidential Assessment</span>
                <span>→</span>
              </a>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
              >
                View Eligible Categories
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Overview Section */}
      <section className="py-16 bg-white border-b border-black/5">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
                WHY THE UAE GOLDEN VISA?
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-4xl">
                A Prestigious Gateway to Long-Term Security &amp; Global Mobility
              </h2>
              <p className="mt-4 text-xs leading-relaxed text-masaar-black/75 sm:text-sm sm:leading-relaxed">
                The UAE Golden Visa is a landmark residency program launched by the UAE government that enables foreign talents, investors, entrepreneurs, and professionals to live, work, and study in the UAE with unprecedented freedom.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-masaar-black/75 sm:text-sm sm:leading-relaxed">
                With complete self-sponsorship, family security, and freedom from standard residency restrictions, it offers an exceptional foundation for building your family&apos;s future and growing your wealth in one of the world&apos;s most dynamic economies.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-warm-ivory/50 p-6 sm:p-8 lg:col-span-5">
              <h3 className="font-semibold text-masaar-black text-sm uppercase tracking-wider text-deep-gold">
                Masaar Concierge Highlights
              </h3>
              <ul className="mt-4 space-y-3 text-xs text-masaar-black/80">
                <li className="flex items-start gap-2.5">
                  <span className="text-deep-gold font-bold">✓</span>
                  <span>100% confidential profile evaluation by senior specialists</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-deep-gold font-bold">✓</span>
                  <span>Direct liaising with ICP, GDRFA, and Dubai Land Department</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-deep-gold font-bold">✓</span>
                  <span>Fast-track VIP medical fitness screening and biometrics booking</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-deep-gold font-bold">✓</span>
                  <span>End-to-end family sponsorship file management</span>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Eligible Categories */}
      <section id="categories" className="scroll-mt-16 py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              OFFICIAL PATHWAYS
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              Eligible Golden Visa Categories
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              We facilitate applications across all recognized categories established by UAE immigration authorities.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {CATEGORIES.map((cat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between hover:border-pure-gold/50 transition-all"
              >
                <div>
                  <span className="rounded-full bg-pure-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                    {cat.badge}
                  </span>
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black sm:text-2xl">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                    {cat.description}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-black/5 pt-4 text-xs text-masaar-black/80">
                    {cat.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-center gap-2">
                        <span className="text-deep-gold font-bold">✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  <a
                    href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                      `Hello Masaar Holidays, I would like to check my eligibility for the UAE Golden Visa under the ${cat.title} category.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-deep-gold hover:text-masaar-black"
                  >
                    <span>Check eligibility for this category</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Core Benefits */}
      <section className="bg-white py-16 sm:py-20 border-y border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              EXCLUSIVE PRIVILEGES
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              Key Benefits of the UAE Golden Visa
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              Discover why thousands of international investors, business owners, and leaders choose the UAE as their home.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-warm-ivory/20 p-6 shadow-xs">
                <span className="flex size-10 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold font-bold text-sm">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-masaar-black text-sm sm:text-base">{b.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">{b.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Required Documents Overview */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              DOCUMENTATION CHECKLIST
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              Required Documents Overview
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              Our specialists review, organize, and translate your legal documents to meet stringent government standards.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {DOCUMENTS.map((doc, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-white p-6 shadow-xs">
                <h3 className="font-bold text-masaar-black text-sm uppercase tracking-wide text-deep-gold border-b border-black/5 pb-3">
                  {doc.category}
                </h3>
                <ul className="mt-4 space-y-3 text-xs leading-relaxed text-masaar-black/75">
                  {doc.items.map((it, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-deep-gold font-bold shrink-0 mt-0.5">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5-Step Process */}
      <section className="bg-white py-16 sm:py-20 border-t border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              STREAMLINED CONCIERGE JOURNEY
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              Our 5-Step Advisory Process
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              From your initial consultation to physical Emirates ID delivery, our concierge manages every detail.
            </p>
          </div>

          <div className="mt-12 max-w-3xl mx-auto space-y-6">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="flex flex-col sm:flex-row gap-5 rounded-xl border border-black/10 bg-warm-ivory/20 p-6 shadow-xs"
              >
                <div className="flex shrink-0 items-center justify-center rounded-lg bg-masaar-black px-4 py-2 sm:h-16 sm:w-16 text-center text-pure-gold font-bold font-[family-name:var(--font-display)] text-xl">
                  {s.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-masaar-black text-base">{s.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-masaar-black/70">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQs */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-xs text-masaar-black/60">
              Clear, transparent guidance on the UAE Golden Visa framework.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-2xl space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                <h3 className="font-semibold text-masaar-black text-sm">{faq.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="bg-masaar-black py-16 text-white text-center">
        <Container>
          <div className="max-w-xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pure-gold">
              CONFIDENTIAL ASSISTANCE
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl text-white">
              Speak with a Senior Golden Visa Advisor
            </h2>
            <p className="mt-3 text-xs text-white/70 leading-relaxed">
              Contact our advisory desk today for a complimentary, confidential review of your eligibility and documentation checklist.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-pure-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-masaar-black shadow-lg hover:bg-light-gold"
              >
                Start WhatsApp Assessment →
              </a>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-white/30 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10"
              >
                Send Direct Message
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
