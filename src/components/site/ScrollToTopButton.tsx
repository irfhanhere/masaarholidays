"use client";

import { useEffect, useState } from "react";

/** Fixed bottom-right "back to top" button — appears once the visitor has scrolled past the first screen, sits just above the WhatsApp bubble on every page. */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-24 right-6 z-40 flex size-11 items-center justify-center rounded-full bg-[#A87F12] text-white shadow-lg transition-all hover:scale-105 hover:bg-[#936e0f]"
    >
      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
