/**
 * WhatsApp pre-filled message templates now live in the `whatsapp_templates`
 * table (supabase/migrations/0013_whatsapp_templates.sql), managed from
 * Admin -> WhatsApp Templates, so wording can be adjusted from the admin
 * screen without a developer.
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
  "umrahExclusive",
  "upgradeToPlus",
  "hajj",
  "hotel",
  "hotelRoom",
  "packageRoom",
  "transfer",
  "visa",
  "contact",
  "packageEnquiry",
  "privateTripEnquiry",
  "guidedUmrah",
  "umrahJourney",
] as const;

export type WhatsAppTemplateKey = (typeof WHATSAPP_TEMPLATE_KEYS)[number];

/** Fallback text if the DB row for a key is missing or the fetch failed — exactly the values seeded in 0014_seed_whatsapp_templates.sql. */
export const WHATSAPP_TEMPLATE_DEFAULTS: Record<WhatsAppTemplateKey, string> = {
  general: "Assalamu Alaikum, I'd like to know more about Masaar Holidays.",
  // umrahEssential/Signature/Exclusive: no longer wired to a button — the
  // package card/detail "Enquire on WhatsApp" popup now always opens
  // with the single `packageEnquiry` template instead (see
  // PackageEnquiryButton.tsx). Left as-is (row, key and default all
  // still here) rather than deleted, same as `upgradeToPlus` below —
  // Haseeb may still want this wording for a future use.
  umrahEssential: "Assalamu Alaikum, I'd like more details on the Masaar Essential Umrah package.",
  umrahSignature: "Assalamu Alaikum, I'd like more details on the Masaar Signature Umrah package.",
  umrahExclusive: "Assalamu Alaikum, I'd like more details on the Masaar Exclusive Umrah experience.",
  upgradeToPlus: "Assalamu Alaikum, I'd like to know more about upgrading to {{tier}} Plus.",
  hajj: "Assalamu Alaikum, I'd like to register my interest in Masaar's Hajj packages.",
  hotel: "Assalamu Alaikum, I'd like more information on {{hotelName}}.",
  hotelRoom: "Assalamu Alaikum, I'd like more information on the {{roomType}} room at {{hotelName}}.",
  packageRoom:
    "Assalamu Alaikum, I'd like more information on the {{roomType}} room option for the {{packageTitle}} package.",
  transfer: "Assalamu Alaikum, I'd like to arrange a private transfer: {{route}}.",
  visa: "Assalamu Alaikum, I'd like help with a visa: {{visaType}}.",
  contact: "Assalamu Alaikum, I'd like to speak with the Masaar team.",
  packageEnquiry:
    "Assalamu Alaikum, I'd like to enquire about {{packageTitle}} ({{tier}} — {{duration}}).",
  privateTripEnquiry:
    "Assalamu Alaikum, I'd like to enquire about the {{tripName}} private trip ({{destination}} — {{duration}}).",
  guidedUmrah:
    "Assalamu Alaikum, I'd like to enquire about the Guided Umrah Assistance service.",
  umrahJourney:
    "Assalamu Alaikum,\n\nI'm interested in:\n\n{{packageName}}\n{{journey}}\n{{month}}\n\nDuration:\n{{duration}}\n\nStay:\n{{stay}}\n\nOccupancy:\n{{occupancy}}\n\nPrice shown:\n{{price}}\n\nPlease share availability and more details.\n\nJazakAllah Khair.",
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
