"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PackageRow, UmrahDepartureMonthRow } from "@/lib/types/database";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { UmrahTierCards } from "./UmrahTierCards";
import { UmrahEnquiryModal, type PackageEnquiryInfo } from "./UmrahEnquiryModal";

interface Props {
  month: UmrahDepartureMonthRow;
  nextMonth: UmrahDepartureMonthRow | null;
  packages: PackageRow[];
  inventoryConfigs: PublicUmrahInventoryConfig[];
}

export function UmrahMonthPageClient({ month, nextMonth, packages, inventoryConfigs }: Props) {
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
    shortDescription: `A simple and comfortable Umrah package for ${month.display_label}.`,
  });

  const openEnquiry = (info: PackageEnquiryInfo) => {
    setEnquiryPackage(info);
    setIsModalOpen(true);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Umrah", href: "/umrah" }, { label: month.display_label }]} />

      {/* ── Month Hero — same visual language as the main Umrah hero, no CTA button ── */}
      <div className="relative w-full overflow-hidden border-b border-black/10 bg-[#FAF7F2]">
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-full lg:w-7/12">
          <div className="relative h-full w-full">
            {month.hero_image_url ? (
              <ExternalImage
                src={month.hero_image_url}
                alt={month.display_label}
                fill
                priority
                className="object-cover object-right"
              />
            ) : (
              <Image
                src="/brand/banners/umrah.png"
                alt={month.display_label}
                fill
                priority
                className="object-cover object-right"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent lg:via-[#FAF7F2]/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent lg:hidden" />
          </div>
        </div>

        <Container className="relative z-10 py-14 lg:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
              <span>—</span>
              <span>Umrah Packages · {month.display_label}</span>
              <span>—</span>
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-masaar-black sm:text-5xl sm:leading-[1.15]">
              {month.hero_headline || `Your ${month.display_label} Umrah Journey`}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-masaar-black/75 sm:text-lg">
              {month.hero_subtext ||
                "Comfortable stays, private transfers and dedicated support — so you can focus on what truly matters."}
            </p>
          </div>
        </Container>
      </div>

      {/* ── Package Cards — same Essential/Signature/Exclusive cards as the main Umrah page ── */}
      <UmrahTierCards packages={packages} inventoryConfigs={inventoryConfigs} onOpenEnquiry={openEnquiry} />

      {/* ── Another month? ── */}
      <section className="pb-16">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2">
            <Link
              href="/umrah"
              className="flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-colors hover:border-deep-gold/40"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-deep-gold">Looking for something else?</p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
                  Request a Package for Another Month
                </h3>
                <p className="mt-2 text-sm text-masaar-black/60">
                  Browse all Umrah packages and departure months from the main Umrah page.
                </p>
              </div>
              <span className="mt-4 text-sm font-semibold text-deep-gold">← Back to Umrah Packages</span>
            </Link>

            {nextMonth && (
              <Link
                href={`/umrah/departures/${nextMonth.slug}`}
                className="flex flex-col justify-between rounded-2xl border border-deep-gold/40 bg-warm-ivory/50 p-6 shadow-sm transition-colors hover:border-deep-gold"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-deep-gold">Planning ahead?</p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
                    {nextMonth.display_label} Packages
                  </h3>
                  <p className="mt-2 text-sm text-masaar-black/60">
                    See Umrah packages and pricing for {nextMonth.display_label}.
                  </p>
                </div>
                <span className="mt-4 text-sm font-semibold text-deep-gold">
                  View {nextMonth.display_label} →
                </span>
              </Link>
            )}
          </div>
        </Container>
      </section>

      <UmrahEnquiryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} packageInfo={enquiryPackage} />
    </>
  );
}
