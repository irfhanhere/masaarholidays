"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PackageRow, FaqRow, UmrahDepartureMonthRow } from "@/lib/types/database";
import type { PublicAddonCatalogRow, PublicUmrahInventoryConfig } from "@/lib/data/public";
import dynamic from "next/dynamic";
import { formatDepartureMonthName } from "@/lib/date-utils";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";
import { CalendarIcon } from "./icons";
import { UmrahHero } from "./UmrahHero";
import { UmrahTierCards } from "./UmrahTierCards";
import { UmrahMakkahMadinahSection } from "./UmrahMakkahMadinahSection";
import { UmrahExperienceStrip } from "./UmrahExperienceStrip";
import { UmrahOptionalAddons, mergeAddons } from "./UmrahOptionalAddons";
import { UmrahFaqSection } from "./UmrahFaqSection";
import type { PackageEnquiryInfo } from "./UmrahEnquiryModal";

const UmrahAddonsCartModal = dynamic(() => import("./UmrahAddonsCartModal").then((m) => m.UmrahAddonsCartModal), { ssr: false });
const UmrahEnquiryModal = dynamic(() => import("./UmrahEnquiryModal").then((m) => m.UmrahEnquiryModal), { ssr: false });

interface Props {
  packages: PackageRow[];
  inventoryConfigs: PublicUmrahInventoryConfig[];
  faqs: FaqRow[];
  addons: PublicAddonCatalogRow[];
  defaultMonthSlug: string | null;
  departureMonths?: UmrahDepartureMonthRow[];
}

export function UmrahLandingClient({
  packages,
  inventoryConfigs,
  faqs,
  addons,
  defaultMonthSlug,
  departureMonths,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enquiryPackage, setEnquiryPackage] = useState<PackageEnquiryInfo>({
    name: "Essential Umrah",
    tier: "ESSENTIAL",
    destination: "Makkah",
    duration: "2 Nights / 3 Days",
    hotelName: "VOCO Makkah",
    hotelRating: "5-Star accommodation",
    shuttleInfo: "24/7 dedicated Haram shuttle",
    imageUrl: "/brand/banners/umrah.webp",
    shortDescription: "A simple and comfortable Umrah package designed for a meaningful spiritual journey.",
  });
  const [isAddonsCartOpen, setIsAddonsCartOpen] = useState(false);
  const [initialAddonId, setInitialAddonId] = useState<string | undefined>(undefined);

  const openEnquiry = (info: PackageEnquiryInfo) => {
    setEnquiryPackage(info);
    setIsModalOpen(true);
  };

  const handleSelectAddon = (addonId: string) => {
    setInitialAddonId(addonId);
    setIsAddonsCartOpen(true);
  };

  const WHATSAPP_NUMBER = "971557329320";
  const bottomCtaMessage = encodeURIComponent(
    "Assalamu Alaikum,\n\nI'm ready to begin planning my Umrah journey with Masaar Holidays.\n\nPlease connect me with an advisor.\n\nJazakAllah Khair."
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Umrah" }]} />

      {/* 1. Umrah Hero */}
      <UmrahHero
        onOpenEnquiry={() =>
          openEnquiry({
            name: "Custom Umrah Journey",
            tier: "SIGNATURE",
            destination: "Makkah & Madinah",
            duration: "Custom Duration",
            hotelName: "Handpicked 5-Star Hotels",
            hotelRating: "5-Star accommodation",
            shuttleInfo: "Private transfers & Haram access",
            imageUrl: "/brand/banners/umrah.webp",
            shortDescription: "Personalized pilgrimage crafted around your family's exact dates and requirements.",
          })
        }
      />

      {/* 2. Choose Your Umrah Experience (3 Full-Width Tier Cards) */}
      <UmrahTierCards
        packages={packages}
        inventoryConfigs={inventoryConfigs}
        onOpenEnquiry={openEnquiry}
      />

      {/* 2b. Browse Umrah by Departure Month (Direct Internal Links) */}
      {departureMonths && departureMonths.length > 0 && (
        <section className="bg-warm-ivory/60 py-12 border-y border-black/5">
          <Container>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-pure-gold">Planned Departures</p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-masaar-black">
                Browse Umrah by Departure Month
              </h2>
              <p className="mt-1.5 text-sm text-masaar-black/70">
                Choose your intended travel month from the UAE for verified schedules, hotels, and package arrangements.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {departureMonths.map((m) => (
                <Link
                  key={m.id}
                  href={`/umrah/departures/${m.slug}`}
                  className="group flex flex-col items-center justify-center rounded-xl border border-black/10 bg-white p-4 text-center transition-all hover:border-pure-gold hover:shadow-md"
                >
                  <CalendarIcon className="size-5 text-deep-gold mb-2 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-bold text-masaar-black group-hover:text-deep-gold">
                    {formatDepartureMonthName(m.display_label)}
                  </span>
                  <span className="mt-1 text-[11px] text-masaar-black/50">View Packages →</span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 3. Makkah + Madinah Combined Section */}
      <UmrahMakkahMadinahSection
        packages={packages}
        inventoryConfigs={inventoryConfigs}
        onOpenEnquiry={openEnquiry}
        defaultMonthSlug={defaultMonthSlug}
      />

      {/* 4. Complete Umrah Experience Strip & Promo Cards */}
      <UmrahExperienceStrip />

      {/* 5. Optional Add-ons 5-Card Grid */}
      <UmrahOptionalAddons
        addons={addons}
        onSelectAddon={handleSelectAddon}
      />

      {/* 7. FAQ Preview with 6-Tab Filter */}
      <UmrahFaqSection faqs={faqs} />

      {/* 8. Ready to Begin Bottom Banner matching UMRAH LANDING.png */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <Image
            src="/brand/banners/umrah.webp"
            alt="Tawaf around the Holy Kaaba during Umrah"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/90 to-masaar-black/80" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9A227]">READY TO BEGIN?</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold">
              Let Us Plan Your Umrah
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-lg">
              Tell us what you need. We&apos;ll help you build the right experience.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${bottomCtaMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#A87F12] px-8 py-4 text-sm font-bold text-white shadow-md hover:bg-[#936e0f] transition-all hover:shadow-lg"
            >
              <span>💬</span>
              <span>WhatsApp Us →</span>
            </a>
            <p className="text-[11px] text-white/50">Fast responses. Personal support.</p>
          </div>
        </div>
      </section>

      {/* 9. Interactive Dynamic WhatsApp Enquiry Modal */}
      <UmrahEnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageInfo={enquiryPackage}
      />

      {/* 10. Optional Add-ons Enquiry Basket */}
      <UmrahAddonsCartModal
        isOpen={isAddonsCartOpen}
        onClose={() => setIsAddonsCartOpen(false)}
        addons={mergeAddons(addons)}
        initialAddonId={initialAddonId}
      />
    </>
  );
}
