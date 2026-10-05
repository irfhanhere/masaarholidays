import type { PackageItineraryDay } from "@/lib/types/database";

export const CURATED_UMRAH_ITINERARIES: Record<string, PackageItineraryDay[]> = {
  // 4 Nights / 5 Days (2N Makkah + 2N Madinah)
  "4N / 5D": [
    {
      day: 1,
      title: "Arrival in Jeddah & Transfer to Makkah",
      items: [
        "Arrive at King Abdulaziz International Airport in Jeddah according to your flight schedule.",
        "Meet and greet by your dedicated private chauffeur, followed by private air-conditioned vehicle transfer to your hotel in Makkah.",
        "Check in, settle into your room, and proceed to Masjid Al-Haram to perform your Umrah rituals.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 2,
      title: "Makkah | Ibadah & Optional Ziyarat",
      items: [
        "Spend a peaceful day in Makkah dedicated to prayers, Tawaf, and reflection at Masjid Al-Haram.",
        "Guests may spend the day at their own pace or choose an optional private Makkah Ziyarat tour (Jabal Al-Noor, Cave of Hira, Jabal Thawr, Mina, Muzdalifah, and Arafat).",
        "Overnight: Makkah",
      ],
    },
    {
      day: 3,
      title: "Makkah to Madinah Transfer",
      items: [
        "After breakfast, check out from your Makkah hotel and travel by private vehicle across the blessed Hijrah route to Al-Madinah Al-Munawwarah.",
        "Upon arrival in Madinah, check in to your hotel and refresh.",
        "Spend the evening in peaceful contemplation and prayer at the Prophet's Mosque (Masjid an-Nabawi).",
        "Overnight: Madinah",
      ],
    },
    {
      day: 4,
      title: "Madinah — Masjid An-Nabawi & Rawdah Ziyarat",
      items: [
        "Full day for Ibadah at Masjid an-Nabawi, with opportunity to offer Salam at the Rawdah Sharif (subject to Nusuk permit).",
        "Optional guided private Madinah Ziyarat tour visiting Masjid Quba (first mosque in Islam), Mount Uhud and the Archers' Hill, and Masjid Al-Qiblatayn.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 5,
      title: "Departure from Madinah",
      items: [
        "Perform farewell prayers at Masjid an-Nabawi.",
        "Hotel check-out and private transfer to Prince Mohammad Bin Abdulaziz International Airport (Madinah Airport) for your return flight.",
        "End of your blessed Umrah journey with Masaar Holidays.",
      ],
    },
  ],

  // 5 Nights / 6 Days (3N Makkah + 2N Madinah) — Attachment 2 verbatim
  "5N / 6D": [
    {
      day: 1,
      title: "Arrival in Jeddah & Transfer to Makkah",
      items: [
        "Arrive at Jeddah International Airport according to your flight schedule. Our professional driver will meet you at the airport and provide a private transfer to your hotel in Makkah.",
        "Upon arrival, check in to your hotel and settle in. The remainder of the day is free for rest, prayers, and Ibadah at Masjid Al-Haram.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 2,
      title: "Makkah | Ibadah & Optional Ziyarat",
      items: [
        "Enjoy a peaceful day in Makkah dedicated to Ibadah and prayers at Masjid Al-Haram.",
        "Guests may spend the day at their own pace or choose an optional Makkah Ziyarat tour to explore important Islamic historical sites in and around the city.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 3,
      title: "Makkah | Free Day & Ibadah",
      items: [
        "Continue your spiritual journey with another day in Makkah. Spend your time in Ibadah, prayers, and personal reflection at Masjid Al-Haram.",
        "An optional Makkah Ziyarat tour can also be arranged for guests interested in visiting significant Islamic landmarks.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 4,
      title: "Makkah to Madinah Transfer & Optional Ziyarat",
      items: [
        "After breakfast, check out from your Makkah hotel and travel by private vehicle from Makkah to Madinah.",
        "The transfer can be arranged either after breakfast or after Zuhr prayer, according to your preference.",
        "Upon arrival in Madinah, check in to your hotel and spend the remainder of the day at leisure or in prayer at Masjid an-Nabawi.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 5,
      title: "Madinah — Masjid An-Nabawi & Optional Ziyarat",
      items: [
        "Spend the day in Madinah with time for prayers and Ibadah at Masjid an-Nabawi.",
        "Guests may also choose an optional Madinah Ziyarat tour to visit significant Islamic historical sites.",
        "You may also take the opportunity to pray at the Noble Rawdah, subject to availability and the required permit.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 6,
      title: "Departure",
      items: [
        "After breakfast, check out from the hotel according to your flight schedule.",
        "Our professional driver will provide a private transfer from your Madinah hotel to Madinah Airport for your onward flight.",
        "End of your blessed Umrah journey with Masaar Holidays.",
      ],
    },
  ],

  // 6 Nights / 7 Days (3N Makkah + 3N Madinah)
  "6N / 7D": [
    {
      day: 1,
      title: "Arrival in Jeddah & Transfer to Makkah",
      items: [
        "Arrive at King Abdulaziz International Airport in Jeddah according to your flight schedule. Private chauffeur transfer directly to your hotel in Makkah.",
        "Check-in, settle in, and perform your Umrah rituals at Masjid Al-Haram.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 2,
      title: "Makkah | Ibadah & Prayers at Masjid Al-Haram",
      items: [
        "A peaceful day dedicated to five daily prayers, personal supplication, and Ibadah inside the Holy Mosque.",
        "Optional guided historic tour of Makkah landmarks available on request.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 3,
      title: "Makkah | Free Day for Worship & Reflection",
      items: [
        "Enjoy an unhurried day in the Haram with ample time for Tawaf, Quran recitation, and family reflection.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 4,
      title: "Transfer to Madinah Al-Munawwarah",
      items: [
        "After breakfast, check out from your Makkah hotel. Your private chauffeur will drive you in comfort to Al-Madinah.",
        "Check in to your Madinah hotel, refresh, and visit Masjid an-Nabawi for Asr, Maghrib, and Isha prayers.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 5,
      title: "Madinah | Masjid an-Nabawi & Rawdah Sharif",
      items: [
        "Dedicated day for worship at the Prophet's Mosque and visiting the Rawdah Sharif (with permit).",
        "Optional morning private Ziyarat visiting Masjid Quba, Mount Uhud, and historical sites.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 6,
      title: "Madinah | Spiritual Reflection & City Visits",
      items: [
        "A serene day to immerse yourself in the tranquil atmosphere of Madinah and offer prayers in the Prophet's Mosque.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 7,
      title: "Departure from Madinah",
      items: [
        "Farewell prayers, hotel check-out, and private transfer to Madinah Airport for your flight home.",
        "End of your blessed pilgrimage with Masaar Holidays.",
      ],
    },
  ],

  // 7 Nights / 8 Days (4N Makkah + 3N Madinah)
  "7N / 8D": [
    {
      day: 1,
      title: "Arrival in Jeddah & Transfer to Makkah",
      items: [
        "Arrival at Jeddah Airport, airport greeting, and private transfer to your hotel in Makkah.",
        "Hotel check-in and performing Umrah at Masjid Al-Haram.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 2,
      title: "Makkah | Ibadah & Masjid Al-Haram",
      items: [
        "Full day of devotion, prayers, and reflection in the Grand Mosque.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 3,
      title: "Makkah | Optional Ziyarat Tour",
      items: [
        "Optional guided Ziyarat to the holy sites of Mina, Muzdalifah, Arafat, Jabal Al-Noor, and Jabal Thawr.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 4,
      title: "Makkah | Personal Worship & Relaxation",
      items: [
        "An unhurried day dedicated to spiritual reflection, Tawaf, and rest.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 5,
      title: "Makkah to Madinah Transfer",
      items: [
        "Check out from your Makkah hotel and travel via private vehicle to Madinah.",
        "Check in, unwind, and attend evening prayers at Masjid an-Nabawi.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 6,
      title: "Madinah | Rawdah Sharif & Ibadah",
      items: [
        "Prayers at Masjid an-Nabawi and visit to the Noble Rawdah (subject to Nusuk permit).",
        "Overnight: Madinah",
      ],
    },
    {
      day: 7,
      title: "Madinah | Historical Ziyarat & Leisure",
      items: [
        "Optional morning private Ziyarat visiting Quba Mosque, Mount Uhud, and date farms.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 8,
      title: "Departure from Madinah",
      items: [
        "Final prayers, hotel check-out, and private transfer to Madinah Airport for your departure flight.",
        "End of your blessed journey.",
      ],
    },
  ],

  // 8 Nights / 9 Days (4N Makkah + 4N Madinah)
  "8N / 9D": [
    {
      day: 1,
      title: "Arrival in Jeddah & Transfer to Makkah",
      items: [
        "Airport meet & greet in Jeddah followed by private transfer to Makkah hotel. Check-in and Umrah performance.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 2,
      title: "Makkah | Ibadah & Prayers",
      items: [
        "Day of prayers and contemplation at Masjid Al-Haram.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 3,
      title: "Makkah | Guided Ziyarat",
      items: [
        "Optional guided excursion to historical landmarks including Jabal Al-Noor, Cave of Hira, and Arafat.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 4,
      title: "Makkah | Free Day & Personal Worship",
      items: [
        "Spend time in personal devotion, Quran study, and extra Tawaf.",
        "Overnight: Makkah",
      ],
    },
    {
      day: 5,
      title: "Makkah to Madinah Transfer",
      items: [
        "Check out after breakfast and transfer via private air-conditioned vehicle to Madinah.",
        "Check in and perform prayers at the Prophet's Mosque.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 6,
      title: "Madinah | Rawdah Sharif & Prayers",
      items: [
        "Spiritual immersion at Masjid an-Nabawi and greeting our Beloved Prophet ﷺ at the Rawdah Sharif.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 7,
      title: "Madinah | Historical Ziyarat Excursion",
      items: [
        "Optional visit to Masjid Quba, Mount Uhud martyrs' cemetery, and Masjid Al-Qiblatayn.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 8,
      title: "Madinah | Leisure & Peace",
      items: [
        "Unhurried worship and tranquil contemplation in Madinah.",
        "Overnight: Madinah",
      ],
    },
    {
      day: 9,
      title: "Departure from Madinah",
      items: [
        "Check-out and private transfer to Madinah Airport for your flight back home.",
        "End of your blessed journey.",
      ],
    },
  ],

  // 9 Nights / 10 Days (5N Makkah + 4N Madinah)
  "9N / 10D": [
    {
      day: 1,
      title: "Arrival in Jeddah & Transfer to Makkah",
      items: ["Private airport transfer to Makkah hotel, check-in, and Umrah rituals at Masjid Al-Haram.", "Overnight: Makkah"],
    },
    {
      day: 2,
      title: "Makkah | Ibadah at Masjid Al-Haram",
      items: ["Devotion, prayers, and spiritual reflection.", "Overnight: Makkah"],
    },
    {
      day: 3,
      title: "Makkah | Historical Ziyarat",
      items: ["Optional tour of Jabal Al-Noor, Jabal Thawr, Mina, and Arafat.", "Overnight: Makkah"],
    },
    {
      day: 4,
      title: "Makkah | Worship & Extra Tawaf",
      items: ["Dedicated time for voluntary Tawaf and personal prayers.", "Overnight: Makkah"],
    },
    {
      day: 5,
      title: "Makkah | Final Full Day in Makkah",
      items: ["Spiritual reflection and prayer at the Holy Sanctuary.", "Overnight: Makkah"],
    },
    {
      day: 6,
      title: "Transfer from Makkah to Madinah",
      items: ["Private transfer to Madinah. Hotel check-in and evening prayers at Masjid an-Nabawi.", "Overnight: Madinah"],
    },
    {
      day: 7,
      title: "Madinah | Rawdah Sharif Visit",
      items: ["Prayers at Prophet's Mosque and Rawdah Sharif visit with permit.", "Overnight: Madinah"],
    },
    {
      day: 8,
      title: "Madinah | Historical Ziyarat",
      items: ["Optional visits to Quba Mosque, Mount Uhud, and historical sites.", "Overnight: Madinah"],
    },
    {
      day: 9,
      title: "Madinah | Quiet Reflection & Free Time",
      items: ["Peaceful day inside Masjid an-Nabawi and courtyard.", "Overnight: Madinah"],
    },
    {
      day: 10,
      title: "Departure from Madinah",
      items: ["Hotel check-out and private transfer to Madinah Airport for departure.", "End of journey."],
    },
  ],

  // 10 Nights / 11 Days (5N Makkah + 5N Madinah)
  "10N / 11D": [
    {
      day: 1,
      title: "Arrival in Jeddah & Transfer to Makkah",
      items: ["Private airport transfer to Makkah hotel, check-in, and Umrah rituals at Masjid Al-Haram.", "Overnight: Makkah"],
    },
    {
      day: 2,
      title: "Makkah | Ibadah at Masjid Al-Haram",
      items: ["Devotion, prayers, and spiritual reflection.", "Overnight: Makkah"],
    },
    {
      day: 3,
      title: "Makkah | Historical Ziyarat",
      items: ["Optional tour of Jabal Al-Noor, Jabal Thawr, Mina, and Arafat.", "Overnight: Makkah"],
    },
    {
      day: 4,
      title: "Makkah | Worship & Extra Tawaf",
      items: ["Dedicated time for voluntary Tawaf and personal prayers.", "Overnight: Makkah"],
    },
    {
      day: 5,
      title: "Makkah | Final Full Day in Makkah",
      items: ["Spiritual reflection and farewell Tawaf at the Holy Sanctuary.", "Overnight: Makkah"],
    },
    {
      day: 6,
      title: "Transfer from Makkah to Madinah",
      items: ["Private transfer to Madinah. Hotel check-in and evening prayers at Masjid an-Nabawi.", "Overnight: Madinah"],
    },
    {
      day: 7,
      title: "Madinah | Rawdah Sharif Visit",
      items: ["Prayers at Prophet's Mosque and Rawdah Sharif visit with permit.", "Overnight: Madinah"],
    },
    {
      day: 8,
      title: "Madinah | Historical Ziyarat",
      items: ["Optional visits to Quba Mosque, Mount Uhud, and historical sites.", "Overnight: Madinah"],
    },
    {
      day: 9,
      title: "Madinah | Worship & Study",
      items: ["Continuous Ibadah, Quran study, and peaceful courtyard reflection.", "Overnight: Madinah"],
    },
    {
      day: 10,
      title: "Madinah | Final Full Day in Madinah",
      items: ["Final prayers and offering Salam at the Prophet's Mosque.", "Overnight: Madinah"],
    },
    {
      day: 11,
      title: "Departure from Madinah",
      items: ["Hotel check-out and private transfer to Madinah Airport for departure.", "End of journey."],
    },
  ],
};

/**
 * Resolves a day-by-day itinerary for any duration key or nights number,
 * falling back gracefully to the curated itinerary dictionary if database
 * itinerary is empty or unpopulated.
 */
export function resolveUmrahItinerary(
  durationKey: string | number,
  dbItinerary?: PackageItineraryDay[] | null
): PackageItineraryDay[] {
  if (dbItinerary && Array.isArray(dbItinerary) && dbItinerary.length > 0) {
    return dbItinerary;
  }

  const strKey = String(durationKey);
  // Match key by standard label "5N / 6D" or "5 Nights"
  for (const [key, days] of Object.entries(CURATED_UMRAH_ITINERARIES)) {
    if (strKey.includes(key) || key.includes(strKey)) {
      return days;
    }
  }

  // Fallback by nights number if passed as number
  if (typeof durationKey === "number") {
    const key = `${durationKey}N / ${durationKey + 1}D`;
    if (CURATED_UMRAH_ITINERARIES[key]) {
      return CURATED_UMRAH_ITINERARIES[key];
    }
  }

  // Default to 5N / 6D
  return CURATED_UMRAH_ITINERARIES["5N / 6D"];
}
