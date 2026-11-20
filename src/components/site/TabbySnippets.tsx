"use client";

import React, { useEffect, useId, useState } from "react";
import { TabbyBadge, TabbyProductSnippet } from "@/components/site/TabbyLogo";

declare global {
  interface Window {
    TabbyPromo?: new (config: {
      selector: string;
      currency: string;
      price: string;
      lang?: string;
      source?: "product" | "cart";
      shouldInheritBg?: boolean;
      publicKey: string;
      merchantCode: string;
    }) => void;
    TabbyCard?: new (config: {
      selector: string;
      currency: string;
      price: string;
      lang?: string;
      shouldInheritBg?: boolean;
      publicKey: string;
      merchantCode: string;
    }) => void;
  }
}

const TABBY_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || "pk_test_01a18037-f2e7-bac6-79b9-bd39ce77b3fe";
const TABBY_MERCHANT_CODE =
  process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || "mhae";

/**
 * Loads external script tag safely and idempotently.
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Official TabbyPromo component for Product and Cart pages.
 * Docs: https://docs.tabby.ai/pay-in-4-custom-integration/on-site-messaging#add-the-snippets
 */
export function TabbyPromo({
  priceAed,
  lang = "en",
  className = "",
}: {
  priceAed: number | string;
  lang?: "en" | "ar";
  className?: string;
}) {
  const reactId = useId().replace(/[:]/g, "_");
  const containerId = `tabby-promo-${reactId}`;
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const formattedPrice =
    typeof priceAed === "number" ? priceAed.toFixed(2) : Number(priceAed).toFixed(2);

  useEffect(() => {
    setMounted(true);
    loadScript("https://checkout.tabby.ai/tabby-promo.js")
      .then(() => setScriptLoaded(true))
      .catch((err) => console.warn("[Tabby] Promo script load warning:", err));
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.TabbyPromo) return;

    try {
      new window.TabbyPromo({
        selector: `#${containerId}`,
        currency: "AED",
        price: formattedPrice,
        lang,
        source: "product",
        publicKey: TABBY_PUBLIC_KEY,
        merchantCode: TABBY_MERCHANT_CODE,
      });
    } catch (e) {
      console.warn("[Tabby] TabbyPromo init error:", e);
    }
  }, [scriptLoaded, formattedPrice, lang, containerId]);

  return (
    <div className={`tabby-promo-wrapper ${className}`}>
      {/* Official snippet container */}
      <div id={containerId}>
        {/* Clean fallback while script is initializing */}
        {(!mounted || !scriptLoaded) && (
          <TabbyProductSnippet installmentAed={(Number(formattedPrice) / 4).toFixed(2)} />
        )}
      </div>
    </div>
  );
}

/**
 * Official TabbyCard component for Checkout pages.
 * Docs: https://docs.tabby.ai/pay-in-4-custom-integration/checkout-flow#tabby-on-checkout
 */
export function TabbyCard({
  priceAed,
  lang = "en",
  className = "",
}: {
  priceAed: number | string;
  lang?: "en" | "ar";
  className?: string;
}) {
  const reactId = useId().replace(/[:]/g, "_");
  const containerId = `tabby-card-${reactId}`;
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const formattedPrice =
    typeof priceAed === "number" ? priceAed.toFixed(2) : Number(priceAed).toFixed(2);

  useEffect(() => {
    setMounted(true);
    loadScript("https://checkout.tabby.ai/tabby-card.js")
      .then(() => setScriptLoaded(true))
      .catch((err) => console.warn("[Tabby] Card script load warning:", err));
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.TabbyCard) return;

    try {
      new window.TabbyCard({
        selector: `#${containerId}`,
        currency: "AED",
        price: formattedPrice,
        lang,
        publicKey: TABBY_PUBLIC_KEY,
        merchantCode: TABBY_MERCHANT_CODE,
      });
    } catch (e) {
      console.warn("[Tabby] TabbyCard init error:", e);
    }
  }, [scriptLoaded, formattedPrice, lang, containerId]);

  return (
    <div className={`tabby-card-wrapper ${className}`}>
      <div id={containerId}>
        {(!mounted || !scriptLoaded) && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <TabbyBadge className="h-4.5 w-auto" />
              <span className="font-semibold text-masaar-black">4 interest-free payments</span>
            </div>
            <p className="text-[11px] text-stone-600">
              4 interest-free payments of AED {(Number(formattedPrice) / 4).toFixed(2)}. No interest. No fees. Shariah-compliant.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
