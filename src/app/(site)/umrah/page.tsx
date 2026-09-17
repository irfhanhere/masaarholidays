import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { ImportantNotice } from "@/components/site/ImportantNotice";
import { PackageGrid } from "@/components/site/PackageGrid";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { CarIcon, PlaneIcon, ShieldIcon, BedIcon } from "@/components/site/icons";
import { getPublishedPackages, getUmrahContent } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { GuidedUmrahAssistance } from "@/components/site/GuidedUmrahAssistance";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/umrah",
    fallbackTitle: "Umrah Packages UAE | Masaar Holidays",
    fallbackDescription:
      "Umrah packages from the UAE, thoughtfully planned around your family — accommodation, transfers and personal support at every level of comfort.",
  });
}

export default async function UmrahPage() {
  const [packages, umrahContent] = await Promise.all([
    getPublishedPackages("umrah"),
    getUmrahContent(),
  ]);

  return (
    <>
      <Hero
        eyebrow="Umrah Packages"
        h1="Your Umrah Journey, Thoughtfully Planned"
        image="/brand/banners/umrah.png"
      >
        {/* Draft copy pending Haseeb's approval */}
        <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
          Every family&apos;s Umrah is different. We take care of hotels, transport and documentation so yours can be spent in worship, not logistics.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="general">Enquire on WhatsApp</WhatsAppButton>
        </div>
      </Hero>

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Choose the Right Level of Comfort" title="Umrah Packages for Every Family" />
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-masaar-black/70 sm:text-base">
            Three levels of comfort, each carrying the same standard of care — Essential, Signature and Exclusive. Choose what suits your family, and we&apos;ll take it from there.
          </p>

          <div className="mt-10">
            <PackageGrid
              packages={packages}
              emptyTitle="No Umrah packages published yet"
              emptyNote="Waiting on the client's pricing/package document (brief Part 5) before packages, room pricing and Plus upgrades are entered in Admin → Packages."
            />
          </div>
        </Container>
      </section>

      {/* Guided Umrah Assistance (Admin-editable) */}
      <GuidedUmrahAssistance content={umrahContent} />

      <section className="bg-warm-ivory py-16">
        <Container className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
              Every Package Includes
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { icon: PlaneIcon, label: "Flight" },
                { icon: BedIcon, label: "Hotel" },
                { icon: CarIcon, label: "Transfers" },
                { icon: ShieldIcon, label: "Travel Insurance" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-white text-deep-gold">
                    <Icon className="size-5" />
                  </span>
                  <p className="text-xs font-medium text-masaar-black">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <ImportantNotice
            title="Important to Know"
            points={[
              "Prices are indicative and converted for reference only. Final price confirmed on WhatsApp.",
              "Availability is limited and subject to change.",
              "Hotels and services are booked through our trusted partners.",
              "Visas are not included unless mentioned in the package.",
            ]}
          />
        </Container>
      </section>

      <CrossLinkServices exclude="umrah" />
    </>
  );
}
