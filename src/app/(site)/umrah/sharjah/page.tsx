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
    path: "/umrah/sharjah",
    title: "Umrah Packages from Sharjah | Local Agency Booking & Departures | Masaar Holidays",
    description:
      "Book your Umrah package from Sharjah with Masaar Holidays. In-person consultations at Sharjah Publishing City, direct Air Arabia flights from SHJ, and curated family support.",
    ogImageUrl: "/brand/banners/umrah.webp",
  });
}

const SHARJAH_FAQS = [
  {
    question: "Can I book direct Umrah flights departing from Sharjah International Airport (SHJ)?",
    answer:
      "Yes. Masaar Holidays arranges packages with direct flights from Sharjah International Airport (SHJ) to King Abdulaziz International Airport (JED) in Jeddah or Prince Mohammad Bin Abdulaziz Airport (MED) in Madinah, primarily flying Air Arabia as well as other scheduled carriers.",
  },
  {
    question: "Can I visit your office in Sharjah for an in-person consultation?",
    answer:
      "Yes. Masaar Holidays is headquartered at Sharjah Publishing City Free Zone (SPC Free Zone), Entrance 2, Ground Floor, in Al Zahia, off Sheikh Mohammed Bin Zayed Road (E311). Our team is available daily from 8:00 AM to 8:00 PM for face-to-face package planning, room selection, and visa assistance.",
  },
  {
    question: "Do you arrange door-to-door transport within Sharjah?",
    answer:
      "Yes. We provide private chauffeur pickups directly from your home or residence anywhere in Sharjah — including Al Majaz, Al Nahda, Muwailih, Al Suyoh, and Al Rahmaniya — taking you directly to Sharjah International Airport (SHJ) or Dubai International Airport (DXB).",
  },
  {
    question: "Which Umrah package is most recommended for Sharjah families?",
    answer:
      "For families with elderly parents or young children, we recommend our Signature or Exclusive Umrah journeys. These feature 5-star hotels situated directly on the courtyard of the Holy Mosque (such as Makkah Clock Royal Tower or Pullman ZamZam) and step-free pedestrian routes to ensure maximum comfort.",
  },
];

export default function UmrahSharjahPage() {
  return (
    <>
      <FaqSchema faqs={SHARJAH_FAQS} />
      <Breadcrumbs
        items={[
          { label: "Umrah", href: "/umrah" },
          { label: "Umrah Packages from Sharjah" },
        ]}
      />

      <Hero
        eyebrow="Sharjah Headquarters & Departures"
        h1="Thoughtfully Planned Umrah Journeys from"
        h1Gold="Sharjah"
        image="/brand/banners/umrah.webp"
      >
        <p className="mt-4 max-w-xl text-sm text-masaar-black/70 sm:text-base">
          Faith-led pilgrimage travel organized locally from our Sharjah headquarters. Enjoy in-person consultations, convenient departures from Sharjah International Airport, and dedicated support every step of the way.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton
            templateKey="general"
            params={{ notes: "Sharjah Resident Inquiry" }}
          >
            Plan Your Umrah from Sharjah
          </WhatsAppButton>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-masaar-black/30 px-5 py-3 text-sm font-semibold text-masaar-black hover:border-deep-gold hover:text-deep-gold"
          >
            Visit Our Sharjah Office
          </Link>
        </div>
      </Hero>

      {/* Local Advantages */}
      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-pure-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#936E0F]">
              Your Local UAE Partner
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
              Why Sharjah Pilgrims Choose Masaar Holidays
            </h2>
            <p className="mt-4 text-sm text-masaar-black/70 sm:text-base">
              Planning an Umrah pilgrimage is a sacred milestone. We combine local accessibility in Sharjah with five-star hospitality on the ground in Makkah and Madinah.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-6 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold text-masaar-black font-bold text-sm">
                01
              </span>
              <h3 className="font-semibold text-masaar-black text-base">In-Person Consultation</h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Visit our dedicated office at Sharjah Publishing City in Al Zahia to review hotel room options, compare itineraries, and submit visa documentation with our team.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-6 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold text-masaar-black font-bold text-sm">
                02
              </span>
              <h3 className="font-semibold text-masaar-black text-base">Sharjah Airport Departures</h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Avoid cross-emirate highway traffic with direct flight itineraries departing straight from Sharjah International Airport (SHJ) via Air Arabia.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-6 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold text-masaar-black font-bold text-sm">
                03
              </span>
              <h3 className="font-semibold text-masaar-black text-base">Family &amp; Elderly Focus</h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Step-free hotel access, private wheelchair assistance, and spacious quad or triple rooms curated specifically for multi-generational families.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured Packages for Sharjah Residents */}
      <section className="bg-warm-ivory/40 py-16 border-t border-black/10">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#936E0F]">Tailored Pilgrimage Journeys</p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
                Featured Umrah Packages
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
                  Comfortable 4-star and 5-star standard stays with scheduled shuttle or short walking distance.
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
                  Prime Haram proximity in Makkah (Makkah Towers / Swissôtel or similar) and Madinah (Anwar Al Madinah Mövenpick or similar).
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
                  Front-row Kaaba view suites at Makkah Clock Royal Tower or Dar Al Taqwa Madinah with private GMC Yukon XL transfers.
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

      {/* Local Office Address & Map Card */}
      <section className="bg-white py-16">
        <Container>
          <div className="rounded-2xl border border-black/10 bg-warm-ivory/30 p-8">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#936E0F]">Masaar Holidays Headquarters</span>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
                  Visit Us in Sharjah Publishing City
                </h2>
                <div className="mt-4 space-y-2 text-xs text-masaar-black/80">
                  <p className="font-semibold">{CONTACT.officeAddressLines[0]}</p>
                  <p>{CONTACT.officeAddressLines[1]}</p>
                  <p>{CONTACT.officeAddressLines[2]}</p>
                  <p>{CONTACT.officeAddressLines[3]}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-masaar-black/70">
                  <span>⏱ Hours: {CONTACT.businessHours}</span>
                  <span>📞 Call: {CONTACT.phoneDisplay}</span>
                </div>
                <div className="mt-6">
                  <WhatsAppButton templateKey="contact">Chat with a Sharjah Travel Specialist</WhatsAppButton>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm aspect-video">
                <iframe
                  title="Sharjah Office Location"
                  src="https://maps.google.com/maps?q=Sharjah+Publishing+City+Free+Zone&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
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
              Frequently Asked Questions (Sharjah Departures)
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <FaqAccordionList
              faqs={SHARJAH_FAQS.map((f, i) => ({
                id: `sharjah-faq-${i}`,
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

