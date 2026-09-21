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
  officeAddressLines: [
    "Sharjah Publishing City",
    "Entrance 2, Ground Floor",
    "Al Zahia, Sheikh Mohammed Bin Zayed Road",
    "Sharjah, United Arab Emirates",
  ],
  businessHours: "Daily | 8:00 AM – 8:00 PM UAE Time",
  businessHoursNote:
    "Our team is available during business hours for enquiries, bookings, travel arrangements and customer assistance.",
  emergencySupportNote:
    "For customers currently travelling with Masaar, urgent Umrah-related assistance is available 24 hours a day, 7 days a week.",
} as const;

/**
 * `phone` defaults to the confirmed brief number but is meant to be
 * passed explicitly from whatsapp_settings (admin-editable) — see
 * components/site/WhatsAppTemplatesProvider.tsx.
 */
export function buildWhatsAppLink(message: string, phone: string = CONTACT.whatsappPhoneIntl): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
