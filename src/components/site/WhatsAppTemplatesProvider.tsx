"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  WHATSAPP_DEFAULT_PHONE,
  WHATSAPP_TEMPLATE_DEFAULTS,
  DEFAULT_SERVICE_SLUG_TO_KEY,
  interpolate,
  buildServiceWhatsAppMessage,
  type WhatsAppTemplateKey,
  type AdditionalServiceEnquiryParams,
} from "@/lib/whatsapp-templates";

interface WhatsAppTemplatesContextValue {
  /** Resolves a template key to its final message text (DB row if loaded, else the hardcoded default), with {{placeholders}} substituted. Never throws, never returns "". */
  getMessage: (key: WhatsAppTemplateKey | string, params?: Record<string, string>) => string;
  /** Resolves a service-specific message by service slug using assigned template or default mapping */
  getServiceMessage: (serviceSlug: string, params?: AdditionalServiceEnquiryParams) => string;
  /** Resolves the admin-configured default CTA text for a service or template */
  getServiceCta: (serviceSlug: string, fallbackText?: string) => string;
  /** Builds the direct wa.me link for a service */
  getServiceWhatsAppUrl: (serviceSlug: string, params?: AdditionalServiceEnquiryParams) => string;
  serviceSlugToKey: Record<string, string>;
  phoneNumber: string;
  loaded: boolean;
}

const WhatsAppTemplatesContext = createContext<WhatsAppTemplatesContextValue | null>(null);

/**
 * Fetches `whatsapp_templates` + `whatsapp_settings` once so every WhatsAppButton on the
 * page reflects admin edits without a rebuild/redeploy.
 *
 * Falls back to WHATSAPP_TEMPLATE_DEFAULTS / WHATSAPP_DEFAULT_PHONE
 * whenever a specific key's row doesn't exist or the fetch hasn't resolved.
 */
export function WhatsAppTemplatesProvider({
  children,
  initialTemplates,
  initialPhoneNumber,
  initialServiceSlugToKey,
  initialDefaultCtaTexts,
}: {
  children: ReactNode;
  initialTemplates?: Record<string, string>;
  initialPhoneNumber?: string;
  initialServiceSlugToKey?: Record<string, string>;
  initialDefaultCtaTexts?: Record<string, string>;
}) {
  const [templates, setTemplates] = useState<Record<string, string>>(initialTemplates ?? {});
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneNumber ?? WHATSAPP_DEFAULT_PHONE);
  const [serviceSlugToKey, setServiceSlugToKey] = useState<Record<string, string>>(
    initialServiceSlugToKey ?? { ...DEFAULT_SERVICE_SLUG_TO_KEY }
  );
  const [defaultCtaTexts, setDefaultCtaTexts] = useState<Record<string, string>>(initialDefaultCtaTexts ?? {});
  const [loaded, setLoaded] = useState(Boolean(initialTemplates && Object.keys(initialTemplates).length > 0));

  useEffect(() => {
    // If initial server data is present, do not query Supabase in the browser
    if (initialTemplates && Object.keys(initialTemplates).length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const [templatesRes, settingsRes] = await Promise.all([
          supabase.from("whatsapp_templates").select("key, template_text, assigned_service_slug, default_cta_text"),
          supabase.from("whatsapp_settings").select("phone_number").eq("id", 1).maybeSingle(),
        ]);
        if (templatesRes.error) throw templatesRes.error;
        if (cancelled) return;

        const map: Record<string, string> = {};
        const slugMap: Record<string, string> = { ...DEFAULT_SERVICE_SLUG_TO_KEY };
        const ctaMap: Record<string, string> = {};

        for (const row of (templatesRes.data ?? []) as any[]) {
          if (row.key && row.template_text) {
            map[row.key] = row.template_text;
          }
          if (row.assigned_service_slug && row.key) {
            slugMap[row.assigned_service_slug] = row.key;
          }
          if (row.key && row.default_cta_text) {
            ctaMap[row.key] = row.default_cta_text;
          }
        }
        setTemplates(map);
        setServiceSlugToKey(slugMap);
        setDefaultCtaTexts(ctaMap);

        if (!settingsRes.error && settingsRes.data?.phone_number) {
          setPhoneNumber(settingsRes.data.phone_number);
        }
      } catch (err) {
        console.error("WhatsAppTemplatesProvider: failed to load whatsapp_templates/settings", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialTemplates]);

  const getMessage = useCallback(
    (key: WhatsAppTemplateKey | string, params?: Record<string, string>): string => {
      const raw =
        templates[key] ??
        WHATSAPP_TEMPLATE_DEFAULTS[key as WhatsAppTemplateKey] ??
        WHATSAPP_TEMPLATE_DEFAULTS.general;
      return interpolate(raw, params);
    },
    [templates]
  );

  const getServiceMessage = useCallback(
    (serviceSlug: string, params?: AdditionalServiceEnquiryParams): string => {
      const key =
        serviceSlugToKey[serviceSlug] ||
        DEFAULT_SERVICE_SLUG_TO_KEY[serviceSlug] ||
        "additionalServicesGeneral";
      const raw =
        templates[key] ??
        WHATSAPP_TEMPLATE_DEFAULTS[key as WhatsAppTemplateKey] ??
        WHATSAPP_TEMPLATE_DEFAULTS.additionalServicesGeneral;

      return buildServiceWhatsAppMessage(raw, params);
    },
    [templates, serviceSlugToKey]
  );

  const getServiceCta = useCallback(
    (serviceSlug: string, fallbackText: string = "Enquire on WhatsApp"): string => {
      const key =
        serviceSlugToKey[serviceSlug] ||
        DEFAULT_SERVICE_SLUG_TO_KEY[serviceSlug] ||
        "additionalServicesGeneral";
      return defaultCtaTexts[key] || fallbackText;
    },
    [serviceSlugToKey, defaultCtaTexts]
  );

  const getServiceWhatsAppUrl = useCallback(
    (serviceSlug: string, params?: AdditionalServiceEnquiryParams): string => {
      const message = getServiceMessage(serviceSlug, params);
      return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    },
    [getServiceMessage, phoneNumber]
  );

  const value = useMemo(
    () => ({
      getMessage,
      getServiceMessage,
      getServiceCta,
      getServiceWhatsAppUrl,
      serviceSlugToKey,
      phoneNumber,
      loaded,
    }),
    [
      getMessage,
      getServiceMessage,
      getServiceCta,
      getServiceWhatsAppUrl,
      serviceSlugToKey,
      phoneNumber,
      loaded,
    ]
  );

  return <WhatsAppTemplatesContext.Provider value={value}>{children}</WhatsAppTemplatesContext.Provider>;
}

export function useWhatsAppTemplates(): WhatsAppTemplatesContextValue {
  const ctx = useContext(WhatsAppTemplatesContext);
  if (!ctx) {
    throw new Error("useWhatsAppTemplates() must be used within <WhatsAppTemplatesProvider>");
  }
  return ctx;
}
