"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_LABEL,
  SUPPORTED_LOCALES,
  localizedPath,
  resolveLocaleFromPath,
  type Locale,
} from "@/lib/locale-constants";

const DISMISSED_KEY = "masaar-language-prompt-dismissed";

/**
 * One-time, browser-language-detected prompt — the ONLY way a visitor is
 * offered a language switch (masaar-client-data-round2.md Section 5;
 * scope narrowed by later instructions to drop both the permanent header
 * toggle and, later still, the footer one too, leaving this as the sole
 * mechanism — same idea as a browser's native translate bar: it offers,
 * it doesn't force, and there's no persistent manual control sitting in
 * the chrome). If a manual switcher is wanted again later, resurrect the
 * deleted `LanguageSwitcher.tsx` (see git history) rather than rebuilding
 * it from scratch — it already handled the "plain <a>, not next/link"
 * requirement below.
 *
 * Symmetric and locale-count-agnostic: finds the visitor's most-preferred
 * browser language that matches one of SUPPORTED_LOCALES. If that's not
 * the locale they're currently viewing, offer it — whether that means
 * English -> Urdu, Hindi -> Arabic, or anything else -> back to English
 * (the default) when the browser doesn't match any of our locales at
 * all. Adding a locale to SUPPORTED_LOCALES is the only change needed to
 * have it detected/offered here too — no per-locale branching.
 *
 * Never auto-redirects — whichever locale the URL already resolves to
 * loads first; this only offers a one-click switch. Dismissing it is
 * remembered (localStorage) so it doesn't reappear on every page load.
 */
export function LanguagePrompt() {
  const pathname = usePathname();
  const [offer, setOffer] = useState<Locale | null>(null);

  const { locale: currentLocale, internalPath: pathWithoutLocale } = resolveLocaleFromPath(pathname);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
      const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language];

      // First browser-preferred language (by primary subtag, e.g.
      // "ar-SA" -> "ar") that matches one of our real locales.
      const matched = browserLangs
        .map((l) => l.toLowerCase().split("-")[0])
        .map((primary) => SUPPORTED_LOCALES.find((l) => l === primary))
        .find((l): l is Locale => Boolean(l));

      // "differs from the current page's language": either the browser
      // clearly wants a specific locale we have and we're not on it, or
      // the browser doesn't match any of our locales at all and we're
      // not on the default (English) — offer the fallback back to it.
      const target: Locale | null = matched
        ? matched !== currentLocale
          ? matched
          : null
        : currentLocale !== DEFAULT_LOCALE
          ? DEFAULT_LOCALE
          : null;

      // Necessarily a post-mount effect, not derivable during render:
      // navigator.language/localStorage don't exist during SSR, so
      // computing this eagerly would be a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (target) setOffer(target);
    } catch {
      // localStorage/navigator unavailable (SSR-adjacent edge cases) — skip silently.
    }
  }, [currentLocale]);

  function dismiss() {
    setOffer(null);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  function switchLocale() {
    if (!offer) return;
    const target = offer;
    dismiss();
    // window.location, not router.push: root layout.tsx computes <html
    // lang/dir> server-side from the x-locale header, and Next reuses
    // the cached root layout across a client-side transition between
    // locale prefixes (they're the same underlying route once the
    // middleware rewrite resolves) — router.push there would leave
    // lang/dir stale until a manual reload. A full navigation is what
    // actually keeps them correct.
    window.location.href = localizedPath(target, pathWithoutLocale);
  }

  if (!offer) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl sm:inset-x-auto sm:right-6"
    >
      <p className="text-sm text-masaar-black">
        It looks like your browser is set to <strong>{LOCALE_LABEL[offer]}</strong> — switch?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={switchLocale}
          className="rounded-md bg-pure-gold px-4 py-2 text-sm font-semibold text-masaar-black hover:bg-light-gold"
        >
          Switch to {LOCALE_LABEL[offer]}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-masaar-black hover:bg-warm-ivory"
        >
          Stay in {LOCALE_LABEL[currentLocale]}
        </button>
      </div>
    </div>
  );
}
