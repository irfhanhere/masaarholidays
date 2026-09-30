import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { HajjHero } from "@/components/site/HajjHero";
import { HajjPackageGrid } from "@/components/site/HajjPackageGrid";
import { HajjLeadCaptureForm } from "@/components/site/HajjLeadCaptureForm";
import { ImportantNotice } from "@/components/site/ImportantNotice";
import { getPublishedPackages } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { FaqSection } from "@/components/site/FaqSection";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/hajj",
    fallbackTitle: "Hajj Packages from UAE 2027 | Best Hajj Packages & Non-Shifting | Masaar Holidays",
    fallbackDescription:
      "Official Hajj packages from UAE with Masaar Holidays. Compare non-shifting Makkah Clock Tower & shifting Aziziyah Hajj package from UAE options with direct flights, Category A Mina tents & dedicated guidance.",
  });
}

export default async function HajjPage() {
  const packages = await getPublishedPackages("hajj");

  return (
    <>
      <Breadcrumbs items={[{ label: "Hajj Packages from UAE" }]} />
      <HajjHero />

      {/* ── Editorial Hub Overview: Understanding Hajj from the UAE ── */}
      <section className="border-b border-black/10 bg-white py-14">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <span className="rounded-full bg-pure-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#936E0F]">
              UAE Pilgrim Guide 2027
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
              Understanding Hajj Options: Shifting vs. Non-Shifting
            </h2>
            <p className="mt-4 text-base leading-relaxed text-masaar-black/75">
              Choosing the right Hajj package depends on your family&apos;s physical endurance, schedule, and preferred level of comfort. Masaar Holidays organizes official Hajj packages from the UAE with complete transparency regarding accommodation logistics during the core pilgrimage days.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold/20 text-lg font-bold text-masaar-black">
                  1
                </span>
                <div>
                  <h3 className="text-lg font-bold text-masaar-black">Shifting Hajj Packages</h3>
                  <p className="text-xs font-medium text-masaar-black/60">Essential & Signature Tiers · 9, 12 & 15 Days</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-masaar-black/75">
                In a shifting package, pilgrims stay in dedicated accommodation in Aziziyah during the core days of Hajj (8th to 12th Dhul Hijjah). Because Aziziyah is situated within walking distance or brief shuttle access to Mina, pilgrims avoid prolonged city traffic jams during ritual transitions. Before or after the core rituals, accommodation shifts to standard Makkah and Madinah hotels.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-masaar-black/70">
                <li className="flex items-center gap-2">✓ Shorter walking times between Mina camps and accommodation</li>
                <li className="flex items-center gap-2">✓ Economical pricing with full-board buffet catering</li>
                <li className="flex items-center gap-2">✓ Available in 9-day, 12-day, and 15-day durations</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-pure-gold/20 text-lg font-bold text-masaar-black">
                  2
                </span>
                <div>
                  <h3 className="text-lg font-bold text-masaar-black">Non-Shifting Hajj Packages</h3>
                  <p className="text-xs font-medium text-masaar-black/60">Exclusive Tier · 10 & 13 Days</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-masaar-black/75">
                In a non-shifting package, your luxury hotel room (such as Al Marwa Rayhaan in the Makkah Clock Tower) remains exclusively reserved in your name for the entire pilgrimage duration. During the days of Mina, you retain 24/7 access to your private hotel room, allowing elder family members and young children to rest in full comfort between rites.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-masaar-black/70">
                <li className="flex items-center gap-2">✓ Uninterrupted Clock Tower stay with direct Haram courtyard access</li>
                <li className="flex items-center gap-2">✓ VIP Category A air-conditioned Mina camps near Jamarat</li>
                <li className="flex items-center gap-2">✓ 3-Course gourmet meals and dedicated on-ground concierge</li>
              </ul>
            </div>
          </div>

          {/* Tier Comparison Summary Table */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs">
            <div className="border-b border-black/10 bg-warm-ivory px-6 py-4">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                Hajj Package Tier Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-black/5 font-semibold text-masaar-black">
                    <th className="p-4">Package Tier</th>
                    <th className="p-4">Structure</th>
                    <th className="p-4">Durations</th>
                    <th className="p-4">Mina Maktab Camps</th>
                    <th className="p-4">Makkah Stay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 text-masaar-black/80">
                  <tr>
                    <td className="p-4 font-bold text-masaar-black">Essential</td>
                    <td className="p-4">Shifting (Aziziyah)</td>
                    <td className="p-4">9, 12, 15 Days</td>
                    <td className="p-4">Category A Air-Conditioned</td>
                    <td className="p-4">3★/4★ Hotel + Aziziyah</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-masaar-black">Signature</td>
                    <td className="p-4">Shifting (Prime)</td>
                    <td className="p-4">9, 12, 15 Days</td>
                    <td className="p-4">Category A Air-Conditioned (Near Jamarat)</td>
                    <td className="p-4">4★/5★ Walking Distance + Aziziyah</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-masaar-black">Exclusive</td>
                    <td className="p-4">Non-Shifting VIP</td>
                    <td className="p-4">10, 13 Days</td>
                    <td className="p-4">VIP Category A (Zone 1/2 near Jamarat)</td>
                    <td className="p-4">5★ Clock Tower (Marwa Rotana) Continuous</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <SectionHeading
            eyebrow="Hajj Packages from UAE"
            title="Choose Your Hajj Package"
          />

          <div className="mt-10">
            <HajjPackageGrid
              packages={packages}
              emptyTitle="No Hajj packages published yet"
              emptyNote="Please check back soon, or contact us for the latest Hajj availability."
            />
          </div>

          {/* ── Optional Upgrades Banner ── */}
          <div className="mt-16 rounded-2xl border border-pure-gold/40 bg-gradient-to-br from-[#1C1F22] to-[#111315] p-6 sm:p-8 text-white shadow-md">
            <div className="border-b border-white/10 pb-5">
              <span className="rounded bg-pure-gold/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-pure-gold">
                Available Add-ons
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-white">
                Customise Your Hajj Package
              </h3>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl">🚙</div>
                <h4 className="mt-2 text-sm font-bold text-pure-gold">VIP Transfer — Private GMC</h4>
                <p className="mt-1 text-xs text-white/75">Private GMC Yukon for up to 7 passengers.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl">🛏️</div>
                <h4 className="mt-2 text-sm font-bold text-pure-gold">Twin Sharing Room Upgrade</h4>
                <p className="mt-1 text-xs text-white/75">Double / twin occupancy on request.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl">⛺</div>
                <h4 className="mt-2 text-sm font-bold text-pure-gold">VVIP Kidana Tower — Mina</h4>
                <p className="mt-1 text-xs text-white/75">Elite Mina towers overlooking the Jamarat.</p>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <HajjLeadCaptureForm />
          </div>
        </Container>
      </section>

      <section className="bg-warm-ivory py-16">
        <Container>
          <ImportantNotice
            title="What to Know Before Your Hajj Journey"
            points={[
              "Masaar does not claim guaranteed Hajj slots, guaranteed visas, or official quota allocations unless explicitly confirmed for your booking.",
              "Availability is limited and confirmed on a case-by-case basis — please enquire directly for current-season status.",
              "Final pricing, accommodation and transport are confirmed on WhatsApp before booking.",
            ]}
          />
        </Container>
      </section>

      <CrossLinkServices exclude="hajj" />

      <FaqSection category="hajj" />
    </>
  );
}
