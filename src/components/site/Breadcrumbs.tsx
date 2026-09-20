import Link from "next/link";
import { CONTACT } from "@/lib/contact";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Reads NEXT_PUBLIC_SITE_URL directly rather than via
// lib/site-url.ts#getSiteOrigin() — that helper is deliberately guarded
// with `import "server-only"` (correctly, since most of its seven other
// callers are genuinely server-only: sitemap.ts, robots.ts, etc.), but
// this file is statically imported by several Client Components
// (UmrahLandingClient.tsx, UmrahJourneyPageClient.tsx,
// UmrahMonthPageClient.tsx, UmrahInventoryDetailClient.tsx —
// Breadcrumbs/OrganizationSchema render identically from client and
// server pages), so it can't pull in anything server-only without
// breaking their build ("You're importing a module that depends on
// 'server-only'..."). NEXT_PUBLIC_ vars are safe to read in either
// context (inlined at build time both ways), so this duplicates
// getSiteOrigin()'s fallback logic locally instead of sharing it.
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://masaarholidays.com").replace(/\/$/, "");

/**
 * Visual breadcrumb trail + matching BreadcrumbList JSON-LD in one place,
 * so the two never drift apart. `items` excludes "Home" — it's always
 * prepended. The last item should omit `href` (current page, not a link).
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems: BreadcrumbItem[] = [{ label: "Home", href: "/" }, ...items];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_ORIGIN}${item.href}` } : {}),
    })),
  };

  return (
    <div className="border-b border-black/5 bg-white py-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-masaar-black/60">
          {allItems.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">›</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-deep-gold">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-masaar-black" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

/**
 * Site-wide Organization/TravelAgency schema — added once in the root layout,
 * describing the business itself rather than any one page. Only includes
 * facts already established elsewhere on the site (contact.ts) — no
 * invented registration/address details.
 *
 * No street address is included: Masaar operates fully remote/WhatsApp-first
 * with no physical office (see the Contact page's own comment). Social
 * profile links (sameAs) are the real, confirmed ones from contact.ts —
 * same handles as the Footer icons.
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Masaar Holidays",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/brand/logo.png`,
    image: `${SITE_ORIGIN}/brand/logo.png`,
    telephone: `+${CONTACT.whatsappPhoneIntl}`,
    email: CONTACT.emailGeneral,
    sameAs: [CONTACT.instagramUrl, CONTACT.facebookUrl, CONTACT.linkedinUrl],
    areaServed: [
      { "@type": "Country", name: "United Arab Emirates" },
      { "@type": "Country", name: "Saudi Arabia" },
      { "@type": "City", name: "Makkah" },
      { "@type": "City", name: "Madinah" },
    ],
    description:
      "Masaar Holidays plans private, family-paced Umrah and Hajj journeys from the UAE — personalised support, curated accommodation, and one dedicated point of contact throughout.",
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
