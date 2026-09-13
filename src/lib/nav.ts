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
    // Per-departure-month links (as shown in the approved Home screen's
    // Umrah dropdown) will populate here once real package dates exist —
    // left as a single link for now rather than inventing dates.
    children: [{ label: "All Umrah Packages", href: "/umrah" }],
  },
  {
    label: "Hajj",
    href: "/hajj",
    children: [{ label: "All Hajj Packages", href: "/hajj" }],
  },
  {
    label: "Hotels",
    href: "/hotels",
    children: [
      { label: "All Hotels", href: "/hotels" },
      { label: "Makkah Hotels", href: "/hotels#makkah" },
      { label: "Madinah Hotels", href: "/hotels#madinah" },
    ],
  },
  { label: "Transfers", href: "/transfers" },
  {
    label: "Visa",
    href: "/visa",
    // The 6 confirmed visa/document types — brief Part 2.
    children: [
      { label: "Umrah Visa", href: "/visa#umrah-visa" },
      { label: "UAE Visa", href: "/visa#uae-visa" },
      { label: "Global Visa", href: "/visa#global-visa" },
      { label: "Saudi Tourist Visa", href: "/visa#saudi-tourist-visa" },
      { label: "Emirates ID", href: "/visa#emirates-id" },
      { label: "Indian Visa", href: "/visa#indian-visa" },
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
  { label: "Hotels", href: "/hotels" },
  { label: "Transfers", href: "/transfers" },
  { label: "Visa", href: "/visa" },
];

export const FOOTER_COMPANY_NAV: NavChild[] = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
];
