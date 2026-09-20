import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { ExternalImage } from "@/components/site/ExternalImage";
import { PackageGrid } from "@/components/site/PackageGrid";
import { SectionHeading } from "@/components/site/SectionHeading";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getActiveUmrahDepartureMonthBySlug, getPublishedPackages } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const month = await getActiveUmrahDepartureMonthBySlug(slug);
  if (!month) {
    return buildPageMetadata({ path: `/umrah/departures/${slug}`, title: "Umrah Departures | Masaar Holidays" });
  }
  return buildPageMetadata({
    path: `/umrah/departures/${slug}`,
    title: month.meta_title || `Umrah Packages — ${month.display_label} | Masaar Holidays`,
    description:
      month.meta_description ||
      month.hero_subtext ||
      `Umrah packages for ${month.display_label} departures, arranged through Masaar Holidays.`,
    ogImageUrl: month.hero_image_url,
  });
}

/**
 * Umrah-only "Departure Month" landing page — a content/marketing wrapper
 * around the same Essential/Signature/Exclusive packages shown on /umrah
 * (via the shared <PackageGrid>, see components/site/PackageGrid.tsx).
 * Months are not a pricing dimension: no package data is duplicated or
 * scoped by month here. 404s (rather than rendering) when the month
 * isn't published — same is_active-gated query the sitemap and the
 * header nav dropdown both use, so an inactive month can't be reached or
 * discovered anywhere.
 */
export default async function UmrahDepartureMonthPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const month = await getActiveUmrahDepartureMonthBySlug(slug);
  if (!month) notFound();

  const packages = await getPublishedPackages("umrah");

  return (
    <>
      <div className="relative h-72 w-full bg-masaar-black sm:h-96">
        {month.hero_image_url ? (
          <ExternalImage src={month.hero_image_url} alt={month.display_label} fill priority className="object-cover opacity-90" />
        ) : (
          <Image src="/brand/banners/umrah.png" alt="" fill priority className="object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-masaar-black/90 via-masaar-black/30 to-transparent" />
        <Container className="relative flex h-full flex-col justify-end pb-8 text-white">
          <p className="text-xs uppercase tracking-widest text-light-gold">
            <Link href="/umrah" className="hover:underline">
              Umrah
            </Link>{" "}
            / Departures / {month.display_label}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            {month.hero_headline || `Umrah Packages — ${month.display_label}`}
          </h1>
          {month.hero_subtext && (
            <p className="mt-2 max-w-xl text-sm text-white/80">{month.hero_subtext}</p>
          )}
          <div className="mt-4">
            <WhatsAppButton templateKey="general">Enquire on WhatsApp</WhatsAppButton>
          </div>
        </Container>
      </div>

      {(month.best_for_note || month.booking_advice_note) && (
        <section className="py-10">
          <Container className="grid gap-6 sm:grid-cols-2">
            {month.best_for_note && (
              <div className="rounded-lg border border-black/10 bg-warm-ivory p-5">
                <h2 className="font-semibold text-masaar-black">Best For</h2>
                <p className="mt-2 text-sm text-masaar-black/70">{month.best_for_note}</p>
              </div>
            )}
            {month.booking_advice_note && (
              <div className="rounded-lg border border-black/10 bg-warm-ivory p-5">
                <h2 className="font-semibold text-masaar-black">Booking Advice</h2>
                <p className="mt-2 text-sm text-masaar-black/70">{month.booking_advice_note}</p>
              </div>
            )}
          </Container>
        </section>
      )}

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow={month.display_label} title="Umrah Packages for Every Family" />
          <div className="mt-10">
            <PackageGrid
              packages={packages}
              emptyTitle="No Umrah packages published yet"
              emptyNote="Packages will appear here once published in Admin → Packages — the same packages shown on the main Umrah page."
              departureMonthSlug={month.slug}
              departureMonthLabel={month.display_label}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
