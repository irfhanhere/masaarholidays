"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  WHATSAPP_DEFAULT_PHONE,
  WHATSAPP_TEMPLATE_DEFAULTS,
  interpolate,
  type WhatsAppTemplateKey,
} from "@/lib/whatsapp-templates";

interface WhatsAppTemplatesContextValue {
  /** Resolves a template key to its final message text (DB row if loaded, else the hardcoded default), with {{placeholders}} substituted. Never throws, never returns "". */
  getMessage: (key: WhatsAppTemplateKey, params?: Record<string, string>) => string;
  phoneNumber: string;
  loaded: boolean;
}

const WhatsAppTemplatesContext = createContext<WhatsAppTemplatesContextValue | null>(null);

/**
 * Fetches `whatsapp_templates` + `whatsapp_settings` once (public RLS
 * read, see 0013_whatsapp_templates.sql) so every WhatsAppButton on the
 * page reflects admin edits without a rebuild/redeploy — this is what
 * makes "change a template in the admin screen, the public button
 * updates" true on next page load, not just in the database.
 *
 * Falls back to WHATSAPP_TEMPLATE_DEFAULTS / WHATSAPP_DEFAULT_PHONE
 * whenever a specific key's row doesn't exist or the fetch hasn't
 * resolved/failed — a visitor never sees a blank or crashed WhatsApp
 * link, worst case they get the last-known-good hardcoded copy.
 */
export function WhatsAppTemplatesProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [phoneNumber, setPhoneNumber] = useState<string>(WHATSAPP_DEFAULT_PHONE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const [templatesRes, settingsRes] = await Promise.all([
          supabase.from("whatsapp_templates").select("key, template_text"),
          supabase.from("whatsapp_settings").select("phone_number").eq("id", 1).maybeSingle(),
        ]);
        if (templatesRes.error) throw templatesRes.error;
        if (cancelled) return;

        const map: Record<string, string> = {};
        for (const row of templatesRes.data ?? []) map[row.key] = row.template_text;
        setTemplates(map);

        if (!settingsRes.error && settingsRes.data?.phone_number) {
          setPhoneNumber(settingsRes.data.phone_number);
        }
      } catch (err) {
        console.error("WhatsAppTemplatesProvider: failed to load whatsapp_templates/settings", err);
        // Leave templates empty / phoneNumber at its default — getMessage()
        // falls back to WHATSAPP_TEMPLATE_DEFAULTS per key below.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getMessage = useCallback(
    (key: WhatsAppTemplateKey, params?: Record<string, string>): string => {
      const raw = templates[key] ?? WHATSAPP_TEMPLATE_DEFAULTS[key];
      return interpolate(raw, params);
    },
    [templates]
  );

  const value = useMemo(() => ({ getMessage, phoneNumber, loaded }), [getMessage, phoneNumber, loaded]);

  return <WhatsAppTemplatesContext.Provider value={value}>{children}</WhatsAppTemplatesContext.Provider>;
}

export function useWhatsAppTemplates(): WhatsAppTemplatesContextValue {
  const ctx = useContext(WhatsAppTemplatesContext);
  if (!ctx) {
    throw new Error("useWhatsAppTemplates() must be used within <WhatsAppTemplatesProvider>");
  }
  return ctx;
}
