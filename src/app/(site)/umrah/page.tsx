import type { Metadata } from "next";
import { ContentPending, EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { ImportantNotice } from "@/components/site/ImportantNotice";
import { PackageCard } from "@/components/site/PackageCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { CarIcon, DocumentIcon, PlaneIcon, ShieldIcon, BedIcon } from "@/components/site/icons";
import { getPublishedPackages } from "@/lib/data/public";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

// SEO Master Map — starter-kit Section 2; H2 outline — starter-kit Section 3.
export const metadata: Metadata = {
  title: "Umrah Packages UAE | Masaar Holidays",
  description:
    "Umrah packages from the UAE, thoughtfully planned around your family — accommodation, transfers and personal support at every level of comfort.",
};

export default async function UmrahPage() {
  const packages = await getPublishedPackages("umrah");

  return (
    <>
      <Hero
        eyebrow="Umrah Packages"
        h1="Your Umrah Journey, Thoughtfully Planned"
        image="/brand/banners/umrah.png"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton message={WHATSAPP_TEMPLATES.general}>Enquire on WhatsApp</WhatsAppButton>
        </div>
      </Hero>

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Choose the Right Level of Comfort" title="Umrah Packages for Every Family" />
          <div className="mx-auto mt-4 max-w-2xl text-center">
            <ContentPending note="Section intro pending final copy — three comfort levels (Essential, Signature, Privé) hold the same standard of care." />
          </div>

          <div className="mt-10">
            {packages.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Umrah packages published yet"
                note="Waiting on the client's pricing/package document (brief Part 5) before packages, room pricing and Plus upgrades are entered in Admin → Packages."
              />
            )}
          </div>
        </Container>
      </section>

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

      <section className="py-16">
        <Container className="grid gap-6 sm:grid-cols-2">
          <a
            href="/hotels"
            className="rounded-lg border border-black/10 bg-white p-6 hover:border-pure-gold"
          >
            <DocumentIcon className="size-6 text-deep-gold" />
            <h3 className="mt-3 font-semibold text-masaar-black">Makkah & Madinah Accommodation</h3>
            <div className="mt-2">
              <ContentPending />
            </div>
          </a>
          <a
            href="/transfers"
            className="rounded-lg border border-black/10 bg-white p-6 hover:border-pure-gold"
          >
            <CarIcon className="size-6 text-deep-gold" />
            <h3 className="mt-3 font-semibold text-masaar-black">Private Transfers & Travel Support</h3>
            <div className="mt-2">
              <ContentPending />
            </div>
          </a>
        </Container>
      </section>
    </>
  );
}
