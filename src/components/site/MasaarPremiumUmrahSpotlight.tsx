import Link from "next/link";
import { CONTACT } from "@/lib/contact";

export function MasaarPremiumUmrahSpotlight() {
  const whatsappUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
    "Hello Masaar Holidays, I am interested in the Masaar Premium Umrah Package (6 Days / 5 Nights). Please share availability and booking details."
  )}`;

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border-2 border-pure-gold/40 bg-gradient-to-br from-white via-white to-warm-ivory p-6 shadow-md sm:p-8">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pure-gold px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-masaar-black">
            Featured New Package
          </span>
          <span className="text-xs font-semibold text-deep-gold">
            Curated Umrah With Care
          </span>
        </div>
        <span className="rounded bg-black/5 px-2.5 py-1 text-xs font-medium text-masaar-black/70">
          ⏱️ 6 Days / 5 Nights
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Main Details */}
        <div className="lg:col-span-7">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
            Masaar Premium Umrah Package
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-masaar-black/75 sm:text-sm">
            A comprehensive, high-comfort pilgrimage from the UAE featuring 5-star hospitality near the Two Holy Mosques, seamless Haramain bullet train transfers, and dedicated ground concierge.
          </p>

          {/* Stays & Inclusions */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-masaar-black/80">
            <div className="rounded-lg border border-black/10 bg-white/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">Madinah (2 Nights)</p>
              <p className="font-semibold text-masaar-black">Crowne Plaza Madinah</p>
              <p className="text-[11px] text-masaar-black/60">5-Star · Steps from Prophet&apos;s Mosque</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-white/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">Makkah (3 Nights)</p>
              <p className="font-semibold text-masaar-black">Pullman ZamZam Makkah</p>
              <p className="text-[11px] text-masaar-black/60">5-Star · Abraj Al Bait Complex</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-masaar-black/70">
            <span className="flex items-center gap-1.5">
              <span className="text-deep-gold font-bold">✓</span> Haramain Bullet Train / VIP Transfer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-deep-gold font-bold">✓</span> Daily International Buffet Breakfast
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-deep-gold font-bold">✓</span> Guided Historical Ziyarah Included
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-deep-gold font-bold">✓</span> 24/7 Ground Assistance
            </span>
          </div>
        </div>

        {/* Pricing Summary & Action */}
        <div className="rounded-xl border border-black/10 bg-warm-ivory/60 p-5 lg:col-span-5 text-center sm:text-left flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between border-b border-black/10 pb-3">
              <span className="text-xs font-semibold text-masaar-black/70">Starting From</span>
              <div className="text-right">
                <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
                  AED 4,600
                </span>
                <span className="block text-[10px] text-masaar-black/60">per person (Quad Room)</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-masaar-black/75">
              <div className="flex justify-between">
                <span>Triple Room:</span>
                <span className="font-semibold text-masaar-black">AED 4,900</span>
              </div>
              <div className="flex justify-between">
                <span>Double Room:</span>
                <span className="font-semibold text-masaar-black">AED 5,100</span>
              </div>
              <div className="flex justify-between">
                <span>Single Room:</span>
                <span className="font-semibold text-masaar-black">AED 6,900</span>
              </div>
              <div className="flex justify-between text-[11px] text-masaar-black/60 pt-1 border-t border-black/5">
                <span>Child with Bed:</span>
                <span className="font-semibold text-masaar-black">AED 3,000</span>
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
