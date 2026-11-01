"use client";

import Link from "next/link";
import { Container } from "./Container";
import { Price } from "./Price";

interface Props {
  onOpenEnquiry?: (packageName: string, tier: string) => void;
}

export function UmrahPackageComparison({ onOpenEnquiry }: Props) {
  const WHATSAPP_NUMBER = "971557329320";

  const rows = [
    {
      category: "Positioning & Experience",
      items: [
        {
          feature: "Package Category",
          essential: "Smart & Budget-Friendly",
          signature: "Comfort & Haram Proximity",
          exclusive: "Front-Row Luxury & VIP Care",
        },
        {
          feature: "Ideal For",
          essential: "Younger pilgrims & budget-smart travellers",
          signature: "Families, children & all age groups",
          exclusive: "Elderly parents, seniors, wheelchair users & luxury seekers",
        },
      ],
    },
    {
      category: "Hotels & Haram Proximity",
      items: [
        {
          feature: "Makkah Hotel",
          essential: "VOCO Makkah (or similar, 4-Star)",
          signature: "Jabal Omar Marriott (or similar, 5-Star)",
          exclusive: "InterContinental Dar Al Tawhid (Ultra-Luxury 5-Star)",
        },
        {
          feature: "Makkah Haram Access",
          essential: "1,400m — 24/7 complimentary hotel shuttle (8-min ride)",
          signature: "350m — 4-min easy flat walk directly across King Fahd Gate",
          exclusive: "50m — 1-min step-out onto courtyard marble (Zero Steps)",
          highlight: "exclusive",
        },
        {
          feature: "Madinah Hotel",
          essential: "Zowar International Madinah (4-Star)",
          signature: "Millennium Taiba Hotel Madinah (5-Star)",
          exclusive: "InterContinental Dar Al Hijra (5-Star Luxury)",
        },
        {
          feature: "Madinah Haram Access",
          essential: "250m — 4-min flat walk to Northern Courtyard",
          signature: "150m — 2-min direct walk to Mosque courtyard",
          exclusive: "50m — 1-min flat walk to Northern Courtyard",
        },
      ],
    },
    {
      category: "Transportation & Mobility",
      items: [
        {
          feature: "Airport Transfers",
          essential: "Included (Private AC Vehicle across all legs)",
          signature: "Included (Private Sedan / SUV throughout)",
          exclusive: "Included (VIP Luxury GMC Yukon XL / Mercedes V-Class)",
        },
        {
          feature: "Makkah–Madinah Transfer",
          essential: "Air-conditioned intercity highway coach",
          signature: "Dedicated private vehicle sequence",
          exclusive: "Haramain High-Speed Train (Business Class) with station transfers",
          highlight: "exclusive",
        },
        {
          feature: "Haramain High-Speed Train",
          essential: "Available as optional upgrade",
          signature: "Available as optional upgrade",
          exclusive: "Included (Business Class tickets & station transfers)",
          highlight: "exclusive",
        },
        {
          feature: "Return Flight Tickets",
          essential: "Arranged on request from UAE (DXB/SHJ/AUH)",
          signature: "Arranged on request from UAE (DXB/SHJ/AUH)",
          exclusive: "Bespoke & Business Class ticketing coordination",
        },
      ],
    },
    {
      category: "Services & Benefits",
      items: [
        {
          feature: "Daily Breakfast",
          essential: "Room Only / Optional Add-on",
          signature: "Daily Gourmet Buffet Breakfast Included",
          exclusive: "Daily 5-Star Gourmet Buffet Breakfast Included",
        },
        {
          feature: "Guided Ziyarat Tour",
          essential: "Optional add-on private tour",
          signature: "Private Guided Makkah Ziyarat Tour Included",
          exclusive: "VIP Guided Makkah & Madinah Ziyarat with Specialist Historian",
          highlight: "exclusive",
        },
        {
          feature: "Luggage & Check-In",
          essential: "Standard hotel assistance",
          signature: "Concierge check-in support",
          exclusive: "Priority Check-in & Express Luggage Handling",
        },
        {
          feature: "Umrah Visa & Insurance",
          essential: "Visa processing assistance",
          signature: "Full Umrah visa processing",
          exclusive: "Full Umrah visa processing + Saudi medical insurance",
        },
        {
          feature: "Guest Care",
          essential: "24/7 Masaar Holidays helpline",
          signature: "Dedicated concierge guest support",
          exclusive: "24/7 Dedicated VIP Personal Concierge",
        },
      ],
    },
    {
      category: "Pricing & Value",
      items: [
        {
          feature: "Starting Price (Quad)",
          essential: "From AED 489 (Makkah) / AED 1,141 (Makkah + Madinah)",
          signature: "From AED 1,147 (Makkah) / AED 1,577 (Makkah + Madinah)",
          exclusive: "From AED 1,847 (Makkah) / AED 2,352 (Makkah + Madinah)",
        },
      ],
    },
  ];

  return (
    <section className="py-16 bg-white border-t border-black/10" id="compare-packages">
      <Container className="space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
            <span>—</span>
            <span>SIDE-BY-SIDE EVALUATION</span>
            <span>—</span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
            Compare Umrah Packages
          </h2>
          <p className="text-sm sm:text-base text-masaar-black/70 leading-relaxed">
            Detailed breakdown of approved differences in hotels, walking proximity, transportation arrangements, and VIP inclusions.
          </p>
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-[#FAF7F2]">
                <th className="p-5 text-sm font-bold text-masaar-black w-1/4">Feature &amp; Arrangement</th>
                <th className="p-5 text-sm font-bold text-masaar-black w-1/4">
                  <div className="space-y-1">
                    <span className="inline-block rounded bg-[#4A5568] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Essential
                    </span>
                    <p className="text-lg font-bold">Essential Umrah</p>
                    <p className="text-xs text-masaar-black/60 font-normal">
                      From <Price amountAed={489} /> / person
                    </p>
                  </div>
                </th>
                <th className="p-5 text-sm font-bold text-masaar-black w-1/4 bg-[#FAF3DE]/70 border-x border-[#C9A227]/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block rounded bg-[#78350F] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        Signature
                      </span>
                      <span className="rounded bg-[#A87F12] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                        Most Chosen
                      </span>
                    </div>
                    <p className="text-lg font-bold text-masaar-black">Signature Umrah</p>
                    <p className="text-xs text-masaar-black/60 font-normal">
                      From <Price amountAed={1147} /> / person
                    </p>
                  </div>
                </th>
                <th className="p-5 text-sm font-bold text-masaar-black w-1/4">
                  <div className="space-y-1">
                    <span className="inline-block rounded bg-[#111827] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Exclusive
                    </span>
                    <p className="text-lg font-bold">Exclusive Umrah</p>
                    <p className="text-xs text-masaar-black/60 font-normal">
                      From <Price amountAed={1847} /> / person
                    </p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-xs text-masaar-black/80">
              {rows.map((group, gIdx) => (
                <tr key={gIdx} className="contents">
                  <tr className="bg-[#FAF7F2]/60 font-bold text-masaar-black uppercase text-[11px] tracking-wider">
                    <td colSpan={4} className="p-3 pl-5 text-[#8B6E16]">
                      {group.category}
                    </td>
                  </tr>
                  {group.items.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-warm-ivory/20 transition-colors">
                      <td className="p-4 font-semibold text-masaar-black border-r border-black/5 bg-warm-ivory/10">
                        {row.feature}
                      </td>
                      <td className="p-4">{row.essential}</td>
                      <td className="p-4 bg-[#FAF3DE]/30 border-x border-[#C9A227]/20 font-medium">
                        {row.signature}
                      </td>
                      <td className={`p-4 ${row.highlight === "exclusive" ? "font-semibold text-masaar-black" : ""}`}>
                        {row.exclusive}
                      </td>
                    </tr>
                  ))}
                </tr>
              ))}
              {/* Bottom Actions Row */}
              <tr className="bg-[#FAF7F2]">
                <td className="p-5 font-bold text-masaar-black">Explore Package</td>
                <td className="p-5 space-y-2">
                  <Link
                    href="/umrah/essential"
                    className="block w-full text-center rounded-lg border border-black/20 bg-white py-2 text-xs font-bold text-masaar-black hover:bg-warm-ivory"
                  >
                    View Essential Details →
                  </Link>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      "Assalamu Alaikum, I would like to enquire about the Essential Umrah package."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center rounded-lg bg-masaar-black py-2 text-xs font-bold text-white hover:bg-masaar-black/80"
                  >
                    Enquire on WhatsApp
                  </a>
                </td>
                <td className="p-5 space-y-2 bg-[#FAF3DE]/70 border-x border-[#C9A227]/30">
                  <Link
                    href="/umrah/signature"
                    className="block w-full text-center rounded-lg border border-[#A87F12] bg-[#A87F12] py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#936e0f]"
                  >
                    View Signature Details →
                  </Link>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      "Assalamu Alaikum, I would like to enquire about the Signature Umrah package."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center rounded-lg bg-masaar-black py-2 text-xs font-bold text-white hover:bg-masaar-black/80"
                  >
                    Enquire on WhatsApp
                  </a>
                </td>
                <td className="p-5 space-y-2">
                  <Link
                    href="/umrah/exclusive"
                    className="block w-full text-center rounded-lg border border-black/20 bg-white py-2 text-xs font-bold text-masaar-black hover:bg-warm-ivory"
                  >
                    View Exclusive Details →
                  </Link>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      "Assalamu Alaikum, I would like to enquire about the Exclusive VIP Umrah package."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center rounded-lg bg-masaar-black py-2 text-xs font-bold text-white hover:bg-masaar-black/80"
                  >
                    Enquire on WhatsApp
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile-Friendly Comparison Cards */}
        <div className="lg:hidden space-y-6">
          {[
            {
              tier: "essential",
              title: "Essential Umrah",
              category: "Smart & Budget-Friendly",
              badgeTone: "bg-[#4A5568]",
              priceAed: 489,
              hotelMakkah: "VOCO Makkah (1,400m — 24/7 free shuttle, 8 min ride)",
              hotelMadinah: "Zowar International (250m — 4-min flat walk)",
              transport: "Private air-conditioned transfers across all legs",
              train: "Highway coach transfer (train upgrade available)",
              flights: "Return flights arranged on request from UAE",
              breakfast: "Room Only / Optional Add-on",
              ziyarat: "Optional add-on tour",
              support: "24/7 Masaar helpline",
              link: "/umrah/essential",
            },
            {
              tier: "signature",
              title: "Signature Umrah",
              category: "Comfort & Walking Access — Most Chosen",
              badgeTone: "bg-[#78350F]",
              isFeatured: true,
              priceAed: 1147,
              hotelMakkah: "Jabal Omar Marriott (350m — 4-min easy flat walk)",
              hotelMadinah: "Millennium Taiba (150m — 2-min direct courtyard walk)",
              transport: "Complete private vehicle sequence (Sedan / SUV)",
              train: "Private vehicle mobility (train upgrade available)",
              flights: "Return flights arranged on request from UAE",
              breakfast: "Daily Gourmet Buffet Breakfast Included",
              ziyarat: "Private Guided Makkah Ziyarat Tour Included",
              support: "Dedicated concierge guest support",
              link: "/umrah/signature",
            },
            {
              tier: "exclusive",
              title: "Exclusive Umrah",
              category: "Front-Row Luxury & VIP Care",
              badgeTone: "bg-[#111827]",
              priceAed: 1847,
              hotelMakkah: "InterContinental Dar Al Tawhid (50m — 1-min courtyard step-out, zero steps)",
              hotelMadinah: "InterContinental Dar Al Hijra (50m — 1-min flat walk)",
              transport: "VIP Luxury Vehicle (GMC Yukon XL / Mercedes V-Class)",
              train: "Haramain High-Speed Train (Business Class) Included",
              flights: "Bespoke return flights and Business Class coordination",
              breakfast: "Daily 5-Star Gourmet Buffet Breakfast Included",
              ziyarat: "VIP Guided Makkah & Madinah Ziyarat with Historian",
              support: "24/7 Dedicated VIP Personal Concierge",
              link: "/umrah/exclusive",
            },
          ].map((card) => (
            <div
              key={card.tier}
              className={`rounded-2xl border bg-white p-6 space-y-4 shadow-sm ${
                card.isFeatured ? "border-[#C9A227] ring-2 ring-[#C9A227]/30" : "border-black/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase text-white ${card.badgeTone}`}>
                  {card.title}
                </span>
                {card.isFeatured && (
                  <span className="rounded bg-[#A87F12] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    Most Chosen
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-masaar-black">{card.title}</h3>
                <p className="text-xs text-masaar-black/60 font-medium">{card.category}</p>
                <p className="mt-1 text-sm font-bold text-[#A87F12]">
                  From <Price amountAed={card.priceAed} /> / person
                </p>
              </div>

              <div className="space-y-2.5 border-t border-black/10 pt-3 text-xs text-masaar-black/80">
                <div>
                  <strong className="text-masaar-black">Makkah Hotel &amp; Distance:</strong>
                  <p className="text-masaar-black/70">{card.hotelMakkah}</p>
                </div>
                <div>
                  <strong className="text-masaar-black">Madinah Hotel &amp; Distance:</strong>
                  <p className="text-masaar-black/70">{card.hotelMadinah}</p>
                </div>
                <div>
                  <strong className="text-masaar-black">Intercity &amp; Transfers:</strong>
                  <p className="text-masaar-black/70">{card.transport}</p>
                </div>
                <div>
                  <strong className="text-masaar-black">Haramain Train:</strong>
                  <p className="text-masaar-black/70">{card.train}</p>
                </div>
                <div>
                  <strong className="text-masaar-black">Return Flights:</strong>
                  <p className="text-masaar-black/70">{card.flights}</p>
                </div>
                <div>
                  <strong className="text-masaar-black">Breakfast:</strong>
                  <p className="text-masaar-black/70">{card.breakfast}</p>
                </div>
                <div>
                  <strong className="text-masaar-black">Ziyarat Tour:</strong>
                  <p className="text-masaar-black/70">{card.ziyarat}</p>
                </div>
                <div>
                  <strong className="text-masaar-black">Guest Support:</strong>
                  <p className="text-masaar-black/70">{card.support}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-black/10 space-y-2">
                <Link
                  href={card.link}
                  className="block w-full text-center rounded-xl border border-black/20 bg-white py-2.5 text-xs font-bold text-masaar-black hover:bg-warm-ivory"
                >
                  View Full Details →
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Assalamu Alaikum, I would like to enquire about the ${card.title} package.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center rounded-xl bg-[#A87F12] py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#936e0f]"
                >
                  Enquire on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
