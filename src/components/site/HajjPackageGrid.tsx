import type { PackageRow, PackageTier } from "@/lib/types/database";
import { EmptyState } from "./SectionHeading";
import { HajjPackageCard } from "./HajjPackageCard";

interface TierSection {
  tier: PackageTier;
  title: string;
  badge: string;
  badgeTone: string;
  tagline: string;
  description: string;
}

const TIER_SECTIONS: TierSection[] = [
  {
    tier: "exclusive",
    title: "Exclusive Hajj Packages (Non-Shifting)",
    badge: "Non-Shifting • Pure Luxury",
    badgeTone: "bg-masaar-black text-pure-gold border border-pure-gold/30",
    tagline: "Direct Makkah Clock Tower Stay Throughout Hajj — No Suburban Shifting",
    description:
      "Stay directly at the Makkah Clock Tower (Al Marwa Rayhaan by Rotana) throughout the core days of Hajj with elevator access to the Haram plaza. Includes Category A VIP air-conditioned Mina camps in Zone 1/2 near Jamarat, 3-course gourmet dining, and direct flights.",
  },
  {
    tier: "signature",
    title: "Signature Hajj Packages (Shifting)",
    badge: "Shifting • 4-Star Comfort",
    badgeTone: "bg-amber-900/10 text-amber-900 border border-amber-900/20",
    tagline: "4-Star Aziziyah Hotel (DoubleTree or similar) & Category A Mina Camps",
    description:
      "Comfort-first shifting packages featuring premium 4-star accommodation in Aziziyah with rapid access to Mina and Jamarat, 3-course meals, direct flights from UAE, and dedicated multilingual Moallim support.",
  },
  {
    tier: "essential",
    title: "Essential Hajj Packages (Shifting)",
    badge: "Shifting • Value & Devotion",
    badgeTone: "bg-slate-900/10 text-slate-800 border border-slate-900/20",
    tagline: "Reliable Aziziyah Hotel (Sedra or similar) & Full Moallim Ground Services",
    description:
      "Worship-focused Hajj arrangements providing comfortable economy hotel accommodation in Aziziyah, Category A air-conditioned tents in Mina, direct roundtrip flights, medical insurance, and full-board buffet meals.",
  },
];

export function HajjPackageGrid({
  packages,
  emptyTitle,
  emptyNote,
}: {
  packages: PackageRow[];
  emptyTitle: string;
  emptyNote?: string;
}) {
  if (packages.length === 0) {
    return <EmptyState title={emptyTitle} note={emptyNote} />;
  }

  const sectionsWithPackages = TIER_SECTIONS.map((section) => {
    const tierPackages = packages
      .filter((p) => p.tier === section.tier)
      .sort((a, b) => a.duration_days - b.duration_days);
    return { ...section, items: tierPackages };
  }).filter((section) => section.items.length > 0);

  return (
    <div className="space-y-16">
      {sectionsWithPackages.map((section) => (
        <div key={section.tier} className="scroll-mt-24" id={`hajj-${section.tier}`}>
          {/* Tier Section Header Banner */}
          <div className="mb-6 rounded-xl border border-black/10 bg-[#FAF7F2] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className={`inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${section.badgeTone}`}>
                  {section.badge}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  {section.title}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-sm font-semibold text-deep-gold">{section.tagline}</p>
            <p className="mt-1 text-xs leading-relaxed text-masaar-black/70 sm:text-sm">
              {section.description}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((pkg) => (
              <HajjPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
