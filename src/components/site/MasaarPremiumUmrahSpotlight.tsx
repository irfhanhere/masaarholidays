import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { TrainIcon, PlaneIcon, CompassIcon, DocumentIcon, FamilyIcon, CheckIcon } from "@/components/site/icons";
import type { PremiumPackage } from "@/lib/types/premium-package";
import { DEFAULT_PREMIUM_PACKAGE } from "@/lib/data/premium-package-catalog";

interface Props {
  pkg?: PremiumPackage;
}

export function MasaarPremiumUmrahSpotlight({ pkg = DEFAULT_PREMIUM_PACKAGE }: Props) {
  const whatsappUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    `Hello Masaar Holidays, I am interested in the ${pkg.title} (${pkg.duration_days} Days / ${pkg.duration_nights} Nights). Please share availability and booking details.`
  )}`;

  const makkahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "makkah") || pkg.hotels[0];
  const madinahHotel = pkg.hotels.find((h) => h.city.toLowerCase() === "madinah") || pkg.hotels[1];

  const quadPrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("quad"))?.price_aed ?? 4600;
  const triplePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("triple"))?.price_aed ?? 4900;
  const doublePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("double"))?.price_aed ?? 5100;
  const singlePrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("single"))?.price_aed ?? 6900;
  const childPrice = pkg.pricing.find((p) => p.room_type.toLowerCase().includes("child"))?.price_aed ?? 3000;

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border-2 border-pure-gold/40 bg-gradient-to-br from-white via-white to-warm-ivory p-6 shadow-md sm:p-8">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pure-gold px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-masaar-black">
            Featured Premium Package
          </span>
          <span className="text-xs font-semibold text-deep-gold">
            Curated Umrah With Care
          </span>
        </div>
        <span className="rounded bg-black/5 px-2.5 py-1 text-xs font-medium text-masaar-black/70">
          ⏱️ {pkg.duration_days} Days / {pkg.duration_nights} Nights
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Main Details */}
        <div className="lg:col-span-7">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
            {pkg.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-masaar-black/75 sm:text-sm">
            {pkg.short_description}
          </p>

          {/* Stays: Makkah & Madinah clearly displayed with nights */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-masaar-black/80">
            {/* Makkah */}
            <div className="rounded-xl border border-black/10 bg-white/80 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                  Makkah ({makkahHotel.nights} Nights)
                </p>
                <span className="text-[10px] text-masaar-black/50 font-medium">5-Star</span>
              </div>
              <p className="mt-1 font-bold text-masaar-black text-sm">{makkahHotel.hotel_name}</p>
              <p className="text-[11px] text-masaar-black/60 mt-0.5">
                {makkahHotel.distance_note || "Directly in Jabal Omar, level walking access to Holy Haram"}
              </p>
            </div>

            {/* Madinah */}
            <div className="rounded-xl border border-black/10 bg-white/80 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                  Madinah ({madinahHotel.nights} Nights)
                </p>
                <span className="text-[10px] text-masaar-black/50 font-medium">5-Star</span>
              </div>
              <p className="mt-1 font-bold text-masaar-black text-sm">{madinahHotel.hotel_name}</p>
              <p className="text-[11px] text-masaar-black/60 mt-0.5">
                {madinahHotel.distance_note || "Approx. 50m from Prophet's Mosque with flat pathway"}
              </p>
            </div>
          </div>

          {/* Six Approved Inclusions */}
          <div className="mt-5 border-t border-black/5 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50 mb-2.5">
              Included In This Journey:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <span className="flex items-center gap-2 text-masaar-black/80">
                <CheckIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>1. Umrah / KSA Tourist Visa</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <PlaneIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>2. Flight Ticket – Saudi Airlines</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <CompassIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>3. Historical Places Visit</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <FamilyIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>4. Multilingual Guide Accompanied</span>
              </span>
              <span className="flex items-center gap-2 text-masaar-black/80">
                <DocumentIcon className="size-3.5 text-deep-gold shrink-0" />
                <span>5. Umrah Lecture & Training</span>
              </span>
              {/* Distinct Haramain Speed Train Identity */}
              <span className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-900 border border-emerald-200/80">
                <TrainIcon className="size-4 text-emerald-700 shrink-0" />
                <span>6. Breakfast & Haramain Speed Train</span>
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Summary & Action */}
        <div className="rounded-xl border border-black/10 bg-warm-ivory/60 p-5 lg:col-span-5 text-center sm:text-left flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between border-b border-black/10 pb-3">
              <span className="text-xs font-semibold text-masaar-black/70">Starting From</span>
              <div className="text-right">
                <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
                  AED {quadPrice.toLocaleString()}
                </span>
                <span className="block text-[10px] text-masaar-black/60">per person (Quad Room)</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-masaar-black/75">
              <div className="flex justify-between">
                <span>Quad Room:</span>
                <span className="font-semibold text-masaar-black">AED {quadPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Triple Room:</span>
                <span className="font-semibold text-masaar-black">AED {triplePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Double Room:</span>
                <span className="font-semibold text-masaar-black">AED {doublePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Single Room:</span>
                <span className="font-semibold text-masaar-black">AED {singlePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] text-masaar-black/60 pt-1 border-t border-black/5">
                <span>Child with Bed:</span>
                <span className="font-semibold text-masaar-black">AED {childPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Link
              href="/umrah/masaar-premium-umrah"
              className="inline-flex w-full items-center justify-center rounded-md bg-masaar-black py-2.5 px-4 text-xs font-semibold text-white shadow hover:bg-black/90 transition-all"
            >
              View Full Package & Itinerary →
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md border border-pure-gold bg-pure-gold/15 py-2 px-4 text-xs font-bold text-masaar-black hover:bg-pure-gold/25 transition-all"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
