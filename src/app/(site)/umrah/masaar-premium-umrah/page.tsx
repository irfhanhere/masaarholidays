import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import {
  TrainIcon,
  PlaneIcon,
  CompassIcon,
  DocumentIcon,
  FamilyIcon,
  CheckIcon,
  BedIcon,
  ClockIcon,
} from "@/components/site/icons";
import { CONTACT } from "@/lib/contact";
import { getMasaarPremiumPackage } from "@/lib/data/premium-package";
import { PremiumItineraryAccordion } from "@/components/site/PremiumItineraryAccordion";
import { getSiteOrigin } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const pkg = await getMasaarPremiumPackage();
  const origin = getSiteOrigin();

  return {
    title: pkg.seo_title,
    description: pkg.meta_description,
    keywords: [
      "Umrah package from UAE",
      "Umrah package from Dubai",
      "Premium Umrah package UAE",
      "Umrah packages Dubai",
      "Makkah and Madinah Umrah package",
      "Umrah package with Haramain Train",
      "Umrah with Ziyarah from UAE",
    ],
    alternates: {
      canonical: pkg.canonical_url || `${origin}/umrah/masaar-premium-umrah`,
    },
    openGraph: {
      title: pkg.seo_title,
      description: pkg.meta_description,
      url: pkg.canonical_url || `${origin}/umrah/masaar-premium-umrah`,
      siteName: "Masaar Holidays",
      images: [
        {
          url: `${origin}${pkg.featured_image}`,
          width: 1200,
          height: 630,
          alt: pkg.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pkg.seo_title,
      description: pkg.meta_description,
      images: [`${origin}${pkg.featured_image}`],
    },
  };
}

export default async function MasaarPremiumUmrahPage() {
  const pkg = await getMasaarPremiumPackage();
  const origin = getSiteOrigin();

  const makkahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "makkah") || pkg.hotels[0];
  const madinahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "madinah") || pkg.hotels[1];

  const minPrice = Math.min(...pkg.pricing.filter((p) => p.is_active).map((p) => p.price_aed), 4600);

  const whatsappBaseUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    `Assalamu Alaikum Masaar Holidays, I would like to enquire about the ${pkg.title} (${pkg.duration_days} Days / ${pkg.duration_nights} Nights). Please share availability, optional add-ons (Wheelchair / Private Guide), and package details.`
  )}`;

  const whatsappWheelchairUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    `Assalamu Alaikum Masaar Holidays, I would like to enquire about adding Wheelchair Assistance to the ${pkg.title}. Please share the available arrangements and details.`
  )}`;

  const whatsappPrivateGuideUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    `Assalamu Alaikum Masaar Holidays, I would like to enquire about adding a Private Guide to the ${pkg.title}. Please share the available arrangements and details.`
  )}`;

  // Product schema for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.title,
    description: pkg.meta_description,
    image: `${origin}${pkg.featured_image}`,
    brand: {
      "@type": "Brand",
      name: "Masaar Holidays",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AED",
      lowPrice: minPrice,
      highPrice: Math.max(...pkg.pricing.map((p) => p.price_aed), 6900),
      offerCount: pkg.pricing.length,
      offers: pkg.pricing.map((p) => ({
        "@type": "Offer",
        name: `${pkg.title} - ${p.room_type}`,
        price: p.price_aed,
        priceCurrency: p.currency,
        availability: "https://schema.org/InStock",
        url: `${origin}/umrah/masaar-premium-umrah#pricing`,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-warm-ivory/30 text-masaar-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Top Breadcrumb */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Umrah Packages", href: "/umrah" },
              { label: pkg.title },
            ]}
          />
        </Container>
      </div>

      {/* SECTION 1 — HERO */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white sm:py-24">
        <div className="absolute inset-0 z-0 opacity-25">
          <Image
            src={pkg.featured_image || "/brand/banners/umrah.webp"}
            alt={pkg.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/85 to-transparent" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-pure-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pure-gold border border-pure-gold/30">
              — VIP CURATED PILGRIMAGE —
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl lg:text-6xl text-white">
              {pkg.title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base sm:leading-relaxed">
              {pkg.full_description}
            </p>

            {/* Key Metrics / Highlights */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs">
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                ⏱️ {pkg.duration_days} Days / {pkg.duration_nights} Nights
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                🕋 Makkah: {makkahHotel.nights} Nights
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                🕌 Madinah: {madinahHotel.nights} Nights
              </span>
              <span className="rounded-md bg-emerald-500/20 px-3 py-1.5 font-semibold text-emerald-300 border border-emerald-500/30">
                📶 Complimentary Saudi eSIM
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white/90 backdrop-blur-xs">
                ♿ Wheelchair & Private Guide on Request
              </span>
              <span className="rounded-md bg-pure-gold/20 px-3 py-1.5 font-bold text-pure-gold border border-pure-gold/30">
                Starting from AED {minPrice.toLocaleString()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-masaar-black shadow hover:bg-warm-ivory transition-all"
              >
                <span>View Room Prices</span>
                <span>↓</span>
              </a>
              <a
                href={whatsappBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-masaar-black shadow-lg hover:bg-light-gold transition-all"
              >
                <span>Enquire on WhatsApp</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION 2 — PACKAGE INCLUSIONS */}
      <section className="py-16 bg-white border-b border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#936E0F]">
              Comprehensive Inclusions
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              Everything Included in Your Journey
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              All essential travel elements, flights, 5-star hospitality, and transport are thoughtfully arranged.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Umrah / KSA Tourist Visa */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <DocumentIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                1. Umrah / KSA Tourist Visa
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Full tourist / Umrah visa processing with official Ministry approval and pre-departure document verification.
              </p>
            </div>

            {/* 2. Saudi Airlines Flight Ticket */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <PlaneIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                2. Flight Ticket – Saudi Airlines
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Confirmed return flights on Saudi Airlines connecting the UAE directly with Jeddah and the holy cities.
              </p>
            </div>

            {/* 3. Historical Places Visit */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <CompassIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                3. Historical Places Visit
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Curated guided Ziyarah tours visiting key historical landmarks across both Makkah and Madinah with air-conditioned bus.
              </p>
            </div>

            {/* 4. Multilingual Guide Accompanied */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <FamilyIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                4. Multilingual Guide Accompanied
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Accompanied by knowledgeable scholar guides providing practical assistance and spiritual reassurance.
              </p>
            </div>

            {/* 5. Umrah Lecture */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <CheckIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                5. Umrah Lecture & Training
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Comprehensive step-by-step instructional session prior to departure covering the rites, etiquette, and significance of Umrah.
              </p>
            </div>

            {/* 6. Breakfast & Haramain Speed Train Included (DISTINCT TRAIN IDENTITY) */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-6 shadow-sm">
              <span className="absolute top-3 right-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Featured Transport
              </span>
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <TrainIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-emerald-950 text-base">
                6. Breakfast & Haramain Speed Train Included
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
                Daily 5-star international buffet breakfast plus the iconic high-speed <strong>Haramain Speed Train journey</strong> from Jeddah to Madinah.
              </p>
            </div>
          </div>

          {/* Complimentary Connectivity: Saudi eSIM */}
          <div className="mt-8 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <span className="text-2xl">📶</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Complimentary Bonus
                  </span>
                  <h4 className="font-bold text-emerald-950 text-base">
                    Complimentary Saudi eSIM Provided
                  </h4>
                </div>
                <p className="mt-1 text-xs text-emerald-900/85 leading-relaxed max-w-2xl">
                  Every pilgrim traveling on this package is provided with a complimentary high-speed Saudi data eSIM upon confirmation. Enjoy instant internet access as soon as you land at Jeddah Airport for navigation, rides, and staying in touch with loved ones and your group guides.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
              Included with Package
            </span>
          </div>
        </Container>
      </section>

      {/* SECTION 2B — OPTIONAL ADD-ONS (UPON REQUEST) */}
      <section className="py-16 bg-warm-ivory/30 border-b border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#936E0F]">
              Personalized Enhancements
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              Available Add-Ons (Upon Request)
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              Customise your pilgrimage with dedicated personal assistance. Simply request these add-ons when speaking with our team.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Add-On 1: Wheelchair Assistance */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold text-xl font-bold">
                    ♿
                  </span>
                  <span className="rounded-full bg-pure-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black border border-pure-gold/30">
                    Available Upon Request
                  </span>
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">
                  Wheelchair Assistance
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                  Dedicated wheelchair attendants arranged for elderly pilgrims or family members needing mobility support during Tawaf, Sa&apos;i, and prayer movements in Makkah and Madinah.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-masaar-black/75 border-t border-black/5 pt-3">
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Tawaf & Sa&apos;i accompaniment with experienced assistants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Comfortable and patient pacing for seniors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Coordination directly from your hotel lobby</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-2">
                <a
                  href={whatsappWheelchairUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-masaar-black py-2.5 px-4 text-xs font-semibold text-white hover:bg-black/85 transition-all"
                >
                  <span>Request Wheelchair Assistance</span>
                  <span>→</span>
                </a>
              </div>
            </div>

            {/* Add-On 2: Private Umrah Guide */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold text-xl font-bold">
                    👤
                  </span>
                  <span className="rounded-full bg-pure-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black border border-pure-gold/30">
                    Available Upon Request
                  </span>
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">
                  Private Guide
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                  Dedicated 1-on-1 religious scholar to accompany you and your family exclusively throughout your Umrah rites, offering personalized guidance and complete spiritual peace of mind.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-masaar-black/75 border-t border-black/5 pt-3">
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Personal 1-on-1 ritual guidance from Ihram to Tahallul</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Step-by-step Sunnah instruction and tailored family pace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-deep-gold font-bold">✓</span>
                    <span>Ideal for first-time pilgrims and private families</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-2">
                <a
                  href={whatsappPrivateGuideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-masaar-black py-2.5 px-4 text-xs font-semibold text-white hover:bg-black/85 transition-all"
                >
                  <span>Request Private Guide</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION 3 — HOTEL ACCOMMODATION */}
      <section className="py-16 sm:py-20 bg-warm-ivory/40">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#936E0F]">
              Handpicked 5-Star Accommodations
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              Premier Stays in Makkah & Madinah
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              Carefully chosen 5-star hotels offering restful hospitality and effortless access to the Two Holy Mosques.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Makkah Hotel Card */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="relative aspect-video w-full bg-neutral-100 overflow-hidden">
                  <Image
                    src={makkahHotel.image_url || "/hotels/makkah-towers-swissotel.webp"}
                    alt={makkahHotel.hotel_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <span className="absolute top-4 left-4 rounded-full bg-masaar-black/85 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                    Makkah Al-Mukarramah · {makkahHotel.nights} Nights
                  </span>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-deep-gold">
                    <span>⭐⭐⭐⭐⭐</span>
                    <span>5-Star Luxury Accommodation</span>
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    {makkahHotel.hotel_name}
                  </h3>
                  <p className="mt-1 text-xs text-masaar-black/60">
                    {makkahHotel.distance_note || "Directly in Jabal Omar, level walking access to Haram"}
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-masaar-black/75">
                    {makkahHotel.description}
                  </p>
                  <ul className="mt-5 space-y-2 text-xs text-masaar-black/70 border-t border-black/5 pt-4">
                    <li className="flex items-center gap-2">
                      <span className="text-deep-gold font-bold">✓</span>
                      <span>3 Nights stay in Holy Makkah</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-deep-gold font-bold">✓</span>
                      <span>Daily gourmet international buffet breakfast</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-deep-gold font-bold">✓</span>
                      <span>Easy, unhurried walking access to the Holy Haram</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Madinah Hotel Card */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="relative aspect-video w-full bg-neutral-100 overflow-hidden">
                  <Image
                    src={madinahHotel.image_url || "/hotels/anwar-al-madinah-movenpick.webp"}
                    alt={madinahHotel.hotel_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <span className="absolute top-4 left-4 rounded-full bg-masaar-black/85 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                    Madinah Al-Munawwarah · {madinahHotel.nights} Nights
                  </span>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-deep-gold">
                    <span>⭐⭐⭐⭐⭐</span>
                    <span>5-Star Luxury Accommodation</span>
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    {madinahHotel.hotel_name}
                  </h3>
                  <p className="mt-1 text-xs text-masaar-black/60">
                    {madinahHotel.distance_note || "Approx. 50m from Prophet's Mosque with flat pathway"}
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-masaar-black/75">
                    {madinahHotel.description}
                  </p>
                  <ul className="mt-5 space-y-2 text-xs text-masaar-black/70 border-t border-black/5 pt-4">
                    <li className="flex items-center gap-2">
                      <span className="text-deep-gold font-bold">✓</span>
                      <span>2 Nights stay in blessed Madinah Al-Munawwarah</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-deep-gold font-bold">✓</span>
                      <span>Daily international buffet breakfast</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-deep-gold font-bold">✓</span>
                      <span>Convenient 1-minute walk along a smooth, flat pathway to Mosque</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION 4 — ROOM PRICING */}
      <section id="pricing" className="scroll-mt-16 bg-white py-16 sm:py-20 border-y border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#936E0F]">
              Transparent Pricing
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              Room Pricing & Occupancy Breakdown
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              All prices are in UAE Dirhams (AED), quoted on a per-person basis covering accommodation, flights, Haramain train and ground transfers.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {pkg.pricing.map((item) => {
              const whatsappRoomUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                `Assalamu Alaikum Masaar Holidays, I would like to book/enquire about the ${item.room_type} (AED ${item.price_aed.toLocaleString()} ${item.pricing_basis}) for the ${pkg.title}.`
              )}`;

              return (
                <div
                  key={item.room_type}
                  className={`relative flex flex-col justify-between rounded-xl border p-6 text-center transition-all ${
                    item.popular
                      ? "border-pure-gold bg-pure-gold/5 ring-2 ring-pure-gold/40 shadow-md"
                      : "border-black/10 bg-white shadow-xs"
                  }`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pure-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black shadow">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <h3 className="font-bold text-masaar-black text-sm">{item.room_type}</h3>
                    <div className="mt-4 border-y border-black/5 py-4">
                      <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
                        AED {item.price_aed.toLocaleString()}
                      </span>
                      <span className="block text-[11px] text-masaar-black/60 mt-0.5 font-medium">
                        / {item.pricing_basis || "person"}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-3 text-[11px] leading-relaxed text-masaar-black/70">
                        {item.note}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-2">
                    <a
                      href={whatsappRoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full rounded-md bg-masaar-black py-2.5 px-3 text-xs font-semibold text-white hover:bg-black/85 transition-all"
                    >
                      Enquire for Room
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl bg-warm-ivory border border-black/10 p-4 text-xs text-masaar-black/75 text-center max-w-2xl mx-auto">
            💡 <strong>Pricing Basis Note:</strong> All rates are quoted <strong>per person</strong> in UAE Dirhams (AED) based on the confirmed room occupancy sharing configuration.
          </div>
        </Container>
      </section>

      {/* SECTION 5 — SIX-DAY ITINERARY ACCORDION */}
      <section className="py-16 sm:py-20 bg-warm-ivory/30">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#936E0F]">
              Day-by-Day Pilgrimage Schedule
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              6-Day Journey Itinerary
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              Carefully organized to allow unhurried worship, smooth transport transitions, and memorable spiritual milestones.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <PremiumItineraryAccordion itinerary={pkg.itinerary} />
          </div>
        </Container>
      </section>

      {/* SECTION 6 — WHATSAPP ENQUIRY CTA */}
      <section className="bg-masaar-black py-16 text-white text-center">
        <Container>
          <div className="max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-pure-gold">
              Dedicated Umrah Concierge
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl text-white">
              Plan Your Umrah Journey With Masaar
            </h2>
            <p className="mt-3 text-xs text-white/75 leading-relaxed sm:text-sm">
              Speak with our team about room options, travel arrangements and package availability.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={whatsappBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-pure-gold px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-masaar-black shadow-lg hover:bg-light-gold transition-all"
              >
                <span>Enquire on WhatsApp Now →</span>
              </a>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-white/30 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
              >
                Contact Our Desk
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Thoughtful Services Site-Wide Section */}
      <CrossLinkServices
        exclude="umrah"
        className="py-16 bg-white border-t border-black/5"
      />
    </div>
  );
}
