/**
 * Safe, privacy-preserving Meta Pixel and GA4 tracking helper
 * NEVER sends PII, passport numbers, document contents or sensitive personal data.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export type MetaPixelEventName =
  | "ViewContent"
  | "EligibilityCheck"
  | "ApplicationStarted"
  | "ApplicantAdded"
  | "DocumentUploadCompleted"
  | "InitiateCheckout"
  | "Purchase";

export interface MetaPixelEventData {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  applicant_count?: number;
  application_type?: "individual" | "family";
  eligible?: boolean;
  document_type?: string;
  [key: string]: unknown;
}

export function trackMetaPixel(event: MetaPixelEventName, data?: MetaPixelEventData): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Meta Pixel
    if (typeof window.fbq === "function") {
      if (data) {
        window.fbq("track", event, data);
      } else {
        window.fbq("track", event);
      }
    }

    // 2. Google Analytics (GA4) custom event fallback
    if (typeof window.gtag === "function") {
      window.gtag("event", event.toLowerCase(), {
        event_category: "Saudi Visa Landing",
        ...data,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Tracked ${event}:`, data);
    }
  } catch (err) {
    console.warn(`[Analytics] Failed to track ${event}:`, err);
  }
}
