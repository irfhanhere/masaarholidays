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
} as const;

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(message)}`;
}
