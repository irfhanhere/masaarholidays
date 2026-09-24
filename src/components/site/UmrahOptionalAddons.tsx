"use client";

import Image from "next/image";
import { Container } from "./Container";
import type { PublicAddonCatalogRow } from "@/lib/data/public";

interface Props {
  addons?: PublicAddonCatalogRow[];
  onSelectAddon?: (addonId: string) => void;
}

export interface AddonItem {
  id: string;
  name: string;
  short_description: string;
  price_note: string;
  image_url: string;
  icon: string;
}

const DEFAULT_ADDONS: AddonItem[] = [
  {
    id: "visa",
    name: "Umrah Visa",
    short_description: "We assist with your visa application and documentation.",
    price_note: "Price on request",
    image_url: "/trips/Visa Assistance card (Home).png",
    icon: "🛂",
  },
  {
    id: "makkah-ziyarat",
    name: "Private Makkah Ziyarat",
    short_description: "Explore the historical and spiritual sites around Makkah with a private vehicle.",
    price_note: "From AED 300",
    image_url: "/brand/banners/umrah.png",
    icon: "🕋",
  },
  {
    id: "madinah-ziyarat",
    name: "Private Madinah Ziyarat",
    short_description: "Visit the blessed landmarks of Madinah at a comfortable pace.",
    price_note: "From AED 300",
    image_url: "/trips/PRIVATE-TRIP-MADINAH-CARD.png",
    icon: "🕌",
  },
  {
    id: "flights",
    name: "Flights",
    short_description: "We can assist with flight arrangements based on your preferred travel dates.",
    price_note: "Available upon request",
    image_url: "/trips/DESTINATION IMAGE.png",
    icon: "✈️",
  },
  {
    id: "private-sightseeing",
    name: "Private Sightseeing",
    short_description: "Discover key places with a comfortable private tour.",
    price_note: "2 – 2.5 hours",
    image_url: "/trips/PRIVATE-TRIP-MAKKAH-CARD.png",
    icon: "📍",
  },
];

/**
 * Merges admin-managed catalog rows onto the default UI assets. When a
 * catalog row is linked to a real private_trips record (private_trip_id),
 * its name/description/image come from that trip — never from the
 * hardcoded placeholder — so editing the trip in Private Trips admin
 * updates this card automatically, per the no-duplication rule. Shared
 * with UmrahAddonsCartModal so the basket shows the exact same list.
 */
/** Lowercases and strips separators so "makkah_ziyarat" / "makkah-ziyarat" / "Makkah Ziyarat" all compare equal. */
function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

export function mergeAddons(addons?: PublicAddonCatalogRow[]): AddonItem[] {
  return DEFAULT_ADDONS.map((def) => {
    const defKey = normalizeKey(def.id);
    const defName = normalizeKey(def.name);
    const dbMatch = addons?.find((a) => {
      const dbKey = normalizeKey(a.key_slug);
      const dbName = normalizeKey(a.name);
      return dbKey === defKey || dbName === defName || defName.includes(dbName) || dbName.includes(defName);
    });
    if (!dbMatch) return def;

    if (dbMatch.linked_trip) {
      return {
        ...def,
        name: dbMatch.linked_trip.name,
        short_description: dbMatch.linked_trip.short_description || def.short_description,
        price_note: dbMatch.linked_trip.duration || dbMatch.price_type_label || def.price_note,
        image_url: dbMatch.linked_trip.featured_image_url || def.image_url,
        icon: dbMatch.icon || def.icon,
      };
    }

    return {
      ...def,
      name: dbMatch.name,
      price_note: dbMatch.price_type_label || def.price_note,
      icon: dbMatch.icon || def.icon,
    };
  });
}

export function UmrahOptionalAddons({ addons, onSelectAddon }: Props) {
  const WHATSAPP_NUMBER = "971557329320";
  const customMessage = encodeURIComponent(
    "Assalamu Alaikum,\n\nI have a custom enquiry regarding Umrah Add-ons and services.\n\nPlease connect me with an advisor.\n\nJazakAllah Khair."
  );

  const displayAddons: AddonItem[] = mergeAddons(addons);

  return (
    <section className="py-16 bg-[#FAF7F2] border-t border-black/10">
      <Container className="space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
              <span>—</span>
              <span>MAKE YOUR JOURNEY YOUR OWN</span>
              <span>—</span>
            </div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-5xl">
              Optional Add-ons
            </h2>
            <p className="mt-2 text-sm sm:text-base text-masaar-black/70 max-w-xl">
              Enhance your Umrah experience with our additional services.
            </p>
          </div>

          <div className="hidden lg:block text-right text-masaar-black/60">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide">
              Small Additions,<br />Greater Memories
            </p>
            <div className="mt-1 h-0.5 w-6 ml-auto bg-[#C9A227]" />
          </div>
        </div>

        {/* 5-Card Grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {displayAddons.slice(0, 5).map((addon) => (
            <div
              key={addon.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs transition-all hover:shadow-md"
            >
              <div>
                {/* Photo Thumbnail */}
                <div className="relative h-36 w-full bg-masaar-black overflow-hidden">
                  <Image
                    src={addon.image_url}
                    alt={addon.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-masaar-black">{addon.name}</h3>
                  <p className="text-[11px] text-masaar-black/65 leading-relaxed">
                    {addon.short_description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 space-y-3 border-t border-black/5 mt-auto">
                <p className="font-bold text-xs text-masaar-black">{addon.price_note}</p>

                <button
                  type="button"
                  onClick={() => onSelectAddon?.(addon.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-xs font-bold text-masaar-black hover:bg-warm-ivory transition-colors"
                >
                  <span>+</span>
                  <span>Add to Enquiry</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-black/10 bg-warm-ivory/50 p-4 sm:p-5 text-xs">
          <div className="flex items-center gap-2 text-masaar-black/70">
            <span className="text-base text-[#A87F12]">ℹ</span>
            <span>
              Add multiple services to your enquiry. Our team will share a customised plan based on your preferences.
            </span>
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${customMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 shrink-0 font-bold text-[#A87F12] hover:underline"
          >
            <span>💬</span>
            <span>Need a custom request? Chat with us on WhatsApp →</span>
          </a>
        </div>
      </Container>
    </section>
  );
}
