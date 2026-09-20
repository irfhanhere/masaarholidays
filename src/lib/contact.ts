/**
 * Confirmed contact details — masaar-holidays-website-brief.md,
 * "Contact details (confirmed)". Kept in one place so a future change
 * (e.g. moving these into the admin panel) only touches this file.
 */
export const CONTACT = {
  whatsappPhoneIntl: "971552276299", // +971 55 227 6299, no leading "+"/spaces (wa.me format)
  phoneDisplay: "+971 55 227 6299",
  emailGeneral: "care@masaarholidays.com",
  emailPartnerships: "partners@masaarholidays.com",
  emailAccounts: "accounts@masaarholidays.com",
  instagramUrl: "https://www.instagram.com/masaarholidays/",
  facebookUrl: "https://www.facebook.com/profile.php?id=61594355322720",
  linkedinUrl: "https://www.linkedin.com/company/masaarholidays",
} as const;

/**
 * `phone` defaults to the confirmed brief number but is meant to be
 * passed explicitly from whatsapp_settings (admin-editable) — see
 * components/site/WhatsAppTemplatesProvider.tsx.
 */
export function buildWhatsAppLink(message: string, phone: string = CONTACT.whatsappPhoneIntl): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
