/**
 * WhatsApp pre-filled message templates now live in the `whatsapp_templates`
 * table (supabase/migrations/0013_whatsapp_templates.sql), managed from
 * Admin -> WhatsApp Templates, per brief Part 6: "Keep these editable in
 * the admin's WhatsApp Templates screen so Haseeb can adjust wording
 * without a developer."
 *
 * This file is now just:
 *   - the fixed list of keys every call site can reference (adding a new
 *     WhatsApp CTA means adding a key here AND a matching row in the DB —
 *     see the seed migration for the pattern)
 *   - the hardcoded DEFAULT text for each key, used as a fallback by
 *     WhatsAppTemplatesProvider when a key's DB row is missing or the
 *     fetch fails, so a visitor never sees a blank/broken WhatsApp
 *     message — see components/site/WhatsAppTemplatesProvider.tsx
 *   - interpolate(), shared by the provider (real DB text) and the
 *     fallback path (default text) so {{placeholder}} substitution works
 *     identically either way
 *
 * Nothing here is read directly by page components anymore — they go
 * through <WhatsAppButton templateKey="..." params={{...}} />, which
 * resolves the live DB text via useWhatsAppTemplates().
 */

export const WHATSAPP_TEMPLATE_KEYS = [
  "general",
  "umrahEssential",
  "umrahSignature",
  "umrahPrive",
  "upgradeToPlus",
  "hajj",
  "hotel",
  "hotelRoom",
  "packageRoom",
  "transfer",
  "visa",
  "contact",
] as const;

export type WhatsAppTemplateKey = (typeof WHATSAPP_TEMPLATE_KEYS)[number];

/** Fallback text if the DB row for a key is missing or the fetch failed — exactly the values seeded in 0014_seed_whatsapp_templates.sql. */
export const WHATSAPP_TEMPLATE_DEFAULTS: Record<WhatsAppTemplateKey, string> = {
  general: "Assalamu Alaikum, I'd like to know more about Masaar Holidays.",
  umrahEssential: "Assalamu Alaikum, I'd like more details on the Masaar Essential Umrah package.",
  umrahSignature: "Assalamu Alaikum, I'd like more details on the Masaar Signature Umrah package.",
  umrahPrive: "Assalamu Alaikum, I'd like more details on the Masaar Privé Umrah experience.",
  upgradeToPlus: "Assalamu Alaikum, I'd like to know more about upgrading to {{tier}} Plus.",
  hajj: "Assalamu Alaikum, I'd like to register my interest in Masaar's Hajj packages.",
  hotel: "Assalamu Alaikum, I'd like more information on {{hotelName}}.",
  hotelRoom: "Assalamu Alaikum, I'd like more information on the {{roomType}} room at {{hotelName}}.",
  packageRoom:
    "Assalamu Alaikum, I'd like more information on the {{roomType}} room option for the {{packageTitle}} package.",
  transfer: "Assalamu Alaikum, I'd like to arrange a private transfer: {{route}}.",
  visa: "Assalamu Alaikum, I'd like help with a visa: {{visaType}}.",
  contact: "Assalamu Alaikum, I'd like to speak with the Masaar team.",
};

/** Fallback destination number if whatsapp_settings is missing/unfetched — brief "Contact details (confirmed)". */
export const WHATSAPP_DEFAULT_PHONE = "971552276299";

/** Replaces {{token}} in a template with params[token]; leaves unmatched tokens as-is rather than throwing. */
export function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(params, token) ? params[token] : match
  );
}

/**
 * General "enquire about this package" template KEY for a package
 * card/detail page. Hajj packages always use the one generic Hajj
 * template — the brief only gives that single message (Part 6), no tier
 * variants, so there's nothing tier-specific to pick between for Hajj.
 */
export function packageGeneralTemplateKey(
  type: "umrah" | "hajj",
  tier: "essential" | "signature" | "prive"
): WhatsAppTemplateKey {
  if (type === "hajj") return "hajj";
  return tier === "essential" ? "umrahEssential" : tier === "signature" ? "umrahSignature" : "umrahPrive";
}
