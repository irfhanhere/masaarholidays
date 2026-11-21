import { getSiteOrigin } from "@/lib/site-url";
import type { PremiumPackage } from "@/lib/types/premium-package";

interface Props {
  pkg: PremiumPackage;
}

/**
 * Valid Schema.org TouristTrip structured data for Umrah Packages.
 * Accurately models pilgrimage packages with per-occupancy room pricing,
 * day-by-day itinerary segments, verified provider credentials, and destination data.
 */
export function UmrahPackageSchema({ pkg }: Props) {
  if (pkg.schema_enabled === false) return null;

  const origin = getSiteOrigin();
  const canonicalUrl = pkg.canonical_url || `${origin}/umrah/${pkg.slug}`;
  const resolvedImage = pkg.featured_image
    ? pkg.featured_image.startsWith("http")
      ? pkg.featured_image
      : `${origin}${pkg.featured_image}`
    : `${origin}/brand/banners/umrah.webp`;

  // Occupancy pricing offers (Quad, Triple, Double, Single, Child with Bed)
  const offers = (pkg.pricing || [])
    .filter((p) => p.is_active && p.price_aed > 0)
    .map((p) => ({
      "@type": "Offer",
      name: `${p.room_type} (Per Person)`,
      price: p.price_aed,
      priceCurrency: p.currency || "AED",
      description: `${p.room_type} room accommodation per person (${p.pricing_basis || "per person"})`,
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
      seller: {
        "@type": "TravelAgency",
        "@id": `${origin}/#travelagency`,
        name: "Masaar Holidays",
        url: origin,
      },
    }));

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${canonicalUrl}#trip`,
    name: pkg.title,
    description: pkg.meta_description || pkg.short_description,
    url: canonicalUrl,
    image: resolvedImage,
    touristType: "Pilgrim",
    provider: {
      "@type": "TravelAgency",
      "@id": `${origin}/#travelagency`,
      name: "Masaar Holidays",
      url: origin,
      telephone: "+971557329320",
    },
    itinerary: (pkg.itinerary || [])
      .filter((day) => day.is_published !== false)
      .map((day) => ({
        "@type": "TouristTrip",
        name: `Day ${day.day_number}: ${day.title}`,
        description: Array.isArray(day.activities) ? day.activities.join(". ") : day.title,
      })),
  };

  if (offers.length > 0) {
    schema.offers = offers;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
