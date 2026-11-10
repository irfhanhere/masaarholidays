import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { CONTACT } from "@/lib/contact";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/umrah/masaar-premium-umrah",
    title: "Masaar Premium Umrah Package (6 Days / 5 Nights) | Masaar Holidays",
    description:
      "Exclusive 6-day luxury Umrah journey from Dubai featuring 5-star stays at Anwar Al Madinah Mövenpick or similar in Madinah and Makkah Towers / Swissôtel or similar in Makkah. Transparent room pricing and VIP ground transfers.",
    ogImageUrl: "/brand/banners/umrah.webp",
  });
}

const ROOM_PRICING = [
  {
    type: "Quad Room",
    label: "4 Guests Sharing",
    price: 4600,
    note: "Per person sharing a spacious 4-bed room",
    popular: false,
  },
  {
    type: "Triple Room",
    label: "3 Guests Sharing",
    price: 4900,
    note: "Per person sharing a 3-bed room",
    popular: false,
  },
  {
    type: "Double Room",
    label: "2 Guests Sharing",
    price: 5100,
    note: "Per person sharing a double/twin room",
    popular: true,
  },
  {
    type: "Single Room",
    label: "1 Guest (Private)",
    price: 6900,
    note: "Private room with king bed",
    popular: false,
  },
  {
    type: "Child with Bed",
    label: "Child Rate (With Bed)",
    price: 3000,
    note: "Child aged 2–11 with dedicated hotel bed",
    popular: false,
  },
];

const ITINERARY = [
  {
    day: "Day 1",
    title: "Arrival in Madinah Al-Munawwarah",
    subtitle: "Check-in at Anwar Al Madinah Mövenpick or similar",
    description:
      "Arrive at Prince Mohammad Bin Abdulaziz International Airport (or transfer from Dubai). Meet our VIP airport concierge for private transfer to Anwar Al Madinah Mövenpick or similar. Check in, settle into your luxury room, and enjoy a quick 1-minute walk (approx. 50m) along a flat walking pathway to Al-Masjid An-Nabawi for your first congregational prayers and greetings at the Rawdah Sharif.",
  },
  {
    day: "Day 2",
    title: "Historical Ziyarah in Madinah",
    subtitle: "Guided Tour of Holy Landmarks",
    description:
      "Begin the morning with an international buffet breakfast, followed by a private guided tour in an air-conditioned luxury vehicle. Visit Masjid Quba (the first mosque built by Prophet Muhammad ﷺ), Mount Uhud and the Archers' Hill, and Masjid Al-Qiblatain. Spend the evening in ibadah and personal contemplation at the Prophet's Mosque.",
  },
  {
    day: "Day 3",
    title: "Journey to Makkah Al-Mukarramah & Umrah",
    subtitle: "High-Speed Haramain Train & Makkah Check-in",
    description:
      "Enter the state of Ihram at the hotel, make your Niyyah at the Miqat (Dhul Hulaifah), and board the high-speed Haramain Bullet Train (or VIP private GMC transfer) to Makkah. Upon arrival, check in to Makkah Towers / Swissôtel or similar, approximately 100 metres and a 2-minute walk from the Holy Haram. In the evening, perform your Umrah rites (Tawaf and Sa'i) accompanied by our experienced ground guide.",
  },
  {
    day: "Day 4",
    title: "Spiritual Devotion in the Holy Haram",
    subtitle: "Dedicated Day for Prayers & Reflection",
    description:
      "A serene, unhurried day focused on worship. Enjoy convenient 2-minute walking access (approx. 100m) directly into the courtyard of the Holy Haram. Spend time in Nawafil, Qur'anic recitation, and heartfelt Du'a before the Holy Kaaba.",
  },
  {
    day: "Day 5",
    title: "Makkah Historical Ziyarah",
    subtitle: "Mina, Muzdalifah, Arafat & Jabal Al-Noor",
    description:
      "After breakfast, embark on a morning guided tour of sacred Hajj pilgrimage sites: Mina (the city of tents), Muzdalifah, the Plain of Arafat, and Jabal Al-Rahmah. Drive past the Cave of Hira at Jabal Al-Noor and Jabal Al-Thawr, learning rich Islamic history from our licensed scholar guide.",
  },
  {
    day: "Day 6",
    title: "Tawaf Al-Wadaa & Return to Dubai",
    subtitle: "Farewell Prayers & Private Transfer",
    description:
      "Perform Tawaf Al-Wadaa (Farewell Circumambulation) at the Kaaba. Complete hotel check-out at Makkah Towers / Swissôtel or similar. Board your private VIP chauffeur transfer to King Abdulaziz International Airport in Jeddah for your return flight back to the UAE, concluding a blessed, memorable pilgrimage.",
  },
];

const INCLUSIONS = [
  "5 Nights luxury 5-star accommodation (Anwar Al Madinah Mövenpick or similar & Makkah Towers / Swissôtel or similar)",
  "Daily international buffet breakfast at both luxury hotels",
  "High-speed Haramain Bullet Train or VIP luxury private transfer between Madinah & Makkah",
  "Private air-conditioned chauffeur transfers for all airport arrivals and departures",
  "Comprehensive guided Ziyarah tours in both Madinah and Makkah with licensed guides",
  "Dedicated 24/7 Masaar Umrah concierge on the ground throughout your pilgrimage",
  "Assistance with Nusuk app permits for the Rawdah Sharif and Umrah slot booking",
  "Complimentary Masaar Umrah kit (prayer mat, digital tasbeeh, and ritual guidebook)",
];

const EXCLUSIONS = [
  "International airfare (available as an optional add-on tailored to your preferred airline)",
  "Personal expenses (laundry, room service, telephone calls, souvenirs)",
  "Travel and medical insurance (available upon request)",
  "Saudi Tourist Visa processing fee (can be bundled seamlessly with our visa desk)",
];

const FAQS = [
  {
    q: "How do I book the Masaar Premium Umrah Package?",
    a: "Booking is handled through our personalized concierge desk. Click 'Enquire on WhatsApp' or fill out our enquiry form to share your preferred travel dates and passenger count. An Umrah specialist will provide a tailored quote and confirm hotel availability before receiving payment.",
  },
  {
    q: "Can I customize the hotel or extend my stay?",
    a: "Yes. As a private boutique travel concierge, we can adjust your nights in Madinah or Makkah, upgrade room views to Kaaba or Haram view, or arrange private luxury SUVs (GMC Yukon XL / Mercedes V-Class).",
  },
  {
    q: "Is flight booking included in the quoted room prices?",
    a: "The room rates (starting from AED 4,600) cover all 5-star accommodations, daily breakfast, luxury ground transfers, and guided tours. Flights from Dubai, Sharjah, or Abu Dhabi can be booked through us on Emirates, flydubai, Saudia, or Flynas at live airline rates.",
  },
  {
    q: "Are Nusuk app permits guaranteed?",
    a: "Our ground concierge assists every traveller with downloading, registering, and securing official Nusuk slots for Umrah and the Rawdah Sharif in Madinah according to Saudi Ministry regulations.",
  },
];

export default function MasaarPremiumUmrahPage() {
  const whatsappUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    "Hello Masaar Holidays, I am interested in the 6-Day Masaar Premium Umrah Package (Anwar Al Madinah Mövenpick or similar & Makkah Towers / Swissôtel or similar). Please share availability and booking details."
  )}`;

  return (
    <div className="min-h-screen bg-warm-ivory/30 text-masaar-black">
      {/* Top Breadcrumb */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Umrah Packages", href: "/umrah" },
              { label: "Masaar Premium Umrah" },
            ]}
          />
        </Container>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white sm:py-24">
        <div className="absolute inset-0 z-0 opacity-25">
          <Image
            src="/brand/banners/umrah.webp"
            alt="Masaar Premium Umrah Package"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/80 to-transparent" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-pure-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pure-gold border border-pure-gold/30">
              — VIP CURATED PILGRIMAGE —
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl lg:text-6xl text-white">
              Masaar Premium Umrah Package
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base sm:leading-relaxed">
              Experience a tranquil 6-day, 5-night spiritual journey curated for discerning travellers. Stay in 5-star comfort at Anwar Al Madinah Mövenpick or similar in Madinah and Makkah Towers / Swissôtel or similar in Makkah, with high-speed bullet train transfers, daily buffet breakfasts, and personalized 24/7 ground care.
            </p>

            {/* Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                ⏱️ 6 Days / 5 Nights
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                🏨 5-Star Luxury Hotels
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                🚆 Haramain Bullet Train / VIP Chauffeur
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                🕌 Guided Ziyarah Included
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
                <span>Enquire on WhatsApp</span>
                <span>→</span>
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
              >
                View Pricing Breakdown
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Package Highlights Grid */}
      <section className="py-12 bg-white border-b border-black/5">
        <Container>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-5 text-center">
              <span className="block text-xl font-bold text-deep-gold">6 Days</span>
              <span className="text-xs text-masaar-black/70">5 Nights Duration</span>
            </div>
            <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-5 text-center">
              <span className="block text-xl font-bold text-deep-gold">5-Star</span>
              <span className="text-xs text-masaar-black/70">Madinah & Makkah</span>
            </div>
            <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-5 text-center">
              <span className="block text-xl font-bold text-deep-gold">AED 4,600</span>
              <span className="text-xs text-masaar-black/70">Starting Rate / Person</span>
            </div>
            <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-5 text-center">
              <span className="block text-xl font-bold text-deep-gold">24/7 Care</span>
              <span className="text-xs text-masaar-black/70">Dedicated Concierge</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Hotels Showcase */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              HANDPICKED 5-STAR HOSPITALITY
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              Accommodations Near the Two Holy Mosques
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              We selected hotels with premier proximity and comfort to ensure peace of mind during your acts of worship.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Madinah Hotel */}
            <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="p-6 sm:p-8">
                <span className="rounded bg-pure-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                  Madinah Al-Munawwarah · 2 Nights
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  Anwar Al Madinah Mövenpick or similar
                </h3>
                <p className="mt-1 text-xs text-masaar-black/60">
                  ⭐⭐⭐⭐⭐ 5-Star Luxury · Approx. 50m from the Haram (1-min walk)
                </p>
                <p className="mt-4 text-xs leading-relaxed text-masaar-black/75">
                  Located approximately 50 metres from the Prophet&apos;s Mosque, Anwar Al Madinah Mövenpick (or similar) offers premier convenience with an easy 1-minute walk along a flat walking pathway to Al-Masjid An-Nabawi and the Rawdah entrances.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-masaar-black/70">
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Approximately 50 metres from the Haram (~1 minute walk)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Flat walking pathway directly to Al-Masjid An-Nabawi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Lavish daily international buffet breakfast</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>High-speed complimentary Wi-Fi and 24-hour room service</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Makkah Hotel */}
            <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="p-6 sm:p-8">
                <span className="rounded bg-pure-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                  Makkah Al-Mukarramah · 3 Nights
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  Makkah Towers / Swissôtel or similar
                </h3>
                <p className="mt-1 text-xs text-masaar-black/60">
                  ⭐⭐⭐⭐⭐ 5-Star Luxury · Approx. 100m from the Haram (2-min walk)
                </p>
                <p className="mt-4 text-xs leading-relaxed text-masaar-black/75">
                  Situated approximately 100 metres from the Holy Haram, Makkah Towers / Swissôtel (or similar) provides superb comfort and convenient access with an approximately 2-minute walk directly to the courtyard of Masjid Al-Haram.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-masaar-black/70">
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Approximately 100 metres from the Holy Haram</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Approximately 2 minutes walking distance directly to the Haram courtyard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Extensive international dining and live cooking stations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Surrounded by modern retail, pharmacies, and dining</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-16 bg-white py-16 sm:py-20 border-y border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              TRANSPARENT VALUE
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              Room Pricing & Occupancy Rates
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              All prices are in UAE Dirhams (AED) per person, covering hotel stays, daily breakfast, and VIP ground transfers.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {ROOM_PRICING.map((item) => (
              <div
                key={item.type}
                className={`relative flex flex-col justify-between rounded-xl border p-6 text-center transition-all ${
                  item.popular
                    ? "border-pure-gold bg-pure-gold/5 ring-2 ring-pure-gold/30 shadow-md"
                    : "border-black/10 bg-white shadow-xs"
                }`}
              >
                {item.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pure-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black shadow">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-semibold text-masaar-black text-sm">{item.type}</h3>
                  <p className="mt-0.5 text-[11px] text-masaar-black/60">{item.label}</p>
                  <div className="mt-4 border-y border-black/5 py-4">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
                      AED {item.price.toLocaleString()}
                    </span>
                    <span className="block text-[11px] text-masaar-black/60 mt-0.5">/ person</span>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-masaar-black/70">{item.note}</p>
                </div>

                <div className="mt-6 pt-2">
                  <a
                    href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                      `Hello Masaar Holidays, I would like to book/enquire about the ${item.type} (AED ${item.price}) for the 6-Day Masaar Premium Umrah Package.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full rounded-md bg-masaar-black py-2.5 px-3 text-xs font-semibold text-white hover:bg-black/85 transition-all"
                  >
                    Enquire Now
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg bg-warm-ivory border border-black/10 p-4 text-xs text-masaar-black/75 text-center max-w-2xl mx-auto">
            💡 <strong>Custom dates & family suites available:</strong> Have specific travel dates or traveling with elderly parents or infants? We can customize your room configuration and private transport.
          </div>
        </Container>
      </section>

      {/* 6-Day Detailed Itinerary */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              DAY-BY-DAY PILGRIMAGE SCHEDULE
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              6-Day Journey Itinerary
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              Carefully scheduled to allow unhurried ibadah, adequate rest, and insightful historical discovery.
            </p>
          </div>

          <div className="mt-12 mx-auto max-w-3xl space-y-6">
            {ITINERARY.map((step) => (
              <div
                key={step.day}
                className="flex flex-col sm:flex-row gap-5 rounded-xl border border-black/10 bg-white p-6 shadow-xs hover:border-black/20 transition-all"
              >
                <div className="flex shrink-0 items-center justify-center rounded-lg bg-warm-ivory px-4 py-2 sm:h-16 sm:w-24 text-center">
                  <span className="font-bold text-masaar-black font-[family-name:var(--font-display)] text-lg">
                    {step.day}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-masaar-black text-base">{step.title}</h3>
                  <p className="text-xs font-medium text-deep-gold mt-0.5">{step.subtitle}</p>
                  <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Inclusions & Exclusions */}
      <section className="bg-white py-16 sm:py-20 border-t border-black/5">
        <Container>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Inclusions */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-bold text-emerald-950 text-base">
                <span className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  ✓
                </span>
                What&apos;s Included
              </h3>
              <ul className="mt-5 space-y-3 text-xs leading-relaxed text-emerald-900">
                {INCLUSIONS.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exclusions */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-bold text-masaar-black text-base">
                <span className="size-5 rounded-full bg-neutral-400 text-white flex items-center justify-center text-xs">
                  ✕
                </span>
                What&apos;s Excluded
              </h3>
              <ul className="mt-5 space-y-3 text-xs leading-relaxed text-masaar-black/70">
                {EXCLUSIONS.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-neutral-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
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
              Clear information to help you plan your pilgrimage with confidence.
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

      {/* Thoughtful Services Site-Wide Section */}
      <CrossLinkServices
        exclude="umrah"
        className="py-16 bg-warm-ivory/30 border-t border-black/5"
      />

      {/* Bottom CTA Banner */}
      <section className="bg-masaar-black py-16 text-white text-center">
        <Container>
          <div className="max-w-xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pure-gold">
              TAILORED UMRAH EXPERIENCES
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl text-white">
              Ready to Begin Your Sacred Journey?
            </h2>
            <p className="mt-3 text-xs text-white/70 leading-relaxed">
              Contact our dedicated pilgrimage specialists for custom departures, live availability, or airline coordination.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-pure-gold px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-masaar-black shadow-lg hover:bg-light-gold"
              >
                Chat on WhatsApp Now →
              </a>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-white/30 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10"
              >
                Contact Our Desk
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

