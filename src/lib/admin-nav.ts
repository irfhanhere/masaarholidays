/**
 * Admin sidebar nav — matches the approved admin screens (DASBOARD.png,
 * ADMIN PACKAGES.png, admin-Testmonials Overview.png, ADMIN-EQNUIRIES.png,
 * ADMIN-CURRENCY SETTINGS.png). Testimonials + Blog + Media Library are
 * flagged in the brief as screens to ADD to this sidebar (Part 4) — they
 * exist as designed screens in /inspirations but weren't in the original
 * asset-browser nav list.
 */
export interface AdminNavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  { title: "", items: [{ label: "Dashboard", href: "/admin" }] },
  {
    title: "Content",
    items: [
      {
        label: "Packages",
        href: "/admin/packages",
        children: [
          { label: "Umrah Packages", href: "/admin/packages?type=umrah" },
          { label: "Hajj Packages", href: "/admin/packages?type=hajj" },
        ],
      },
      { label: "Umrah Departures", href: "/admin/umrah-departures" },
      { label: "Umrah Content", href: "/admin/umrah-content" },
      { label: "Hotels", href: "/admin/hotels" },
      { label: "Transfers", href: "/admin/transfers" },
      { label: "Visa Types", href: "/admin/visa-types" },
      { label: "Visa Content", href: "/admin/visa-content" },
      { label: "Testimonials", href: "/admin/testimonials" },
      { label: "Private Trips", href: "/admin/private-trips" },
      { label: "Home & About", href: "/admin/home-about" },
      { label: "Blog", href: "/admin/blog" },
      { label: "Media Library", href: "/admin/media" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Currency & Pricing", href: "/admin/currency-pricing" },
      { label: "WhatsApp Templates", href: "/admin/whatsapp-templates" },
      { label: "Page SEO", href: "/admin/page-seo" },
      { label: "Legal & Cookies", href: "/admin/legal" },
    ],
  },
  { title: "Leads", items: [{ label: "Enquiries", href: "/admin/enquiries" }] },
  {
    title: "System",
    items: [
      { label: "Admin Users", href: "/admin/users" },
      { label: "Password & 2FA", href: "/admin/account/password-2fa" },
    ],
  },
];
