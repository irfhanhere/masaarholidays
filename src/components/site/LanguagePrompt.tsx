"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { localizedPath } from "@/lib/locale-constants";

const DISMISSED_KEY = "masaar-language-prompt-dismissed";

/**
 * One-time first-visit prompt (masaar-client-data-round2.md, Section 5):
 * "It looks like your browser is set to [detected language] — switch?"
 * Only Arabic is a real, translated option right now (English + Arabic
 * are the two MVP languages) — this deliberately does NOT offer to
 * switch to any other detected browser language, since we'd have nothing
 * translated to show for it. The framework generalises (see
 * SUPPORTED_LOCALES in lib/locale-constants.ts) once more languages are
 * genuinely translated.
 *
 * Never auto-redirects — English always loads first; this only offers a
 * one-click switch, and remembers a dismissal so it doesn't nag.
 */
export function LanguagePrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const isArabicRoute = pathname === "/ar" || pathname.startsWith("/ar/");

  useEffect(() => {
    if (isArabicRoute) return; // already on the Arabic site — nothing to prompt
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
      const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
      const looksArabic = browserLangs.some((l) => l.toLowerCase().startsWith("ar"));
      // Necessarily a post-mount effect, not derivable during render:
      // navigator.language/localStorage don't exist during SSR, so
      // computing this eagerly would be a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (looksArabic) setVisible(true);
    } catch {
      // localStorage/navigator unavailable (SSR-adjacent edge cases) — skip silently.
    }
  }, [isArabicRoute]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  function switchToArabic() {
    dismiss();
    router.push(localizedPath("ar", pathname));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl sm:inset-x-auto sm:right-6"
    >
      <p className="text-sm text-masaar-black">
        It looks like your browser is set to <strong>Arabic</strong> — switch?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={switchToArabic}
          className="rounded-md bg-pure-gold px-4 py-2 text-sm font-semibold text-masaar-black hover:bg-light-gold"
        >
          Switch to العربية
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-masaar-black hover:bg-warm-ivory"
        >
          Stay in English
        </button>
      </div>
    </div>
  );
}
