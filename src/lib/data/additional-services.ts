import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AdditionalServiceRow } from "@/lib/types/database";

export const INITIAL_ADDITIONAL_SERVICES: AdditionalServiceRow[] = [
  {
    id: "serv-001",
    name: "Umrah Guide",
    slug: "umrah-guide",
    category: "Spiritual Guidance",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    hero_headline: "Your Umrah Journey, Guided with Care",
    hero_subtext:
      "Personal guidance and practical assistance to help you understand and complete the essential stages of Umrah with clarity and confidence.",
    meta_title: "Umrah Guide in Makkah & Madinah | Masaar Holidays",
    meta_description:
      "Get practical Umrah guidance and assistance with Ihram, Tawaf and Sa'i. Enquire about arranging an Umrah Guide with Masaar Holidays.",
    short_description:
      "Personal guidance and practical assistance to help you understand and complete the essential stages of Umrah with clarity and confidence.",
    full_description:
      "At Masaar Holidays, we believe every Umrah journey deserves thoughtful guidance, personal attention and spiritual comfort. Our dedicated Umrah Guide service is designed to help pilgrims experience each stage of their sacred journey with confidence and understanding.",
    image_url: "/services/umrah-guide.webp",
    icon: "users",
    features: [
      "Assistance with preparing for Ihram and entering the sacred state",
      "Clear explanation and step-by-step guidance for Tawaf around the Kaaba",
      "Walking accompaniment and practical pacing during Sa'i between Safa and Marwa",
      "Insightful explanations of essential traditions, history and rituals",
    ],
    expectations: [
      {
        title: "Step-by-Step Ritual Assistance",
        description:
          "Receive guidance throughout Ihram, Tawaf, Sa'i and other essential Umrah rituals.",
      },
      {
        title: "Spiritual Knowledge & Understanding",
        description:
          "Discover the significance of the rituals and gain a deeper appreciation of your journey.",
      },
      {
        title: "Personalised Attention",
        description:
          "Suitable for individuals, families and groups, with support tailored to your needs.",
      },
      {
        title: "A Smooth and Comfortable Experience",
        description:
          "Focus on your prayers and worship while we help make the arrangements easier.",
      },
    ],
    why_choose: [
      {
        title: "Experienced Guidance",
        description:
          "Learn about every ritual with clear explanations and practical assistance.",
      },
      {
        title: "Meaningful Insights",
        description:
          "Understand the spiritual significance and history behind the rites of Umrah.",
      },
      {
        title: "Individual Attention",
        description:
          "Guidance designed to accommodate individuals, families and groups.",
      },
      {
        title: "Peace of Mind",
        description:
          "Enjoy a more organised pilgrimage with support at every key stage.",
      },
    ],
    faqs: [
      {
        q: "Will the guide explain all the Umrah rituals?",
        a: "Our Umrah Guide service is designed to provide clear explanations of essential rituals and practical guidance.",
      },
      {
        q: "Will the guide accompany me during Tawaf and Sa'i?",
        a: "Assistance and accompaniment can be arranged according to the confirmed service scope.",
      },
      {
        q: "Can I arrange an Umrah Guide before my travel date?",
        a: "Advance enquiries are recommended so arrangements can be discussed before travel.",
      },
    ],
    tour_info: {
      availability: "Arranged according to confirmed schedule",
      important_reminder:
        "Please confirm ritual schedules and meeting arrangements in advance with your advisor.",
    },
    pdf_url: null,
    is_featured: true,
    status: "published",
    display_order: 1,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-002",
    name: "Wheelchair Assistance",
    slug: "wheelchair-assistance",
    category: "Mobility Support",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Comfort and mobility support for elderly and physically challenged pilgrims.",
    full_description:
      "Ensure your elderly or physically challenged family members complete their pilgrimage with absolute dignity, ease, and comfort. Our dedicated wheelchair assistants provide patient, reliable accompaniment across Tawaf, Sa'i, and prayer areas.",
    image_url: "/services/wheelchair-assistance.webp",
    icon: "wheelchair",
    features: [
      "Dedicated personal attendant throughout rites",
      "Smooth navigation through accessible Haram gates & ramps",
      "Patient pacing tailored to senior pilgrims",
      "Available in both Makkah and Madinah",
    ],
    is_featured: true,
    status: "published",
    display_order: 2,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-003",
    name: "Makkah Ziyarah",
    slug: "makkah-ziyarah",
    category: "Ziyarah Tours",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Visit significant places around Makkah, including Jabal Al Nour, Jabal Thawr, Mina, Muzdalifah and Arafat.",
    full_description:
      "Deepen your connection to Islamic history with a curated private tour of Makkah's most sacred landmarks. Travel in air-conditioned comfort accompanied by a knowledgeable local guide.",
    image_url: "/services/makkah-ziyarah.webp",
    icon: "mountain",
    features: [
      "Visits to Jabal Al Nour (Cave of Hira) & Jabal Thawr",
      "Guided exploration of Mina, Muzdalifah & Plain of Arafat",
      "Private air-conditioned vehicle with hotel pick-up",
      "Licensed bilingual guide sharing rich historical insights",
    ],
    is_featured: true,
    status: "published",
    display_order: 3,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-004",
    name: "Madinah Ziyarah",
    slug: "madinah-ziyarah",
    category: "Ziyarah Tours",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "A guided visit to key sites in Madinah, such as Mount Uhud, Masjid Quba and Garden Salman Farsi.",
    full_description:
      "Explore the tranquil history of the Prophet's City. Visit the first mosque in Islam, honour the martyrs of Uhud, and experience the timeless heritage of Madinah Al-Munawwarah.",
    image_url: "/services/madinah-ziyarah.webp",
    icon: "mosque",
    features: [
      "Masjid Quba & Mount Uhud (Archers' Hill)",
      "Masjid Al-Qiblatain & Seven Mosques",
      "Garden of Salman Al-Farsi date palms",
      "Flexible pacing for quiet reflection and prayers",
    ],
    is_featured: true,
    status: "published",
    display_order: 4,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-005",
    name: "Private Transport",
    slug: "private-transport",
    category: "Transport",
    price_type: "from",
    price_aed: 350,
    currency: "AED",
    short_description: "Convenient and reliable transfers for airports, hotels and intercity travel in Saudi Arabia.",
    full_description:
      "Seamless private chauffeur mobility between Jeddah Airport, Makkah hotels, Madinah hotels, and Haramain high-speed train stations in executive sedans, GMC Yukons, and luxury passenger vans.",
    image_url: "/services/private-transport.webp",
    icon: "car",
    features: [
      "Flight monitoring and airport meet-and-greet",
      "Spacious vehicles for families and generous luggage",
      "Courteous, licensed professional drivers",
      "Direct door-to-door transfer without waiting",
    ],
    is_featured: true,
    status: "published",
    display_order: 5,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-006",
    name: "Private Tours",
    slug: "private-tours",
    category: "Ziyarah Tours",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Personalised tours and cultural experiences in Makkah, Madinah and surrounding areas.",
    full_description:
      "Bespoke historical and cultural journeys tailored completely to your schedule, interests, and family preferences, including trips to Taif, Badar, and hidden heritage sites.",
    image_url: "/services/private-tours.webp",
    icon: "map-pin",
    features: [
      "Completely customisable itineraries and timing",
      "Visits to Taif rose factories and mountain lookouts",
      "Private luxury vehicle with dedicated concierge",
      "Tailored for families, seniors, and private delegations",
    ],
    is_featured: true,
    status: "published",
    display_order: 6,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  // 6 Drafts
  {
    id: "serv-007",
    name: "Tour Guide for Sightseeing",
    slug: "tour-guide-sightseeing",
    category: "Spiritual Guidance",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Professional licensed tour guides providing deep historical commentary across major Islamic landmarks.",
    full_description:
      "Enrich your pilgrimage with comprehensive scholarly insight into the historical events that unfolded across the Two Holy Sanctuaries.",
    image_url: "/brand/banners/umrah.webp",
    icon: "users",
    features: ["Scholarly commentary", "Bilingual guides", "Tailored group sessions"],
    is_featured: false,
    status: "published",
    display_order: 7,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-008",
    name: "Walking Tour Guide",
    slug: "walking-tour-guide",
    category: "Spiritual Guidance",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Intimate walking tours exploring historical mosques and cultural heritage around the holy courtyards.",
    full_description:
      "Experience intimate walking narratives covering the immediate surroundings of Al-Masjid Al-Haram and Al-Masjid An-Nabawi.",
    image_url: "/trips/stop-madinah-mount-rumah.webp",
    icon: "map-pin",
    features: ["Step-free curated routes", "Hidden historical sites", "Small private parties"],
    is_featured: false,
    status: "draft",
    display_order: 8,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-009",
    name: "Family Photography",
    slug: "family-photography",
    category: "Special Assistance",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Discreet, professional family photography capturing sacred memories outside the mosque perimeters.",
    full_description:
      "Capture timeless family memories in traditional pilgrim attire against picturesque desert, mountain, and city backdrops outside the restricted prayer areas.",
    image_url: "/brand/banners/umrah.webp",
    icon: "camera",
    features: ["High-resolution edited digital gallery", "Discreet, culturally respectful photographers", "Flexible family scheduling"],
    is_featured: false,
    status: "draft",
    display_order: 9,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-010",
    name: "Luggage Assistance",
    slug: "luggage-assistance",
    category: "Special Assistance",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Dedicated baggage handling and luggage transfer support between hotels and intercity transit points.",
    full_description:
      "Travel light and stress-free while our logistical support team handles baggage loading, intercity transit, and check-in porterage.",
    image_url: "/brand/Explore cards/explore-transfers.jpg",
    icon: "luggage",
    features: ["Door-to-door luggage handling", "Zamzam water container protection", "Train station porter coordination"],
    is_featured: false,
    status: "draft",
    display_order: 10,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-011",
    name: "Child Seat",
    slug: "child-seat",
    category: "Transport",
    price_type: "fixed",
    price_aed: 100,
    currency: "AED",
    short_description: "Certified age-appropriate infant and child safety car seats fitted into private transfer vehicles.",
    full_description:
      "Ensure the safety and comfort of your little ones during long desert highways and intercity transfers between Jeddah, Makkah, and Madinah.",
    image_url: "/vehicles/hyundai-staria.webp",
    icon: "baby",
    features: ["ECE R44/04 compliant seats", "Pre-installed before airport pickup", "Sanitised and inspected before every trip"],
    is_featured: false,
    status: "draft",
    display_order: 11,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
  {
    id: "serv-012",
    name: "Other Approved Additional Services",
    slug: "other-additional-services",
    category: "Other Services",
    price_type: "on_request",
    price_aed: null,
    currency: "AED",
    short_description: "Custom requests, special accessibility arrangements, and bespoke pilgrimage add-ons.",
    full_description:
      "Have a unique requirement or bespoke arrangement? Masaar Holidays concierge will coordinate directly to accommodate your specific wishes.",
    image_url: "/brand/banners/umrah.webp",
    icon: "star",
    features: ["Dedicated VIP coordinator", "Custom quotes within 2 hours", "Bespoke concierge fulfillment"],
    is_featured: false,
    status: "draft",
    display_order: 12,
    created_at: "2026-11-10T00:00:00.000Z",
    updated_at: "2026-11-10T00:00:00.000Z",
  },
];

/**
 * Fetches services to display on the Homepage:
 * Only published and homepage-featured (is_featured = true) services, sorted by display_order.
 */
export async function getHomepageAdditionalServices(): Promise<AdditionalServiceRow[]> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("status", "published")
        .eq("is_featured", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        return data as AdditionalServiceRow[];
      }
    }
  } catch (err) {
    console.warn("Could not load from additional_services table, falling back to seed catalogue:", err);
  }

  // Graceful fallback to initial published & featured services
  return INITIAL_ADDITIONAL_SERVICES.filter((s) => s.status === "published" && s.is_featured);
}

/**
 * Fetches all published services for the /additional-services listing page.
 */
export async function getAllPublishedAdditionalServices(): Promise<AdditionalServiceRow[]> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as AdditionalServiceRow[];
      }
    }
  } catch (err) {
    console.warn("Could not load all additional services, falling back:", err);
  }

  return INITIAL_ADDITIONAL_SERVICES.filter((s) => s.status === "published");
}

/**
 * Fetches a single service by slug.
 */
export async function getAdditionalServiceBySlug(slug: string): Promise<AdditionalServiceRow | null> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return data as AdditionalServiceRow;
      }
    }
  } catch (err) {
    console.warn("Could not load service by slug, falling back:", err);
  }

  return INITIAL_ADDITIONAL_SERVICES.find((s) => s.slug === slug) ?? null;
}

