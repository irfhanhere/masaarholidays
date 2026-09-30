import { getSiteOrigin } from "@/lib/site-url";

interface PackageSchemaProps {
  name: string;
  description: string;
  path: string;
  priceAed?: number | null;
  imageUrl?: string | null;
  durationDays?: number | null;
}

/**
 * Product & Offer JSON-LD schema for package pages (Umrah & Hajj).
 * Strictly grounded in real database pricing (AED) and duration.
 */
export function PackageSchema({
  name,
  description,
  path,
  priceAed,
  imageUrl,
  durationDays,
}: PackageSchemaProps) {
  const origin = getSiteOrigin();
  const canonicalUrl = `${origin}${path}`;
  const resolvedImage = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${origin}${imageUrl}`
    : undefined;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: canonicalUrl,
    ...(resolvedImage ? { image: resolvedImage } : {}),
    brand: {
      "@type": "Brand",
      name: "Masaar Holidays",
    },
    category: "Religious Pilgrimage Travel Package",
    ...(durationDays ? { duration: `P${durationDays}D` } : {}),
  };

  if (priceAed && priceAed > 0) {
    schema.offers = {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "AED",
      price: priceAed,
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "TravelAgency",
        name: "Masaar Holidays",
        url: origin,
      },
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
