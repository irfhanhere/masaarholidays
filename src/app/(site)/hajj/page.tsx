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
