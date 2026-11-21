import { getSiteOrigin } from "@/lib/site-url";

interface ServiceSchemaProps {
  name: string;
  serviceType: string;
  description: string;
  path: string;
  areaServed?: string[];
}

/**
 * Valid Schema.org Service structured data for Masaar Holidays commercial service pages.
 * Fully grounded in verified company facts and travel agency provider metadata.
 */
export function ServiceSchema({
  name,
  serviceType,
  description,
  path,
  areaServed = ["United Arab Emirates", "Saudi Arabia"],
}: ServiceSchemaProps) {
  const origin = getSiteOrigin();
  const canonicalUrl = `${origin}${path}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl}#service`,
    name,
    serviceType,
    description,
    url: canonicalUrl,
    provider: {
      "@type": "TravelAgency",
      "@id": `${origin}/#travelagency`,
      name: "Masaar Holidays",
      url: origin,
    },
    areaServed: areaServed.map((area) => ({
      "@type": "Place",
      name: area,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
