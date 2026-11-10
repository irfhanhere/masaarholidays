/**
 * WhatsApp pre-filled message templates now live in the `whatsapp_templates`
 * table (supabase/migrations/0013_whatsapp_templates.sql), managed from
 * Admin -> WhatsApp Templates, so wording can be adjusted from the admin
 * screen without a developer.
 *
 * This file contains:
 *   - the fixed list of keys every call site can reference
 *   - the hardcoded DEFAULT text for each key, used as a fallback by
 *     WhatsAppTemplatesProvider when a key's DB row is missing or the
 *     fetch fails, so a visitor never sees a blank/broken WhatsApp message
 *   - interpolate(), shared by the provider and fallback paths
 *   - service-specific template mapping and URL generation helpers for
 *     Additional Services
 */

import type { WhatsAppTemplateRow } from "@/lib/types/database";

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
  // Additional Services Enquiry Templates (Phase 7)
  "umrahGuideEnquiry",
  "makkahZiyarahEnquiry",
  "madinahZiyarahEnquiry",
  "privateToursEnquiry",
  "wheelchairAssistanceEnquiry",
  "privateTransportEnquiry",
  "additionalServicesGeneral",
] as const;

export type WhatsAppTemplateKey = (typeof WHATSAPP_TEMPLATE_KEYS)[number];

/** Fallback destination number if whatsapp_settings is missing/unfetched — brief "Contact details (confirmed)". */
export const WHATSAPP_DEFAULT_PHONE = "971557329320";

/** Default mapping from published service slugs to their respective WhatsApp template keys */
export const DEFAULT_SERVICE_SLUG_TO_KEY: Record<string, WhatsAppTemplateKey> = {
  "umrah-guide": "umrahGuideEnquiry",
  "makkah-ziyarah": "makkahZiyarahEnquiry",
  "madinah-ziyarah": "madinahZiyarahEnquiry",
  "private-tours": "privateToursEnquiry",
  "wheelchair-assistance": "wheelchairAssistanceEnquiry",
  "private-transport": "privateTransportEnquiry",
  "tour-guide-sightseeing": "umrahGuideEnquiry",
  "walking-tour-guide": "umrahGuideEnquiry",
  "luggage-assistance": "wheelchairAssistanceEnquiry",
  "child-seat": "privateTransportEnquiry",
  "family-photography": "privateToursEnquiry",
  "other-additional-services": "additionalServicesGeneral",
};

/** Fallback text if the DB row for a key is missing or the fetch failed */
export const WHATSAPP_TEMPLATE_DEFAULTS: Record<WhatsAppTemplateKey, string> = {
  general: "Assalamu Alaikum, I'd like to know more about Masaar Holidays.",
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

  // 1. Umrah Guide enquiry
  umrahGuideEnquiry:
    "Assalamu Alaikum, Masaar Holidays.\n\nI would like to enquire about arranging an Umrah Guide.\n\nName:\nTravel date:\nNumber of pilgrims:\nPreferred city: {{city}}\nPreferred language:\nService requirements: {{service_option}}\n\nPlease share the available arrangements and details.{{package_ref}}{{url_ref}}",

  // 2. Makkah Ziyarah enquiry
  makkahZiyarahEnquiry:
    "Assalamu Alaikum, Masaar Holidays.\n\nI am interested in Makkah Ziyarah arrangements.\n\nName:\nTravel date:\nNumber of travellers:\nPreferred arrangement: {{service_option}}\nPickup location:\nSpecial requirements:\n\nPlease share the available options and quotation.{{package_ref}}{{url_ref}}",

  // 3. Madinah Ziyarah enquiry
  madinahZiyarahEnquiry:
    "Assalamu Alaikum, Masaar Holidays.\n\nI am interested in Madinah Ziyarah arrangements.\n\nName:\nTravel date:\nNumber of travellers:\nPreferred arrangement: {{service_option}}\nPickup location:\nSpecial requirements:\n\nPlease share the available options and quotation.{{package_ref}}{{url_ref}}",

  // 4. Private Tours enquiry
  privateToursEnquiry:
    "Assalamu Alaikum, Masaar Holidays.\n\nI would like to enquire about a private tour.\n\nName:\nTravel date:\nNumber of travellers:\nPreferred destination: {{city}}\nPreferred duration: {{duration}}\nPickup location:\nSpecial requests:\n\nPlease contact me with the available arrangements.{{package_ref}}{{url_ref}}",

  // 5. Wheelchair Assistance enquiry
  wheelchairAssistanceEnquiry:
    "Assalamu Alaikum, Masaar Holidays.\n\nI would like to enquire about wheelchair assistance during my pilgrimage.\n\nName:\nTravel date:\nNumber of travellers:\nCity required: {{city}}\nType of assistance required: {{service_option}}\nAdditional information:\n\nPlease share the arrangements and availability.{{package_ref}}{{url_ref}}",

  // 6. Private Transport enquiry
  privateTransportEnquiry:
    "Assalamu Alaikum, Masaar Holidays.\n\nI would like to enquire about private transportation.\n\nName:\nTravel date:\nNumber of passengers:\nPickup location:\nDestination: {{city}}\nVehicle preference: {{service_option}}\nLuggage requirements:\n\nPlease provide the available options and quotation.{{package_ref}}{{url_ref}}",

  // 7. General Additional Services enquiry
  additionalServicesGeneral:
    "Assalamu Alaikum, Masaar Holidays.\n\nI would like to enquire about additional services for my Umrah journey.\n\nName:\nTravel date:\nNumber of travellers:\nServices interested in: {{service_name}}\nAdditional requirements:\n\nPlease guide me with the available options.{{package_ref}}{{url_ref}}",
};

/**
 * Replaces {{token}} in a template with params[token].
 * Preserves unmatched tokens if no substitution is provided.
 */
export function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(params, token) ? (params[token] ?? match) : match
  );
}

export interface AdditionalServiceEnquiryParams {
  service_name?: string;
  service_url?: string;
  package_name?: string;
  city?: string;
  service_option?: string;
  duration?: string;
  [key: string]: string | undefined;
}

/**
 * Builds the fully interpolated message text for an additional service enquiry,
 * cleanly handling prompt-prescribed fallback strings for empty variables and
 * formatting optional package/URL references.
 */
export function buildServiceWhatsAppMessage(
  templateText: string,
  params?: AdditionalServiceEnquiryParams
): string {
  const safeParams: Record<string, string> = {
    service_name: params?.service_name ?? "",
    service_url: params?.service_url ?? "",
    package_name: params?.package_name ?? "",
    // Fallback defaults matching prompt Section B exactly when city/option are not pre-selected
    city: params?.city?.trim() ? params.city.trim() : "Makkah / Madinah / Both",
    service_option: params?.service_option?.trim()
      ? params.service_option.trim()
      : templateText.includes("Preferred arrangement:")
        ? "Private / Group / Need guidance"
        : "",
    duration: params?.duration ?? "",
    package_ref: params?.package_name ? `\n\nPackage: ${params.package_name}` : "",
    url_ref: params?.service_url ? `\nReference: ${params.service_url}` : "",
  };

  // If the template does not have {{city}}, {{service_name}}, etc. in it,
  // interpolate will simply ignore extra safeParams safely.
  let message = interpolate(templateText, safeParams);

  // Clean up any trailing double newlines before punctuation
  message = message.replace(/\n{3,}/g, "\n\n").trim();

  return message;
}

/**
 * Resolves the appropriate template key for a service slug.
 */
export function getServiceTemplateKey(serviceSlug?: string | null): WhatsAppTemplateKey {
  if (!serviceSlug) return "additionalServicesGeneral";
  return DEFAULT_SERVICE_SLUG_TO_KEY[serviceSlug] || "additionalServicesGeneral";
}

/**
 * Directly builds a service-specific WhatsApp link (`https://wa.me/...`)
 * without requiring client-side React hooks (ideal for Server Components).
 */
export function buildServiceWhatsAppUrl(
  serviceSlugOrKey: string,
  params?: AdditionalServiceEnquiryParams,
  options?: {
    customTemplates?: Record<string, string>;
    phoneNumber?: string;
    slugToKeyMap?: Record<string, string>;
  }
): string {
  const phone = options?.phoneNumber || WHATSAPP_DEFAULT_PHONE;

  // Resolve key from slug if needed
  let key: string = serviceSlugOrKey;
  if (options?.slugToKeyMap && options.slugToKeyMap[serviceSlugOrKey]) {
    key = options.slugToKeyMap[serviceSlugOrKey];
  } else if (DEFAULT_SERVICE_SLUG_TO_KEY[serviceSlugOrKey]) {
    key = DEFAULT_SERVICE_SLUG_TO_KEY[serviceSlugOrKey];
  }

  const rawTemplate =
    options?.customTemplates?.[key] ||
    WHATSAPP_TEMPLATE_DEFAULTS[key as WhatsAppTemplateKey] ||
    WHATSAPP_TEMPLATE_DEFAULTS.additionalServicesGeneral;

  const finalMessage = buildServiceWhatsAppMessage(rawTemplate, params);
  return `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;
}

/**
 * Initial complete fallback rows representing all templates for seeding and admin editor fallbacks.
 */
export const INITIAL_WHATSAPP_TEMPLATES: WhatsAppTemplateRow[] = [
  {
    id: "tmpl-001",
    key: "general",
    label: "General Enquiry (header, home, footer, floating button)",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.general,
    placeholders: [],
    is_active: true,
    display_order: 1,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-002",
    key: "packageEnquiry",
    label: "Package Enquiry (Umrah & Hajj cards)",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.packageEnquiry,
    placeholders: ["packageTitle", "tier", "duration"],
    is_active: true,
    display_order: 2,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-003",
    key: "privateTripEnquiry",
    label: "Private Trip Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.privateTripEnquiry,
    placeholders: ["tripName", "destination", "duration"],
    is_active: true,
    display_order: 3,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-004",
    key: "hotel",
    label: "Hotel — General Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.hotel,
    placeholders: ["hotelName"],
    is_active: true,
    display_order: 4,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-005",
    key: "transfer",
    label: "Transfers — Route Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.transfer,
    placeholders: ["route"],
    is_active: true,
    display_order: 5,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-006",
    key: "visa",
    label: "Visa — Type Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.visa,
    placeholders: ["visaType"],
    is_active: true,
    display_order: 6,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-007",
    key: "contact",
    label: "Contact Page — WhatsApp CTA",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.contact,
    placeholders: [],
    is_active: true,
    display_order: 7,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Phase 7 Service Enquiry Templates
  {
    id: "tmpl-020",
    key: "umrahGuideEnquiry",
    label: "Umrah Guide Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.umrahGuideEnquiry,
    placeholders: ["city", "service_option", "package_name", "service_url"],
    is_active: true,
    display_order: 20,
    assigned_service_slug: "umrah-guide",
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-021",
    key: "makkahZiyarahEnquiry",
    label: "Makkah Ziyarah Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.makkahZiyarahEnquiry,
    placeholders: ["service_option", "package_name", "service_url"],
    is_active: true,
    display_order: 21,
    assigned_service_slug: "makkah-ziyarah",
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-022",
    key: "madinahZiyarahEnquiry",
    label: "Madinah Ziyarah Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.madinahZiyarahEnquiry,
    placeholders: ["service_option", "package_name", "service_url"],
    is_active: true,
    display_order: 22,
    assigned_service_slug: "madinah-ziyarah",
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-023",
    key: "privateToursEnquiry",
    label: "Private Tours Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.privateToursEnquiry,
    placeholders: ["city", "duration", "package_name", "service_url"],
    is_active: true,
    display_order: 23,
    assigned_service_slug: "private-tours",
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-024",
    key: "wheelchairAssistanceEnquiry",
    label: "Wheelchair Assistance Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.wheelchairAssistanceEnquiry,
    placeholders: ["city", "service_option", "package_name", "service_url"],
    is_active: true,
    display_order: 24,
    assigned_service_slug: "wheelchair-assistance",
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-025",
    key: "privateTransportEnquiry",
    label: "Private Transport Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.privateTransportEnquiry,
    placeholders: ["city", "service_option", "package_name", "service_url"],
    is_active: true,
    display_order: 25,
    assigned_service_slug: "private-transport",
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tmpl-026",
    key: "additionalServicesGeneral",
    label: "General Additional Services Enquiry",
    template_text: WHATSAPP_TEMPLATE_DEFAULTS.additionalServicesGeneral,
    placeholders: ["service_name", "package_name", "service_url"],
    is_active: true,
    display_order: 26,
    assigned_service_slug: null,
    default_cta_text: "Enquire on WhatsApp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
