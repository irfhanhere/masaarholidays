/**
 * WhatsApp pre-filled message templates — finalized draft, brief Part 6.
 * This is client-approved operational copy (not marketing page copy), so
 * it's safe to ship as the default set. Per the brief these must stay
 * editable by Haseeb without a developer — this file is the fallback
 * default; a future `whatsapp_templates` table (Admin > WhatsApp
 * Templates screen) should let admin edits override these at runtime.
 */
export const WHATSAPP_TEMPLATES = {
  general: "Assalamu Alaikum, I'd like to know more about Masaar Holidays.",
  umrahEssential:
    "Assalamu Alaikum, I'd like more details on the Masaar Essential Umrah package.",
  umrahSignature:
    "Assalamu Alaikum, I'd like more details on the Masaar Signature Umrah package.",
  umrahPrive:
    "Assalamu Alaikum, I'd like more details on the Masaar Privé Umrah experience.",
  upgradeToPlus: (tier: "Essential" | "Signature") =>
    `Assalamu Alaikum, I'd like to know more about upgrading to ${tier} Plus.`,
  hajj: "Assalamu Alaikum, I'd like to register my interest in Masaar's Hajj packages.",
  hotel: (hotelName: string) =>
    `Assalamu Alaikum, I'd like more information on ${hotelName}.`,
  hotelRoom: (hotelName: string, roomType: string) =>
    `Assalamu Alaikum, I'd like more information on the ${roomType} room at ${hotelName}.`,
  packageRoom: (packageTitle: string, roomType: string) =>
    `Assalamu Alaikum, I'd like more information on the ${roomType} room option for the ${packageTitle} package.`,
  transfer: (route: string) =>
    `Assalamu Alaikum, I'd like to arrange a private transfer: ${route}.`,
  visa: (visaType: string) =>
    `Assalamu Alaikum, I'd like help with a visa: ${visaType}.`,
  contact: "Assalamu Alaikum, I'd like to speak with the Masaar team.",
} as const;

/**
 * General "enquire about this package" message for a package card/detail
 * page. Hajj packages always use the one generic Hajj template — the
 * brief only gives that single message (Part 6), no tier variants, so
 * there's nothing tier-specific to pick between for Hajj.
 */
export function packageGeneralMessage(
  type: "umrah" | "hajj",
  tier: "essential" | "signature" | "prive"
): string {
  if (type === "hajj") return WHATSAPP_TEMPLATES.hajj;
  return tier === "essential"
    ? WHATSAPP_TEMPLATES.umrahEssential
    : tier === "signature"
      ? WHATSAPP_TEMPLATES.umrahSignature
      : WHATSAPP_TEMPLATES.umrahPrive;
}
