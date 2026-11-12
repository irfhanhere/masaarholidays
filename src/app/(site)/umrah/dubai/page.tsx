import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Hero } from "@/components/site/Hero";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { FaqSchema } from "@/components/site/FaqSchema";
import { FaqAccordionList } from "@/components/site/FaqAccordion";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { buildPageMetadata } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";
import { Price } from "@/components/site/Price";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/umrah/dubai",
    title: "Umrah Packages from Dubai | Direct Flights, Luxury Hotels & Transfers | Masaar Holidays",
    description:
      "Curated Umrah packages from Dubai with Masaar Holidays. Direct flights from DXB (Emirates & Flydubai), luxury Makkah & Madinah hotels, and VIP private ground transfers.",
    ogImageUrl: "/brand/banners/umrah.webp",
  });
}

const DUBAI_FAQS = [
  {
    question: "Which airlines do you offer for Umrah departures from Dubai (DXB)?",
    answer:
      "We coordinate direct flights from Dubai International Airport (DXB) with Emirates, flydubai, and Saudia to both King Abdulaziz International Airport (JED) in Jeddah and Prince Mohammad Bin Abdulaziz Airport (MED) in Madinah. Economy and Business Class cabins are available.",
  },
  {
    question: "Do you provide private home pickup across Dubai?",
    answer:
      "Yes. We arrange private chauffeur transfers in premium vehicles (GMC Yukon XL, Toyota Innova, or luxury sedans) directly from your home in Downtown Dubai, Dubai Marina, Arabian Ranches, Jumeirah, Business Bay, Mirdif, or any Dubai neighborhood directly to DXB Airport.",
  },
  {
    question: "Can Dubai expats (Indian, Pakistani, etc.) apply for a Saudi Tourist Visa through Masaar Holidays?",
    answer:
      "Yes. UAE residents holding Indian, Pakistani, and other expat passports with at least 3 months validity on their UAE residence visa and 6 months validity on their passport can apply for the Saudi 1-Year Multiple Entry Tourist Visa directly through our online visa portal or with the help of a dedicated visa advisor.",
  },
  {
    question: "Where is Masaar Holidays located if I wish to meet in person?",
    answer:
      "Our main customer service and administrative center is located at Sharjah Publishing City (SPC Free Zone), Entrance 2, Ground Floor, off Sheikh Mohammed Bin Zayed Road (E311), just 15 minutes from Dubai International Airport and Mirdif. Dubai clients can also book entirely via WhatsApp, phone, or online.",
  },
];

export default function UmrahDubaiPage() {
  return (
    <>
      <FaqSchema faqs={DUBAI_FAQS} />
      <Breadcrumbs
        items={[
          { label: "Umrah", href: "/umrah" },
          { label: "Umrah Packages from Dubai" },
        ]}
      />

      <Hero
        eyebrow="Dubai Departures & Concierge Support"
        h1="Curated Umrah Packages from"
        h1Gold="Dubai"
        image="/brand/banners/umrah.webp"
      >
        <p className="mt-4 max-w-xl text-sm text-masaar-black/70 sm:text-base">
          Premium, family-paced Umrah journeys designed for Dubai residents. Direct flights from DXB, handpicked 5-star hotels fronting the Holy Mosque, and dedicated private ground transfers.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton
            templateKey="general"
            params={{ notes: "Dubai Resident Inquiry" }}
          >
            Plan Your Umrah from Dubai
          </WhatsAppButton>
          <Link
            href="/hotels"
            className="inline-flex items-center justify-center rounded-md border border-masaar-black/30 px-5 py-3 text-sm font-semibold text-masaar-black hover:border-deep-gold hover:text-deep-gold"
          >
            Explore Makkah Hotels
          </Link>
        </div>
      </Hero>

      {/* Dubai Highlights */}
      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-pure-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#936E0F]">
              Seamless DXB Pilgrimage
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
              Engineered for Convenience &amp; Peace of Mind
            </h2>
            <p className="mt-4 text-sm text-masaar-black/70 sm:text-base">
              From terminal departures at Dubai International Airport (DXB) to seamless hotel check-ins right outside the Haram courtyards.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-6 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold text-masaar-black font-bold text-sm">
                01
              </span>
              <h3 className="font-semibold text-masaar-black text-base">Direct DXB Flights</h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Daily scheduled departures via Emirates (Terminal 3), flydubai (Terminal 2), or Saudia (Terminal 1) directly into Jeddah or Madinah.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-6 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold text-masaar-black font-bold text-sm">
                02
              </span>
              <h3 className="font-semibold text-masaar-black text-base">Private VIP Ground Transfers</h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Dedicated chauffeur waiting at Jeddah or Madinah airport with your name board, private transfers between Makkah and Madinah, and optional Haramain train bookings.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-6 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold text-masaar-black font-bold text-sm">
                03
              </span>
              <h3 className="font-semibold text-masaar-black text-base">Handpicked 5-Star Stays</h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Stay at Makkah Clock Royal Tower, Raffles Makkah Palace, Dar Al Taqwa, or Oberoi Madinah — all located within minutes of the prayer areas.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured Packages for Dubai Residents */}
      <section className="bg-warm-ivory/40 py-16 border-t border-black/10">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#936E0F]">Recommended Packages</p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
                Popular Umrah Tiers for Dubai Travellers
              </h2>
            </div>
            <Link href="/umrah" className="text-xs font-bold text-[#936E0F] hover:underline">
              View all package tiers →
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* Essential */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black/70">
                  Value Comfort
                </span>
                <h3 className="mt-3 font-bold text-masaar-black text-lg">Essential Umrah</h3>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Quality 4-star and 5-star standard hotels, direct flights from DXB, and comfortable private group transfers.
                </p>
                <div className="mt-4 pt-4 border-t border-black/5">
                  <span className="text-xs text-masaar-black/60">Starting from</span>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    <Price amountAed={3400} />
                    <span className="text-xs font-normal text-masaar-black/60"> / person</span>
                  </div>
                </div>
              </div>
              <Link
                href="/umrah/essential"
                className="mt-6 block w-full rounded-md border border-masaar-black/20 py-2.5 text-center text-xs font-bold text-masaar-black hover:border-pure-gold hover:text-deep-gold"
              >
                View Essential Tier
              </Link>
            </div>

            {/* Signature */}
            <div className="relative rounded-2xl border border-pure-gold bg-white p-6 shadow-md flex flex-col justify-between">
              <span className="absolute -top-3 right-6 rounded-full bg-pure-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black">
                Most Popular
              </span>
              <div>
                <span className="rounded-full bg-pure-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#936E0F]">
                  5-Star Haram Front
                </span>
                <h3 className="mt-3 font-bold text-masaar-black text-lg">Signature Umrah</h3>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Prime Haram proximity in Makkah (Makkah Towers / Swissôtel or similar) and Madinah (Anwar Al Madinah Mövenpick or similar) with private transfers.
                </p>
                <div className="mt-4 pt-4 border-t border-black/5">
                  <span className="text-xs text-masaar-black/60">Starting from</span>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    <Price amountAed={4600} />
                    <span className="text-xs font-normal text-masaar-black/60"> / person</span>
                  </div>
                </div>
              </div>
              <Link
                href="/umrah/masaar-premium-umrah"
                className="mt-6 block w-full rounded-md bg-pure-gold py-2.5 text-center text-xs font-bold text-masaar-black hover:bg-light-gold"
              >
                View Signature Tier
              </Link>
            </div>

            {/* Exclusive */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black/70">
                  VIP Luxury
                </span>
                <h3 className="mt-3 font-bold text-masaar-black text-lg">Exclusive VIP Umrah</h3>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Panoramic Kaaba-view suites at Makkah Clock Royal Tower or Raffles Makkah, private GMC Yukon XL chauffeur, and VIP lounge access.
                </p>
                <div className="mt-4 pt-4 border-t border-black/5">
                  <span className="text-xs text-masaar-black/60">Starting from</span>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    <Price amountAed={7200} />
                    <span className="text-xs font-normal text-masaar-black/60"> / person</span>
                  </div>
                </div>
              </div>
              <Link
                href="/umrah/exclusive"
                className="mt-6 block w-full rounded-md border border-masaar-black/20 py-2.5 text-center text-xs font-bold text-masaar-black hover:border-pure-gold hover:text-deep-gold"
              >
                View VIP Tier
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Regional Service Transparency Notice */}
      <section className="bg-white py-14">
        <Container>
          <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-6 sm:p-8">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">
              Service Operations for Dubai Residents
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-masaar-black/70 sm:text-sm">
              Masaar Holidays serves pilgrims residing across all Dubai communities through our dedicated digital booking system, direct WhatsApp concierge, and telephone support. Our physical operations center is located at Sharjah Publishing City (SPC Free Zone), Entrance 2, Ground Floor, off Sheikh Mohammed Bin Zayed Road (E311), just 15 minutes drive from Dubai International Airport. In-person consultations are available daily from 8:00 AM to 8:00 PM.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-masaar-black">
              <a href={`tel:${CONTACT.landlineTel}`} className="hover:text-deep-gold">☎️ Landline: {CONTACT.landlineDisplay}</a>
              <a href={`tel:+${CONTACT.whatsappPhoneIntl}`} className="hover:text-deep-gold">📞 Mobile: {CONTACT.phoneDisplay}</a>
              <span>💬 WhatsApp: +{CONTACT.whatsappPhoneIntl}</span>
              <a href={`mailto:${CONTACT.emailGeneral}`} className="hover:text-deep-gold">✉️ Email: {CONTACT.emailGeneral}</a>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="bg-warm-ivory/40 py-16 border-t border-black/10">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#936E0F]">Common Inquiries</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
              Frequently Asked Questions (Dubai Departures)
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <FaqAccordionList
              faqs={DUBAI_FAQS.map((f, i) => ({
                id: `dubai-faq-${i}`,
                category: "umrah",
                question: f.question,
                answer: f.answer,
                display_order: i,
                published: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }))}
            />
          </div>
        </Container>
      </section>

      <CrossLinkServices exclude="umrah" />
    </>
  );
}

