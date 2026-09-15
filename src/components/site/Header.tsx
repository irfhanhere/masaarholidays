"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MAIN_NAV } from "@/lib/nav";
import { localizedPath, type Locale } from "@/lib/locale-constants";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";
import { Container } from "./Container";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { TopBar } from "./TopBar";
import { WhatsAppButton } from "./WhatsAppButton";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Nav hrefs are authored unprefixed (English); localize them against
  // whichever locale the visitor is currently on so clicking a nav item
  // on /ar/... doesn't silently bounce them back to English.
  const locale: Locale = pathname.startsWith("/ar") ? "ar" : "en";
  const href = (path: string) => localizedPath(locale, path);

  const isActive = (path: string) => {
    const target = href(path);
    return path === "/" ? pathname === target : pathname.startsWith(target);
  };

  return (
    <header className="sticky top-0 z-30">
      <TopBar />
      <div className="border-b border-black/5 bg-white">
        <Container className="flex h-20 items-center justify-between gap-6">
          <Link href={href("/")} className="flex items-center gap-2 shrink-0">
            <Image
              src="/brand/logo.png"
              alt="Masaar Holidays"
              width={160}
              height={48}
              className="h-11 w-auto"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {MAIN_NAV.map((item) => (
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
                  <span className="absolute -bottom-6 left-0 h-0.5 w-full bg-pure-gold" />
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

          <div className="hidden items-center gap-3 lg:flex">
            <CurrencySwitcher />
            <WhatsAppButton message={WHATSAPP_TEMPLATES.general}>
              WhatsApp Us
            </WhatsAppButton>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-md border border-black/10 lg:hidden"
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
              <WhatsAppButton message={WHATSAPP_TEMPLATES.general} className="w-full">
                WhatsApp Us
              </WhatsAppButton>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
