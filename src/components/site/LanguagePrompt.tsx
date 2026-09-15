"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LOCALE_LABEL, localizedPath, type Locale } from "@/lib/locale-constants";

const DISMISSED_KEY = "masaar-language-prompt-dismissed";

/**
 * One-time, browser-language-detected prompt — the primary way visitors
 * get offered a language switch (masaar-client-data-round2.md Section 5;
 * scope narrowed by a later instruction to drop the permanent header
 * toggle in favour of this, similar to a browser's native translate bar).
 *
 * Symmetric: offers Arabic when the browser looks Arabic and you're on
 * the English site, and offers English back when the browser does NOT
 * look Arabic and you're on the Arabic site — either way it's "the
 * current page's language doesn't match your browser's."
 *
 * Only English + Arabic are real, translated locales right now (see
 * SUPPORTED_LOCALES in lib/locale-constants.ts) — this deliberately does
 * NOT try to detect/offer Urdu, Hindi or anything else not actually
 * built, since there'd be nothing translated to show for it.
 *
 * Never auto-redirects — whichever locale the URL already resolves to
 * loads first; this only offers a one-click switch. Dismissing it is
 * remembered (localStorage) so it doesn't reappear on every page load.
 */
export function LanguagePrompt() {
  const pathname = usePathname();
  const [offer, setOffer] = useState<Locale | null>(null);

  const currentLocale: Locale = pathname.startsWith("/ar") ? "ar" : "en";

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
      const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
      const looksArabic = browserLangs.some((l) => l.toLowerCase().startsWith("ar"));

      // "differs from the current page's language" — only two real
      // locales exist, so this is just the other one, in either direction.
      const target: Locale | null =
        currentLocale === "en" && looksArabic
          ? "ar"
          : currentLocale === "ar" && !looksArabic
            ? "en"
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
    // window.location, not router.push: a client-side transition would
    // leave <html lang/dir> stale — see the note on LanguageSwitcher for
    // why a full navigation is required here.
    window.location.href = localizedPath(target, currentLocale === "ar" ? pathname.slice(3) || "/" : pathname);
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
