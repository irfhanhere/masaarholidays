"use client";

import { usePathname } from "next/navigation";
import { LOCALE_LABEL, SUPPORTED_LOCALES, localizedPath, type Locale } from "@/lib/locale-constants";

/**
 * Manual language switch — lives only in the footer now (small,
 * unobtrusive), not the main nav. The primary way visitors get offered a
 * switch is LanguagePrompt's one-time banner; this is the fallback for
 * anyone who dismissed that, or whose browser didn't signal a language
 * we detect.
 *
 * Deliberately a plain <a>, not next/link: the root layout's <html
 * lang/dir> is computed server-side from middleware's `x-locale` header
 * (lib/i18n.ts#getRequestLocale), and Next only re-evaluates that on a
 * real navigation — a client-side <Link> transition between "/" and
 * "/ar" reuses the cached root layout and leaves lang/dir stale. A plain
 * <a> forces the full page load that keeps them correct.
 */
export function LanguageSwitcher({ variant = "onDark" }: { variant?: "onDark" | "onLight" }) {
  const pathname = usePathname();
  const currentLocale: Locale = pathname.startsWith("/ar") ? "ar" : "en";
  const pathWithoutLocale =
    currentLocale === "ar" ? (pathname === "/ar" ? "/" : pathname.slice(3)) : pathname;

  const inactive = variant === "onDark" ? "text-white/60 hover:text-light-gold" : "text-masaar-black/50 hover:text-masaar-black";
  const active = variant === "onDark" ? "text-light-gold" : "text-masaar-black";
  const divider = variant === "onDark" ? "text-white/25" : "text-black/20";
  const globe = variant === "onDark" ? "text-white/50" : "text-masaar-black/40";

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <GlobeIcon className={`size-3.5 ${globe}`} />
      {SUPPORTED_LOCALES.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1.5">
          {i > 0 && <span className={divider}>/</span>}
          <a
            href={localizedPath(locale, pathWithoutLocale)}
            aria-current={locale === currentLocale ? "true" : undefined}
            className={`font-medium ${locale === currentLocale ? active : inactive}`}
          >
            {locale === "en" ? "EN" : "AR"}
          </a>
        </span>
      ))}
      <span className="sr-only"> Current language: {LOCALE_LABEL[currentLocale]}</span>
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9Z" />
    </svg>
  );
}
