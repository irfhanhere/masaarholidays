/**
 * Confirmed 8-tab nav + footer-only links, per
 * masaar-holidays-website-brief.md ("Confirmed nav (8 tabs)") and
 * masaar-holidays-content-seo-starter-kit.md (Section 1, Sitemap).
 */

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
}

export const MAIN_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Umrah",
    href: "/umrah",
    // No static children here — Header.tsx fills this in at render time
    // from the active `umrah_departure_months` rows (sorted by
    // sort_order), and omits the dropdown entirely when none are active.
    // Hajj has no departure-month layer, so it stays a plain link.
  },
  {
    label: "Hajj",
    href: "/hajj",
    children: [{ label: "All Hajj Packages", href: "/hajj" }],
  },
  // Plain link — the Makkah/Madinah split lives on the /hotels page itself
  // (city toggle), so a nav dropdown here would just duplicate it.
  { label: "Hotels", href: "/hotels" },
  { label: "Transfers", href: "/transfers" },
  {
    label: "Visa",
    href: "/visa",
    // The 6 confirmed visa/document types. Links to each type's own
    // /visa/[slug] detail page (see visa_types.slug), not anchor
    // fragments on the /visa landing page.
    children: [
      { label: "Umrah Visa", href: "/visa/umrah" },
      { label: "UAE Visa", href: "/visa/uae" },
      { label: "Global Visa", href: "/visa/global" },
      { label: "Saudi Tourist Visa", href: "/visa/saudi-tourist" },
      { label: "Emirates ID", href: "/visa/emirates-id" },
      { label: "Indian Visa", href: "/visa/india" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_ONLY_NAV: NavChild[] = [
  { label: "Blog", href: "/blog" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Cookie Preferences", href: "/cookie-preferences" },
];

export const FOOTER_SERVICES_NAV: NavChild[] = [
  { label: "Umrah Packages", href: "/umrah" },
  { label: "Hajj Packages", href: "/hajj" },
  { label: "Umrah Visa", href: "/visa/umrah" },
  { label: "Hotels", href: "/hotels" },
  { label: "Transfers", href: "/transfers" },
  { label: "Visa", href: "/visa" },
  { label: "Private Trips", href: "/private-trips" },
];

export const FOOTER_COMPANY_NAV: NavChild[] = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Blog", href: "/blog" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
];
