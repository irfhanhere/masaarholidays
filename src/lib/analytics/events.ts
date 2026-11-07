/**
 * Safe, privacy-preserving Google Analytics 4 (gtag) and Meta Pixel (fbq) tracking.
 * STRICT PRIVACY RULE: NEVER collects or transmits Personally Identifiable Information (PII)
 * such as customer names, phone numbers, email addresses, passport numbers, or residential addresses.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsEventParams {
  service_type?: string;
  template_key?: string;
  package_name?: string;
  hotel_name?: string;
  destination?: string;
  cta_location?: string;
  page_location?: string;
  page_title?: string;
  [key: string]: unknown;
}

/**
 * Fires a privacy-preserving GA4 custom event with safe parameters.
 */
export function trackEvent(eventName: string, params: AnalyticsEventParams = {}): void {
  if (typeof window === "undefined") return;

  try {
    const payload: AnalyticsEventParams = {
      ...params,
      page_location: params.page_location || window.location.pathname,
      page_title: params.page_title || (typeof document !== "undefined" ? document.title : undefined),
    };

    // 1. Google Analytics 4
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
    }

    // 2. Meta Pixel custom event fallback where appropriate
    if (typeof window.fbq === "function") {
      if (eventName === "whatsapp_click") {
        window.fbq("trackCustom", "WhatsAppClick", {
          service_type: payload.service_type || "general",
          cta_location: payload.cta_location || "page_content",
        });
      } else if (eventName === "phone_click") {
        window.fbq("trackCustom", "PhoneClick", {
          cta_location: payload.cta_location || "page_content",
        });
      } else if (eventName.endsWith("_enquiry") || eventName === "enquiry_form_submit") {
        window.fbq("track", "Lead", {
          content_name: payload.package_name || payload.hotel_name || payload.service_type || "general",
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics Event] ${eventName}:`, payload);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Analytics Event Error] ${eventName}:`, err);
    }
  }
}

/**
 * Track user clicks on WhatsApp CTAs
 */
export function trackWhatsAppClick(params: AnalyticsEventParams = {}): void {
  trackEvent("whatsapp_click", params);
}

/**
 * Track user clicks on Phone call CTAs
 */
export function trackPhoneClick(params: AnalyticsEventParams = {}): void {
  trackEvent("phone_click", params);
}

/**
 * Track general and service-specific enquiry form submissions
 * Fires exactly ONE dedicated event per submission to avoid double-counting in GA4
 */
export function trackEnquirySubmit(
  serviceType: "umrah" | "hotel" | "transfer" | "visa" | "esim" | "general",
  params: AnalyticsEventParams = {}
): void {
  const serviceEventMap: Record<string, string> = {
    umrah: "umrah_package_enquiry",
    hotel: "hotel_enquiry",
    transfer: "transfer_enquiry",
    visa: "visa_enquiry",
    esim: "esim_enquiry",
    general: "enquiry_form_submit",
  };

  const eventName = serviceEventMap[serviceType] || "enquiry_form_submit";
  trackEvent(eventName, { service_type: serviceType, ...params });
}

