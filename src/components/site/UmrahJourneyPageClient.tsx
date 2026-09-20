"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PackageRow, UmrahDepartureMonthRow } from "@/lib/types/database";
import type { PublicUmrahInventoryConfig } from "@/lib/data/public";
import {
  UMRAH_TIER_ORDER,
  UMRAH_TIER_LABEL,
  UMRAH_TIER_DESCRIPTION,
  UMRAH_TIER_HEADING,
  UMRAH_TIER_HERO_DESCRIPTION,
  UMRAH_JOURNEY_IMPORTANT_INFO,
  type UmrahTierKey,
} from "@/lib/umrah-journey";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { Price } from "./Price";
import { WhatsAppButton } from "./WhatsAppButton";
import { CarIcon, CheckIcon, HeadsetIcon, KaabaIcon } from "./icons";

type Occupancy = "Double" | "Triple" | "Quad";
const OCCUPANCIES: Occupancy[] = ["Double", "Triple", "Quad"];

interface Props {
  month: UmrahDepartureMonthRow;
  activeTier: UmrahTierKey;
  tierPackages: Record<UmrahTierKey, PackageRow | null>;
  journeyConfigsByTier: Record<UmrahTierKey, PublicUmrahInventoryConfig[]>;
}

function InfoIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v5.5M12 8v.01" />
    </svg>
  );
}

export function UmrahJourneyPageClient({ month, activeTier, tierPackages, journeyConfigsByTier }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pkg = tierPackages[activeTier];
  const configs = journeyConfigsByTier[activeTier];

  const durationParam = searchParams.get("duration");
  const occupancyParam = searchParams.get("occupancy");

  const initialConfig =
    (durationParam && configs.find((c) => String(c.duration_nights) === durationParam)) || configs[0];

  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(initialConfig?.id);
  const [selectedOccupancy, setSelectedOccupancy] = useState<Occupancy>(
    occupancyParam && (OCCUPANCIES as string[]).includes(occupancyParam) ? (occupancyParam as Occupancy) : "Double"
  );

  const activeConfig = configs.find((c) => c.id === selectedConfigId) ?? configs[0];

  const updateQuery = (next: { duration?: number; occupancy?: Occupancy }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.duration != null) params.set("duration", String(next.duration));
    if (next.occupancy != null) params.set("occupancy", next.occupancy);
    router.replace(`/umrah/departures/${month.slug}/${activeTier}?${params.toString()}`, { scroll: false });
  };

  const selectDuration = (config: PublicUmrahInventoryConfig) => {
    setSelectedConfigId(config.id);
    updateQuery({ duration: config.duration_nights, occupancy: selectedOccupancy });
  };

  const selectOccupancy = (occ: Occupancy) => {
    setSelectedOccupancy(occ);
    updateQuery({ duration: activeConfig?.duration_nights, occupancy: occ });
  };

  const priceForOccupancy = (occ: Occupancy) =>
    activeConfig?.room_prices.find((r) => r.occupancy_type === occ)?.price_aed;

  const currentPrice = priceForOccupancy(selectedOccupancy);

  const tierLinkHref = (tier: UmrahTierKey) => {
    const params = new URLSearchParams();
    const targetConfigs = journeyConfigsByTier[tier];
    const matching = activeConfig
      ? targetConfigs.find((c) => c.duration_nights === activeConfig.duration_nights)
      : undefined;
    if (matching) params.set("duration", String(matching.duration_nights));
    params.set("occupancy", selectedOccupancy);
    return `/umrah/departures/${month.slug}/${tier}?${params.toString()}`;
  };

  // No combined-journey data at all for this tier/month yet — informational error state, not a hard 404.
  if (!pkg || !activeConfig) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black">
          Package Not Available
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-masaar-black/70">
          This Umrah package is currently unavailable. Please return to the Umrah packages page or contact Masaar
          Holidays.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/umrah"
            className="rounded-md border border-black/20 px-5 py-3 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
          >
            View Umrah Packages
          </Link>
          <WhatsAppButton templateKey="general">Enquire on WhatsApp</WhatsAppButton>
        </div>
      </Container>
    );
  }

  const inclusionsText = activeConfig.inclusions_override || pkg.inclusions_text;
  const inclusionsList = inclusionsText?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];

  const stayText = `${activeConfig.makkah_nights} nights in Makkah + ${activeConfig.madinah_nights} nights in Madinah`;

  const whatsappParams =
    currentPrice != null
      ? {
          packageName: `${UMRAH_TIER_LABEL[activeTier]} Umrah`,
          journey: "Makkah + Madinah",
          month: month.display_label,
          duration: activeConfig.duration_label,
          stay: `${activeConfig.makkah_nights} Nights Makkah + ${activeConfig.madinah_nights} Nights Madinah`,
          occupancy: selectedOccupancy,
          price: `AED ${currentPrice.toLocaleString()} per person`,
        }
      : undefined;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Umrah", href: "/umrah" },
          { label: month.display_label, href: `/umrah/departures/${month.slug}` },
          { label: `${UMRAH_TIER_LABEL[activeTier]} Umrah` },
        ]}
      />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-masaar-black">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative">
            <ExternalImage src="/brand/banners/umrah.png" alt="Makkah" fill className="object-cover opacity-70" />
          </div>
          <div className="relative" style={{ clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0% 100%)" }}>
            <ExternalImage
              src="/trips/PRIVATE-TRIP-MADINAH-CARD.png"
              alt="Madinah"
              fill
              className="object-cover opacity-80"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/70 to-masaar-black/30" />

        <Container className="relative py-14 sm:py-20">
          <p className="text-right text-xs font-semibold uppercase tracking-widest text-light-gold sm:hidden" />
          <div className="absolute right-4 top-6 hidden max-w-[220px] text-right text-xs font-semibold uppercase leading-relaxed tracking-widest text-white/90 sm:block sm:right-8">
            Two Sacred Cities
            <br />
            One Meaningful Journey
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-light-gold">
            {UMRAH_TIER_LABEL[activeTier]} Umrah · Makkah + Madinah
          </p>
          <h1 className="mt-2 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold text-white sm:text-4xl">
            {UMRAH_TIER_HEADING[activeTier]}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
            {UMRAH_TIER_HERO_DESCRIPTION[activeTier]}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <div className="flex items-center gap-2 text-white">
              <KaabaIcon className="size-5 text-light-gold" />
              <div>
                <p className="text-xs font-semibold">Makkah + Madinah</p>
                <p className="text-[11px] text-white/60">2 Holy Cities</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CarIcon className="size-5 text-light-gold" />
              <div>
                <p className="text-xs font-semibold">Private Transfers</p>
                <p className="text-[11px] text-white/60">End-to-End</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <HeadsetIcon className="size-5 text-light-gold" />
              <div>
                <p className="text-xs font-semibold">24/7 Support</p>
                <p className="text-[11px] text-white/60">Masaar Holidays</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppButton templateKey="umrahJourney" params={whatsappParams}>
              Enquire on WhatsApp
            </WhatsAppButton>
            <Link
              href="/umrah"
              className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              ← Back to Umrah Packages
            </Link>
          </div>
        </Container>
      </div>

      {/* ── Tier Selector ──────────────────────────────────────────── */}
      <section className="py-10">
        <Container>
          <p className="text-xs font-bold uppercase tracking-widest text-deep-gold">1. Select Your Tier</p>
          <p className="mt-1 text-sm text-masaar-black/60">
            Choose the experience that suits your needs. You can change this anytime.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {UMRAH_TIER_ORDER.map((tier) => {
              const isActive = tier === activeTier;
              return (
                <Link
                  key={tier}
                  href={tierLinkHref(tier)}
                  scroll={false}
                  className={`rounded-xl border p-4 transition-colors ${
                    isActive
                      ? "border-deep-gold bg-warm-ivory/70"
                      : "border-black/10 bg-white hover:border-deep-gold/40"
                  }`}
                >
                  <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-masaar-black">
                    {UMRAH_TIER_LABEL[tier]} Umrah
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-masaar-black/60">
                    {UMRAH_TIER_DESCRIPTION[tier]}
                  </p>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Duration Selector + Pricing ────────────────────────────── */}
      <section className="pb-10">
        <Container>
          <p className="text-xs font-bold uppercase tracking-widest text-deep-gold">2. Select Your Duration</p>
          <p className="mt-1 text-sm text-masaar-black/60">
            Choose your preferred stay duration in Makkah and Madinah.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1">
            {configs.map((c) => {
              const isActive = c.id === activeConfig.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectDuration(c)}
                  className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-bold transition-colors ${
                    isActive
                      ? "border-deep-gold bg-deep-gold text-white"
                      : "border-black/15 bg-white text-masaar-black/70 hover:bg-warm-ivory"
                  }`}
                >
                  {c.makkah_nights}N / {c.madinah_nights}N
                  <span className="ml-1 font-normal opacity-80">({c.duration_nights}N/{c.duration_days}D)</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                {activeConfig.duration_label}
              </h2>
              <p className="mt-1 text-sm text-masaar-black/60">{stayText}</p>

              <div className="mt-5 overflow-hidden rounded-lg border border-black/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-warm-ivory/60 text-left text-xs uppercase tracking-wide text-masaar-black/60">
                      <th className="px-4 py-2.5 font-semibold">Occupancy</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Price (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {OCCUPANCIES.map((occ) => {
                      const price = priceForOccupancy(occ);
                      if (price == null) return null;
                      const isSelected = occ === selectedOccupancy;
                      return (
                        <tr
                          key={occ}
                          onClick={() => selectOccupancy(occ)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-deep-gold/10" : "hover:bg-warm-ivory/40"}`}
                        >
                          <td className="px-4 py-3 font-semibold text-masaar-black">{occ}</td>
                          <td className="px-4 py-3 text-right font-bold text-masaar-black">
                            <Price amountAed={price} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-masaar-black/50">Tap a row to select your occupancy — AED shown is per person.</p>
            </div>

            <div className="rounded-xl border border-deep-gold/30 bg-warm-ivory/50 p-6">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-masaar-black">
                Ready to book this package?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Contact our team on WhatsApp to check availability, get personalized advice or discuss your travel
                dates.
              </p>
              <div className="mt-4">
                <WhatsAppButton templateKey="umrahJourney" params={whatsappParams} className="w-full justify-center">
                  Enquire on WhatsApp
                </WhatsAppButton>
              </div>
              <p className="mt-3 text-center text-[11px] text-masaar-black/50">No obligation. Just a conversation.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Your Hotels ────────────────────────────────────────────── */}
      {(activeConfig.makkah_hotel || activeConfig.madinah_hotel) && (
        <section className="pb-10">
          <Container>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
              Your Hotels
            </h2>
            <p className="mt-1 text-sm text-masaar-black/60">
              Carefully selected hotels for a comfortable stay in both holy cities.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {activeConfig.makkah_hotel && (
                <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                  <div className="relative h-40 w-full bg-warm-ivory">
                    {activeConfig.makkah_hotel.image_url && (
                      <ExternalImage
                        src={activeConfig.makkah_hotel.image_url}
                        alt={activeConfig.makkah_hotel.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    <span className="absolute left-3 top-3 rounded bg-deep-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Makkah
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-masaar-black">{activeConfig.makkah_hotel.name}</h3>
                    {activeConfig.makkah_allow_similar && (
                      <p className="text-xs text-masaar-black/50">or similar</p>
                    )}
                    <Link
                      href={`/hotels/${activeConfig.makkah_hotel.slug}`}
                      className="mt-3 inline-flex items-center gap-1 rounded-md border border-black/20 px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory"
                    >
                      View Hotel →
                    </Link>
                  </div>
                </div>
              )}

              {activeConfig.madinah_hotel && (
                <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                  <div className="relative h-40 w-full bg-warm-ivory">
                    {activeConfig.madinah_hotel.image_url && (
                      <ExternalImage
                        src={activeConfig.madinah_hotel.image_url}
                        alt={activeConfig.madinah_hotel.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    <span className="absolute left-3 top-3 rounded bg-masaar-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Madinah
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-masaar-black">{activeConfig.madinah_hotel.name}</h3>
                    {activeConfig.madinah_allow_similar && (
                      <p className="text-xs text-masaar-black/50">or similar</p>
                    )}
                    <Link
                      href={`/hotels/${activeConfig.madinah_hotel.slug}`}
                      className="mt-3 inline-flex items-center gap-1 rounded-md border border-black/20 px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory"
                    >
                      View Hotel →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* ── Inclusions + Important Information ────────────────────── */}
      <section className="pb-14">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
                Included in Your Journey
              </h2>
              <p className="mt-1 text-xs text-masaar-black/60">Everything you need for a worry-free experience.</p>
              {inclusionsList.length > 0 ? (
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {inclusionsList.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm text-masaar-black">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-deep-gold" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-masaar-black/60">
                  Includes hotel accommodation, private intercity transfers, visa guidance, and guided support.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
                <InfoIcon className="size-5 text-deep-gold" />
                Important Information
              </h2>
              <ul className="mt-4 space-y-2.5">
                {UMRAH_JOURNEY_IMPORTANT_INFO.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-masaar-black/80">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-deep-gold" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-masaar-black py-12 text-white">
        <div className="absolute inset-0 opacity-25">
          <ExternalImage src="/brand/banners/umrah.png" alt="" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/90 to-masaar-black/80" />
        <Container className="relative flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">Ready to Plan Your Umrah?</h3>
            <p className="mt-1 max-w-md text-sm text-white/70">
              Tell us your preferred duration and room occupancy, and our team will help you with the next step.
            </p>
          </div>
          <WhatsAppButton templateKey="umrahJourney" params={whatsappParams}>
            Enquire on WhatsApp
          </WhatsAppButton>
        </Container>
      </section>
    </>
  );
}
