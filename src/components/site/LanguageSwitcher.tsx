"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_LABEL, SUPPORTED_LOCALES, localizedPath, type Locale } from "@/lib/locale-constants";

/** Persistent header switcher (masaar-client-data-round2.md Section 5) — always visible, independent of the one-time LanguagePrompt. */
export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLocale: Locale = pathname.startsWith("/ar") ? "ar" : "en";
  const pathWithoutLocale =
    currentLocale === "ar" ? (pathname === "/ar" ? "/" : pathname.slice(3)) : pathname;

  return (
    <div className="flex items-center gap-1 text-sm">
      {SUPPORTED_LOCALES.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span className="text-black/20">/</span>}
          <Link
            href={localizedPath(locale, pathWithoutLocale)}
            aria-current={locale === currentLocale ? "true" : undefined}
            className={
              locale === currentLocale
                ? "font-semibold text-masaar-black"
                : "text-masaar-black/50 hover:text-masaar-black"
            }
          >
            {locale === "en" ? "EN" : "AR"}
          </Link>
        </span>
      ))}
      <span className="sr-only">
        {" "}
        Current language: {LOCALE_LABEL[currentLocale]}
      </span>
    </div>
  );
}
