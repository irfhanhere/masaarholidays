"use client";

import { useState } from "react";
import Image from "next/image";
import type { PackageRow, FaqRow } from "@/lib/types/database";
import type { PublicAddonCatalogRow, PublicUmrahInventoryConfig } from "@/lib/data/public";
import { Breadcrumbs } from "./Breadcrumbs";
import { UmrahHero } from "./UmrahHero";
import { UmrahTierCards } from "./UmrahTierCards";
import { UmrahMakkahMadinahSection } from "./UmrahMakkahMadinahSection";
import { UmrahExperienceStrip } from "./UmrahExperienceStrip";
import { UmrahOptionalAddons, mergeAddons } from "./UmrahOptionalAddons";
import { UmrahAddonsCartModal } from "./UmrahAddonsCartModal";
import { UmrahFaqSection } from "./UmrahFaqSection";
import { UmrahEnquiryModal, type PackageEnquiryInfo } from "./UmrahEnquiryModal";

interface Props {
  packages: PackageRow[];
  inventoryConfigs: PublicUmrahInventoryConfig[];
  faqs: FaqRow[];
  addons: PublicAddonCatalogRow[];
  defaultMonthSlug: string | null;
}

export function UmrahLandingClient({ packages, inventoryConfigs, faqs, addons, defaultMonthSlug }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enquiryPackage, setEnquiryPackage] = useState<PackageEnquiryInfo>({
    name: "Essential Umrah",
    tier: "ESSENTIAL",
    destination: "Makkah",
    duration: "2 Nights / 3 Days",
    hotelName: "VOCO Makkah",
    hotelRating: "5-Star accommodation",
    shuttleInfo: "24/7 dedicated Haram shuttle",
    imageUrl: "/brand/banners/umrah.png",
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

  const WHATSAPP_NUMBER = "971552276299";
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
            imageUrl: "/brand/banners/umrah.png",
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
            src="/brand/banners/umrah.png"
            alt=""
            fill
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
