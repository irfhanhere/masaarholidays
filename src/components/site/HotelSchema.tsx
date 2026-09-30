import { getSiteOrigin } from "@/lib/site-url";

interface HotelSchemaProps {
  name: string;
  city: string;
  slug: string;
  description?: string | null;
  starRating?: number | null;
  imageUrl?: string | null;
  priceFromAed?: number | null;
  walkMinutes?: number | null;
  shuttleAvailable?: boolean | null;
}

/**
 * Hotel / LodgingBusiness JSON-LD schema using only verified database fields.
 */
export function HotelSchema({
  name,
  city,
  slug,
  description,
  starRating,
  imageUrl,
  priceFromAed,
  walkMinutes,
  shuttleAvailable,
}: HotelSchemaProps) {
  const origin = getSiteOrigin();
  const canonicalUrl = `${origin}/hotels/${slug}`;
  const resolvedImage = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${origin}${imageUrl}`
    : undefined;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name,
    description:
      description ||
      `${name} in ${city} — accommodation, Haram proximity details, and booking assistance through Masaar Holidays.`,
    url: canonicalUrl,
    ...(resolvedImage ? { image: resolvedImage } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressCountry: "SA",
    },
    ...(starRating
      ? {
          starRating: {
            "@type": "Rating",
            ratingValue: starRating,
            bestRating: 5,
          },
        }
      : {}),
    ...(priceFromAed && priceFromAed > 0
      ? {
          priceRange: `From AED ${priceFromAed}`,
          makesOffer: {
            "@type": "Offer",
            price: priceFromAed,
            priceCurrency: "AED",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          },
        }
      : {}),
    amenityFeature: [
      ...(walkMinutes
        ? [
            {
              "@type": "LocationFeatureSpecification",
              name: `${walkMinutes}-minute walk to Holy Mosque`,
              value: true,
            },
          ]
        : []),
      ...(shuttleAvailable
        ? [
            {
              "@type": "LocationFeatureSpecification",
              name: "Haram Shuttle Service",
              value: true,
            },
          ]
        : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
