import type { FaqRow } from "@/lib/types/database";

export const FALLBACK_FAQS: FaqRow[] = [
  // Umrah (6)
  {
    id: "faq-umrah-1",
    category: "umrah",
    question: "What's the difference between Essential, Signature and Exclusive Umrah packages?",
    answer:
      "All three packages receive the same standard of care. The difference is in accommodation, location, and convenience.\n\nEssential \u2013 Smart & Comfortable: A budget-conscious option for younger travellers, with comfortable accommodation and shuttle service.\n\nSignature \u2013 Comfort & Convenience: Suitable for all age groups, with hotels located just a few steps from the Haram.\n\nExclusive \u2013 Premium & Private: Designed for those seeking greater comfort and convenience, particularly parents, elderly travellers, and pilgrims requiring additional assistance. Selected accommodation is within the Haram Plaza area, approximately 1\u20134 minutes from the Haram.",
    display_order: 1,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-umrah-2",
    category: "umrah",
    question: "Can I customize my Umrah journey?",
    answer:
      "Absolutely. Tell us who you're travelling with \u2014 parents, children, as a couple, or as a group \u2014 along with your dates and preferences. We'll tailor the journey around your needs.",
    display_order: 2,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-umrah-3",
    category: "umrah",
    question: "What is included in an Umrah package?",
    answer:
      "Our standard Umrah packages include hotel accommodation, airport pick-up and drop-off, private transportation, Makkah\u2013Madinah transfers, and a qualified Umrah guide. Flights and Ziyarat can be added separately on request.",
    display_order: 3,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-umrah-4",
    category: "umrah",
    question: "Are flights included in the Umrah packages?",
    answer:
      "Flights are not included in the standard packages. We can arrange and add flights to your journey upon request.",
    display_order: 4,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-umrah-5",
    category: "umrah",
    question: "Can I request specific rooms or views?",
    answer:
      "Yes. You can request connecting or family rooms, as well as specific views such as Haram View or Kaaba View. All requests are subject to availability.",
    display_order: 5,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-umrah-6",
    category: "umrah",
    question: "How far in advance should I plan my Umrah?",
    answer:
      "We recommend planning as early as possible, particularly during peak periods, to secure your preferred hotels, room types, and travel dates.",
    display_order: 6,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Hajj (6)
  {
    id: "faq-hajj-1",
    category: "hajj",
    question: "Does Masaar guarantee Hajj visas or quota allocations?",
    answer:
      "Hajj visas and quota allocations are subject to official availability and confirmation. We do not guarantee a Hajj place, visa, or quota unless it is explicitly confirmed for your booking.",
    display_order: 1,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hajj-2",
    category: "hajj",
    question: "How is Hajj availability confirmed?",
    answer:
      "Hajj availability is limited and seasonal. Each enquiry is reviewed individually, and our team will confirm the available options for the current Hajj season.",
    display_order: 2,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hajj-3",
    category: "hajj",
    question: "What's included in the Hajj package tiers?",
    answer:
      "Our Essential, Signature, and Exclusive packages include accommodation, transportation, and pilgrimage support, with the level of comfort, proximity, and services varying by tier.",
    display_order: 3,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hajj-4",
    category: "hajj",
    question: "How early should I register my interest for Hajj?",
    answer:
      "We recommend registering as early as possible. Hajj availability is limited and confirmed season by season.",
    display_order: 4,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hajj-5",
    category: "hajj",
    question: "Does accommodation location vary between Hajj packages?",
    answer:
      "Yes. Accommodation location and proximity to the holy sites vary by package tier. We'll confirm the available options for your chosen package.",
    display_order: 5,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hajj-6",
    category: "hajj",
    question: "What if my preferred dates or package are unavailable?",
    answer:
      "We'll proactively explore alternative dates, accommodation, and package options to find the most suitable arrangement for your journey.",
    display_order: 6,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Hotels (6)
  {
    id: "faq-hotels-1",
    category: "hotels",
    question: "How does Masaar select its hotels?",
    answer:
      "We select hotels based on location, comfort, service standards, and proximity to the Haram \u2014 not simply on price.",
    display_order: 1,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hotels-2",
    category: "hotels",
    question: "Are hotel prices shown per night or for the full stay?",
    answer:
      "Prices shown are per room, per night. Your total will depend on your dates, room type, and length of stay.",
    display_order: 2,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hotels-3",
    category: "hotels",
    question: "Can I request a hotel that isn't listed?",
    answer:
      "Yes. Share your preferred hotel with us and we'll check availability and the best available rate.",
    display_order: 3,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hotels-4",
    category: "hotels",
    question: "How do I know how close a hotel is to the Haram?",
    answer:
      "Each hotel listing shows its approximate walking distance, route type, and terrain to the Haram, helping you choose based on the level of convenience you prefer.",
    display_order: 4,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hotels-5",
    category: "hotels",
    question: "Can I book a hotel separately from an Umrah or Hajj package?",
    answer:
      "Yes. Hotels can be arranged as part of your pilgrimage journey or booked separately.",
    display_order: 5,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-hotels-6",
    category: "hotels",
    question: "What if my selected hotel is unavailable?",
    answer:
      "We'll recommend a suitable alternative based on location, quality, and your preferences, and confirm the price before proceeding.",
    display_order: 6,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Visa (6)
  {
    id: "faq-visa-1",
    category: "visa",
    question: "What visa services does Masaar provide?",
    answer:
      "We assist with Umrah and travel visas for Saudi Arabia and the UAE. We'll guide you towards the appropriate visa based on your travel plans.",
    display_order: 1,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-visa-2",
    category: "visa",
    question: "Can Masaar guarantee visa approval?",
    answer:
      "Visa approval is subject to the relevant authorities. We handle the application process and guide you through the required documentation.",
    display_order: 2,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-visa-3",
    category: "visa",
    question: "How long does visa processing take?",
    answer:
      "Processing times vary by visa type, nationality, and current authority requirements. We'll confirm the latest expected processing time when you enquire.",
    display_order: 3,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-visa-4",
    category: "visa",
    question: "What documents do I need?",
    answer:
      "Requirements vary by visa type. For UAE residents, requirements may include a passport valid for at least 6 months, a UAE residence visa valid for at least 3 months, a recent white-background photograph, and a copy of the UAE residence visa. Additional documents may be required depending on the visa.",
    display_order: 4,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-visa-5",
    category: "visa",
    question: "Do visa requirements differ by nationality?",
    answer:
      "Yes. Visa requirements, processing times, and fees can vary by nationality and visa type. We'll confirm the applicable requirements for your application.",
    display_order: 5,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-visa-6",
    category: "visa",
    question: "Are visa fees included in package prices?",
    answer:
      "Visa fees are separate unless specifically included in your selected package. We'll clearly confirm what is included before you proceed.",
    display_order: 6,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Transfers (5)
  {
    id: "faq-transfers-1",
    category: "transfers",
    question: "What types of vehicles are available?",
    answer:
      "We arrange private vehicles ranging from comfortable sedans to larger vehicles for families and groups. The vehicle is selected according to your group size and requirements.",
    display_order: 1,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-transfers-2",
    category: "transfers",
    question: "Can you arrange transfers for large families or groups?",
    answer:
      "Yes. We arrange private transfers for families and groups of different sizes, including multi-generational families travelling together.",
    display_order: 2,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-transfers-3",
    category: "transfers",
    question: "Are transfers included in Umrah and Hajj packages?",
    answer:
      "Transfers included in your package depend on the selected package. Additional private transfers can also be arranged separately.",
    display_order: 3,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-transfers-4",
    category: "transfers",
    question: "Can I add private day trips to my journey?",
    answer:
      "Yes. Private day trips such as Jeddah\u2013Taif and Makkah\u2013Taif can be arranged as part of your itinerary.",
    display_order: 4,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-transfers-5",
    category: "transfers",
    question: "What happens if my flight is delayed?",
    answer:
      "If your flight is delayed, contact our team as soon as possible. We'll coordinate with the transfer provider and adjust the pick-up time where possible.",
    display_order: 5,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // General (8)
  {
    id: "faq-general-1",
    category: "general",
    question: "What does Masaar Holidays do?",
    answer:
      "Masaar Holidays creates and arranges bespoke Umrah, Hajj, and premium travel journeys, bringing together accommodation, private transfers, visa assistance, and carefully selected travel experiences.",
    display_order: 1,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-general-2",
    category: "general",
    question: "Why choose Masaar instead of booking everything separately?",
    answer:
      "We bring the journey together around you \u2014 coordinating accommodation, transportation, visas, and other arrangements so you have one team managing the details.",
    display_order: 2,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-general-3",
    category: "general",
    question: "Do you only serve UAE-based travellers?",
    answer:
      "Our primary market is the UAE, but we also assist travellers from other countries. Contact our team to discuss your requirements.",
    display_order: 3,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-general-4",
    category: "general",
    question: "How do I get a personalized quote?",
    answer:
      "Message us on WhatsApp with your travel dates, number of travellers, who you're travelling with, and your preferences. We'll recommend suitable options for your journey.",
    display_order: 4,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-general-5",
    category: "general",
    question: "Can I make changes after my booking is confirmed?",
    answer:
      "Yes. Contact us as early as possible if your plans change. We'll review what can be adjusted based on supplier and booking conditions.",
    display_order: 5,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-general-6",
    category: "general",
    question: "Will I have support during my journey?",
    answer:
      "Yes. Our team remains reachable on WhatsApp throughout your journey for assistance with your arrangements.",
    display_order: 6,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-general-7",
    category: "general",
    question: "Can I pay through the website?",
    answer:
      "Bookings are confirmed directly with our team. Payment options and instructions will be provided during the booking process.",
    display_order: 7,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "faq-general-8",
    category: "general",
    question: "What is your cancellation policy?",
    answer:
      "Cancellation terms depend on the hotels, airlines, transport providers, visas, and other services included in your booking. We'll provide the applicable terms before confirmation.",
    display_order: 8,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];