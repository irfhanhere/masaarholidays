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
  CarIcon,
} from "@/components/site/icons";
import { CONTACT } from "@/lib/contact";
import { getMasaarBestSellingPackage } from "@/lib/data/best-selling-package";
import { getSiteOrigin } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const pkg = await getMasaarBestSellingPackage();
  const origin = getSiteOrigin();

  return {
    title: pkg.seo_title,
    description: pkg.meta_description,
    keywords: [
      "Best Selling Umrah package UAE",
      "Umrah package from UAE",
      "Umrah package from Dubai",
      "Makkah DoubleTree Hilton Umrah",
      "Worth Tharawat Hotel Madinah Umrah",
      "Umrah packages Dubai",
    ],
    alternates: {
      canonical: pkg.canonical_url || `${origin}/umrah/masaar-best-selling-umrah`,
    },
    openGraph: {
      title: pkg.seo_title,
      description: pkg.meta_description,
      url: pkg.canonical_url || `${origin}/umrah/masaar-best-selling-umrah`,
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

export default async function MasaarBestSellingUmrahPage() {
  const pkg = await getMasaarBestSellingPackage();
  const origin = getSiteOrigin();

  const makkahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "makkah") || pkg.hotels[0];
  const madinahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "madinah") || pkg.hotels[1];

  const quadPrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("quad"))?.price_aed ?? 3900;
  const triplePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("triple"))?.price_aed ?? 4100;
  const doublePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("double"))?.price_aed ?? 4500;
  const singlePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("single"))?.price_aed ?? 6400;
  const childPrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("child"))?.price_aed ?? 2700;

  const minPrice = 3900;

  const whatsappBaseUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    `Assalamu Alaikum Masaar Holidays, I would like to enquire about the ${pkg.title} (6 Days / 5 Nights). Please share current departure availability, room category options, and booking details.`
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
      highPrice: Math.max(...pkg.pricing.map((p) => p.price_aed), 6400),
      offerCount: pkg.pricing.length,
      offers: pkg.pricing.map((p) => ({
        "@type": "Offer",
        name: `${pkg.title} - ${p.room_type}`,
        price: p.price_aed,
        priceCurrency: p.currency,
        availability: "https://schema.org/InStock",
        url: `${origin}/umrah/masaar-best-selling-umrah#pricing`,
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
            <span className="inline-block rounded-full bg-pure-gold px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-masaar-black shadow-xs">
              ★ BEST SELLING PILGRIMAGE PACKAGE
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
                🕋 Makkah: {makkahHotel.nights} Nights ({makkahHotel.hotel_name})
              </span>
              <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur-xs">
                🕌 Madinah: {madinahHotel.nights} Nights ({madinahHotel.hotel_name})
              </span>
              <span className="rounded-md bg-emerald-500/20 px-3 py-1.5 font-semibold text-emerald-300 border border-emerald-500/30">
                📶 Complimentary Saudi eSIM Included
              </span>
              <span className="rounded-md bg-pure-gold/20 px-3 py-1.5 font-bold text-pure-gold border border-pure-gold/30">
                Starting from AED {quadPrice.toLocaleString()} / person
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
              Comprehensive Package Inclusions
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              Everything Included in Your Journey
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              All 9 essential travel elements and services arranged with care from start to finish.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Flights */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <PlaneIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                1. Flights Included
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Confirmed roundtrip international flights from the UAE connecting directly with the Kingdom of Saudi Arabia.
              </p>
            </div>

            {/* 2. Hotels */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <BedIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                2. Handpicked Hotel Accommodation
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                3 Nights at DoubleTree by Hilton Makkah &amp; 2 Nights at Worth Tharawat Hotel in Madinah.
              </p>
            </div>

            {/* 3. Daily Breakfast */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <CheckIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                3. Daily Breakfast
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Complimentary hotel breakfast served daily during your stay in both Makkah and Madinah hotels.
              </p>
            </div>

            {/* 4. Airport Transfers */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <CarIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                4. Airport Transfers
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Coordinated airport arrival meet-and-assist and departure transfers to ensure smooth, stress-free transit.
              </p>
            </div>

            {/* 5. Intercity Transfer */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <TrainIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                5. Intercity Transfer (Makkah ↔ Madinah)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Organized intercity transit between Makkah and Madinah by Haramain High Speed Railway or comfortable private vehicle.
              </p>
            </div>

            {/* 6. Saudi Visa */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <DocumentIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                6. Saudi Visa Processing
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Complete Saudi tourist / Umrah visa processing with official Ministry approval and pre-departure document verification.
              </p>
            </div>

            {/* 7. Wheelchair Assistance */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <span className="text-xl">♿</span>
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                7. Wheelchair Assistance
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Mobility support and wheelchair assistance arranged upon request to facilitate Tawaf, Sa&apos;i, and prayer attendance.
              </p>
            </div>

            {/* 8. Complimentary Saudi eSIM */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 transition-all hover:border-emerald-300 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">
                ✓
              </div>
              <h3 className="mt-4 font-bold text-emerald-950 text-base flex items-center justify-between">
                <span>8. Complimentary Saudi eSIM</span>
                <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] uppercase font-bold text-emerald-800">Free</span>
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
                Complimentary high-speed digital SIM provided to every pilgrim for instant internet connectivity upon arrival in Saudi Arabia.
              </p>
            </div>

            {/* 9. Umrah Guide Assistance */}
            <div className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 transition-all hover:border-black/20 hover:shadow-xs">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warm-ivory text-deep-gold">
                <FamilyIcon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-masaar-black text-base">
                9. Umrah Guide Assistance
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Personal ritual guidance and assistance available throughout your pilgrimage rites. Contact WhatsApp for specific scholar assistance options.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION 3 — HOTELS */}
      <section className="py-16 bg-warm-ivory/40 border-b border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#936E0F]">
              Accommodation
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              Your Hotels in Makkah &amp; Madinah
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              Selected for comfort, clean amenities, and ease of access to the Two Holy Mosques.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Makkah Hotel */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs">
              <div className="relative h-64 w-full">
                <Image
                  src={makkahHotel.image_url || "/hotels/makkah-towers-swissotel.webp"}
                  alt={makkahHotel.hotel_name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 rounded-full bg-masaar-black/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                  Makkah • 3 Nights
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-masaar-black">{makkahHotel.hotel_name}</h3>
                <p className="mt-1 text-xs text-deep-gold font-medium">DoubleTree by Hilton Makkah</p>
                <p className="mt-3 text-xs leading-relaxed text-masaar-black/70">
                  {makkahHotel.description || "Convenient stay at DoubleTree by Hilton Makkah offering quality hospitality, modern amenities, and dependable access towards the Holy Haram."}
                </p>
              </div>
            </div>

            {/* Madinah Hotel */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs">
              <div className="relative h-64 w-full">
                <Image
                  src={madinahHotel.image_url || "/hotels/anwar-al-madinah-movenpick.webp"}
                  alt={madinahHotel.hotel_name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 rounded-full bg-masaar-black/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                  Madinah • 2 Nights
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-masaar-black">{madinahHotel.hotel_name}</h3>
                <p className="mt-1 text-xs text-deep-gold font-medium">Worth Tharawat Hotel</p>
                <p className="mt-3 text-xs leading-relaxed text-masaar-black/70">
                  {madinahHotel.description || "Comfortable accommodation in Madinah located within walking distance of the Prophet's Mosque (Al-Masjid An-Nabawi) with convenient guest services."}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION 4 — ROOM-WISE PRICING */}
      <section id="pricing" className="py-16 bg-white border-b border-black/5">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#936E0F]">
              Transparent Pricing (UAE Market)
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-4xl">
              Room-Wise Rates &amp; Occupancy
            </h2>
            <p className="mt-2 text-xs text-masaar-black/60 sm:text-sm">
              All prices are quoted per person in AED with no hidden fees or surprise charges.
            </p>
          </div>

          <div className="mt-12 max-w-3xl mx-auto overflow-hidden rounded-2xl border border-black/10 bg-warm-ivory/30 shadow-xs">
            <div className="p-6 sm:p-8 space-y-4">
              {/* Quad Room */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-black/5 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-masaar-black text-base">Quad Room</span>
                    <span className="rounded-full bg-pure-gold/20 text-[#8C6D06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                  <p className="text-xs text-masaar-black/60 mt-0.5">4 guests sharing • 4 separate beds • Daily breakfast included</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    AED {quadPrice.toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-masaar-black/50">per person</span>
                </div>
              </div>

              {/* Triple Room */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-black/5 gap-2">
                <div>
                  <span className="font-bold text-masaar-black text-base">Triple Room</span>
                  <p className="text-xs text-masaar-black/60 mt-0.5">3 guests sharing • 3 separate beds • Daily breakfast included</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    AED {triplePrice.toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-masaar-black/50">per person</span>
                </div>
              </div>

              {/* Double Room */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-black/5 gap-2">
                <div>
                  <span className="font-bold text-masaar-black text-base">Double Room</span>
                  <p className="text-xs text-masaar-black/60 mt-0.5">2 guests sharing • 1 king or 2 twin beds • Daily breakfast included</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    AED {doublePrice.toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-masaar-black/50">per person</span>
                </div>
              </div>

              {/* Single Room */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-black/5 gap-2">
                <div>
                  <span className="font-bold text-masaar-black text-base">Single Room</span>
                  <p className="text-xs text-masaar-black/60 mt-0.5">1 guest private room • Daily breakfast included</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    AED {singlePrice.toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-masaar-black/50">per person</span>
                </div>
              </div>

              {/* Child with Bed */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-950 text-base">Child with Bed</span>
                    <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                      Dedicated Bed
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/70 mt-0.5">Child aged 2–11 with dedicated hotel bed and full package inclusions</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-amber-950">
                    AED {childPrice.toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-amber-900/60">per child with bed</span>
                </div>
              </div>

              {/* CTA in pricing box */}
              <div className="pt-4 text-center">
                <a
                  href={whatsappBaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-pure-gold hover:bg-deep-gold px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-masaar-black hover:text-white transition-all shadow-md"
                >
                  Book or Enquire for this Package on WhatsApp →
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Cross link other travel services */}
      <CrossLinkServices exclude="umrah" />
    </div>
  );
}
