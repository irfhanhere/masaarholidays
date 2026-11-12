"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { MAIN_NAV, type NavChild } from "@/lib/nav";
import { localizedPath, resolveLocaleFromPath } from "@/lib/locale-constants";
import { CONTACT } from "@/lib/contact";
import { Container } from "./Container";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { TopBar } from "./TopBar";
import { WhatsAppButton } from "./WhatsAppButton";

export function Header({
  umrahDepartureMonths = [],
  showEsim = true,
}: {
  umrahDepartureMonths?: NavChild[];
  showEsim?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Umrah's dropdown is the only dynamic piece of MAIN_NAV — built here
  // from the active `umrah_departure_months` rows passed down from
  // (site)/layout.tsx (server-fetched, so the dropdown is present on
  // first paint, not a client-side fetch flash). No active months means
  // no `children` at all, so "Umrah" falls back to a plain link exactly
  // like every other item — Hajj has no departure-month layer and is
  // untouched.
  const navItems = useMemo(
    () =>
      MAIN_NAV.filter((item) => showEsim || item.href !== "/esim").map((item) =>
        item.label === "Umrah" && umrahDepartureMonths.length > 0
          ? { ...item, children: umrahDepartureMonths }
          : item
      ),
    [umrahDepartureMonths, showEsim]
  );

  // Nav hrefs are authored unprefixed (English); localize them against
  // whichever locale the visitor is currently on so clicking a nav item
  // on /ar/... (or /ur/…, /hi/…) doesn't silently bounce them back to English.
  const { locale } = resolveLocaleFromPath(pathname);
  const href = (path: string) => localizedPath(locale, path);

  const isActive = (path: string) => {
    const target = href(path);
    return path === "/" ? pathname === target : pathname.startsWith(target);
  };

  // Client's newer logo (wordmark + tagline lockup, wider aspect ratio than
  // the icon+wordmark original) is a home-page-only swap — every other
  // route keeps /brand/logo.png unchanged. Locale-aware via isActive("/")
  // so /ar, /ur, /hi home routes get it too, not just unprefixed "/".
  const isHome = isActive("/");

  return (
    <header className="sticky top-0 z-30">
      <TopBar />
      <div className="border-b border-black/5 bg-white">
        <Container className={`flex items-center justify-between gap-6 ${isHome ? "h-24 lg:h-28" : "h-20"}`}>
          <Link href={href("/")} className="flex items-center gap-2 shrink-0">
            {isHome ? (
              <Image
                src="/brand/logo-home.webp"
                alt="Masaar Holidays"
                width={224}
                height={112}
                sizes="(max-width: 1024px) 144px, 224px"
                className="h-16 w-auto lg:h-24"
              />
            ) : (
              <Image
                src="/brand/logo.png"
                alt="Masaar Holidays"
                width={240}
                height={72}
                sizes="(max-width: 1024px) 144px, 240px"
                className="h-16 w-auto"
              />
            )}
          </Link>

          <nav className="hidden items-center gap-4 xl:gap-6 2xl:gap-7 lg:flex">
            {navItems.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => item.children && setOpenDropdown(null)}
              >
                <Link
                  href={href(item.href)}
                  className={`text-sm font-medium tracking-wide transition-colors ${
                    isActive(item.href)
                      ? "text-pure-gold"
                      : "text-masaar-black hover:text-deep-gold"
                  }`}
                >
                  {item.label}
                </Link>
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-pure-gold" />
                )}
                {item.children && openDropdown === item.label && (
                  <div className="absolute left-0 top-full z-40 min-w-52 rounded-md border border-black/10 bg-white py-2 shadow-lg">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={href(child.href)}
                        className="block px-4 py-2 text-sm text-masaar-black hover:bg-warm-ivory"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden items-center gap-3 xl:gap-5 lg:flex shrink-0">
            {/* Direct Landline Callout Button (per design reference) */}
            <a
              href={`tel:${CONTACT.landlineTel}`}
              className="group flex flex-col items-start leading-none transition-transform hover:scale-[1.02] shrink-0"
              aria-label={`Call Landline for Best Service: ${CONTACT.landlineDisplay}`}
            >
              <span className="text-[11px] font-bold tracking-tight text-[#1E293B]">
                Call Landline for Best Service
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-base font-extrabold text-[#15803d] group-hover:text-[#16a34a]">
                <svg
                  className="size-4 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                <span className="whitespace-nowrap tracking-tight">{CONTACT.landlineDisplay}</span>
              </span>
            </a>

            <CurrencySwitcher />
            <WhatsAppButton templateKey="general">
              WhatsApp Us
            </WhatsAppButton>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <a
              href={`tel:${CONTACT.landlineTel}`}
              className="flex items-center gap-1 rounded-full border border-emerald-600/25 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-100"
              aria-label={`Call ${CONTACT.landlineDisplay}`}
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span className="font-semibold sm:inline">{CONTACT.landlineDisplay}</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex size-10 items-center justify-center rounded-md border border-black/10"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Menu</span>
              <div className="space-y-1.5">
                <span className="block h-0.5 w-5 bg-masaar-black" />
                <span className="block h-0.5 w-5 bg-masaar-black" />
                <span className="block h-0.5 w-5 bg-masaar-black" />
              </div>
            </button>
          </div>
        </Container>
      </div>

      {mobileOpen && (
        <div className="border-b border-black/10 bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={href(item.href)}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-warm-ivory text-pure-gold"
                    : "text-masaar-black"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center gap-3 px-3">
              <CurrencySwitcher />
            </div>
            <div className="mt-3 px-3">
              <a
                href={`tel:${CONTACT.landlineTel}`}
                className="flex items-center justify-between rounded-lg border border-emerald-600/25 bg-emerald-50/70 p-3 transition hover:bg-emerald-100/70"
              >
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">Call Landline for Best Service</p>
                  <p className="text-sm font-extrabold text-[#15803d]">{CONTACT.landlineDisplay}</p>
                </div>
                <span className="flex size-8 items-center justify-center rounded-full bg-[#15803d] text-white shadow-xs">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </span>
              </a>
            </div>
            <div className="mt-2 px-3">
              <WhatsAppButton templateKey="general" className="w-full">
                WhatsApp Us
              </WhatsAppButton>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
