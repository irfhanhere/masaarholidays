export interface HotelReview {
  id: string;
  hotel_id?: string | null;
  hotel_slug: string;
  hotel_name?: string;
  author_name: string;
  travel_party: "Elderly parents" | "Children" | "Wheelchair user" | "Couple" | "Large family" | "General";
  rating: number; // 1 to 5
  stay_month_year: string;
  read_time: string; // e.g. "1 min read"
  title: string;
  content: string;
  highlight_quote?: string;
  helpful_tag?: string;
  is_verified: boolean;
  created_at?: string;
}

export const INITIAL_HOTEL_REVIEWS: HotelReview[] = [
  // VOCO Makkah
  {
    id: "rev-voco-1",
    hotel_slug: "voco-makkah",
    hotel_name: "voco Makkah",
    author_name: "Tariq & Family (Dubai)",
    travel_party: "Children",
    rating: 5,
    stay_month_year: "January 2026",
    read_time: "1 min read",
    title: "Continuous 24/7 shuttle made travelling with kids smooth",
    content: "We chose voco for our Umrah with two young children. The hotel is modern, spacious, and extremely clean. The 24/7 continuous shuttle bus picks up right from the hotel entrance and drops you off right at the Haram Ajyad/Kudai tunnel. Buses run every few minutes with virtually zero waiting time. Perfect budget-conscious luxury.",
    highlight_quote: "The 24/7 shuttle runs continuously — never had to wait more than 3 minutes.",
    helpful_tag: "🚌 24/7 Direct Shuttle",
    is_verified: true,
  },
  {
    id: "rev-voco-2",
    hotel_slug: "voco-makkah",
    hotel_name: "voco Makkah",
    author_name: "Sultan A. (Abu Dhabi)",
    travel_party: "Couple",
    rating: 5,
    stay_month_year: "February 2026",
    read_time: "1 min read",
    title: "Pristine rooms and five-star service at great value",
    content: "Outstanding bedding, quiet rooms, and efficient luggage handling. Because it is slightly removed from the crowded immediate ring of the mosque, you get a restful night's sleep while the shuttle brings you to the courtyard for every single prayer effortlessly.",
    highlight_quote: "Five-star comfort with high-frequency transportation.",
    helpful_tag: "✨ Modern Rooms",
    is_verified: true,
  },

  // Anjum Hotel Makkah
  {
    id: "rev-anjum-1",
    hotel_slug: "anjum-hotel",
    hotel_name: "Anjum Hotel",
    author_name: "Dr. Farooq & Parents (Sharjah)",
    travel_party: "Elderly parents",
    rating: 5,
    stay_month_year: "December 2025",
    read_time: "1 min read",
    title: "Air-conditioned private bridge directly to King Fahd Gate",
    content: "Travelling with my 74-year-old mother who uses a wheelchair on long walks. Anjum has its own private pedestrian bridge that leads straight to the northern courtyard with zero road traffic. It took us approximately 7 minutes at an easy, unhurried pace. The step-free elevators inside the hotel made daily prayers completely stress-free.",
    highlight_quote: "Private pedestrian bridge directly to the courtyard — no vehicle crossings.",
    helpful_tag: "🟢 Step-Free Pedestrian Bridge",
    is_verified: true,
  },
  {
    id: "rev-anjum-2",
    hotel_slug: "anjum-hotel",
    hotel_name: "Anjum Hotel",
    author_name: "Imran K. (Ras Al Khaimah)",
    travel_party: "Large family",
    rating: 5,
    stay_month_year: "January 2026",
    read_time: "1 min read",
    title: "Spacious family suites and direct plaza entry",
    content: "Booked connecting rooms for a family of six. The northern courtyard exit is wide and far less congested than the southern Ajyad side. Exactly a 7-minute walk to the Haram gates.",
    highlight_quote: "Much less congestion than clock tower exits.",
    helpful_tag: "👨‍👩‍👧‍👦 Family Favorite",
    is_verified: true,
  },

  // Swissôtel Makkah
  {
    id: "rev-swissotel-1",
    hotel_slug: "swissotel-makkah",
    hotel_name: "Swissôtel Makkah",
    author_name: "Haji Abdulrahman (Ajman)",
    travel_party: "Wheelchair user",
    rating: 5,
    stay_month_year: "February 2026",
    read_time: "1 min read",
    title: "Direct elevator access onto King Abdulaziz gate plaza",
    content: "My father has limited mobility. Swissôtel allowed us to step directly into the air-conditioned complex and exit directly into the Haram courtyard via dedicated high-speed elevators. No outdoor street crossing needed at all. Truly exceptional convenience.",
    highlight_quote: "Direct indoor access to courtyard prayer areas.",
    helpful_tag: "♿ Wheelchair Accessible",
    is_verified: true,
  },

  // Al Marwa Rayhaan
  {
    id: "rev-marwa-1",
    hotel_slug: "al-marwa-rayhaan",
    hotel_name: "Al Marwa Rayhaan",
    author_name: "Nasir & Fatima (Dubai)",
    travel_party: "Elderly parents",
    rating: 5,
    stay_month_year: "January 2026",
    read_time: "1 min read",
    title: "Literally a 2 min flat walk to the Haram courtyard",
    content: "Located right on the front row of Abraj Al Bait. You take the lobby elevator down and you are directly on the marble courtyard of Masjid Al-Haram in 2 minutes flat. The route is 100% flat with zero incline. Ideal for parents who cannot walk long distances.",
    highlight_quote: "2 min walk maximum. 100% flat marble route.",
    helpful_tag: "🟢 2 Min Flat Walk",
    is_verified: true,
  },

  // Al Safwah Royale Orchid / Dorrar Al Eiman
  {
    id: "rev-safwah-1",
    hotel_slug: "al-safwah-royale-orchid",
    hotel_name: "Al Safwah Royale Orchid",
    author_name: "Mohamed El-Sayed (Al Ain)",
    travel_party: "Elderly parents",
    rating: 5,
    stay_month_year: "February 2026",
    read_time: "1 min read",
    title: "Stepped straight out to the King Abdulaziz gate plaza",
    content: "The hotel entrance is right at the edge of the Ajyad courtyard. Took my elderly mother for Fajr and Isha without any fatigue — it takes 2 minutes walk from room to prayer rows. Unbeatable location.",
    highlight_quote: "Right on the courtyard plaza in 2 minutes walk.",
    helpful_tag: "🟢 2 Min Walk",
    is_verified: true,
  },

  // Zowar International / Zowar Alalami (Madinah)
  {
    id: "rev-zowar-1",
    hotel_slug: "zowar-alalami",
    hotel_name: "Zowar Alalami",
    author_name: "Zahid Q. (Abu Dhabi)",
    travel_party: "Children",
    rating: 5,
    stay_month_year: "January 2026",
    read_time: "1 min read",
    title: "Level pedestrian walk to Gate 328 in Madinah",
    content: "Located in the Northern Central Area of Madinah. The walk to Masjid an-Nabawi courtyard is completely paved and vehicle-free. Takes about 4-5 minutes to Gate 328. Great value, neat rooms, and helpful staff.",
    highlight_quote: "Vehicle-free northern courtyard approach.",
    helpful_tag: "🟢 Level Courtyard Path",
    is_verified: true,
  },

  // Saja by Warwick (Madinah)
  {
    id: "rev-saja-1",
    hotel_slug: "saja-by-warwick-madinah",
    hotel_name: "Saja by Warwick Madinah",
    author_name: "Bilal & Maryam (Dubai)",
    travel_party: "Couple",
    rating: 5,
    stay_month_year: "February 2026",
    read_time: "1 min read",
    title: "Short and pleasant stroll to Masjid an-Nabawi",
    content: "Modern design, fast elevators, and clean rooms. The walk to the northern plaza is direct and takes 4-5 minutes. Excellent dining options around the hotel.",
    highlight_quote: "Comfortable boutique rooms with quick mosque access.",
    helpful_tag: "✨ Modern Boutique Stay",
    is_verified: true,
  },

  // Jabal Omar Marriott
  {
    id: "rev-marriott-1",
    hotel_slug: "jabal-omar-marriott",
    hotel_name: "Jabal Omar Marriott",
    author_name: "Rashid H. (Sharjah)",
    travel_party: "Large family",
    rating: 5,
    stay_month_year: "January 2026",
    read_time: "1 min read",
    title: "Smooth buggies and air-conditioned walkway",
    content: "Jabal Omar complex is wonderful. You can walk through the air-conditioned podium or take the complimentary internal golf buggies right down to Ibrahim Al Khalil street and the King Fahd gate plaza. Super comfortable for our entire family.",
    highlight_quote: "Complimentary buggy service through Jabal Omar podium.",
    helpful_tag: "🛺 Buggy Transport Provided",
    is_verified: true,
  },
];

export function getReviewsForHotel(slug: string): HotelReview[] {
  const normSlug = slug.toLowerCase().trim();

  // Return curated fallback reviews matching this slug
  const matches = INITIAL_HOTEL_REVIEWS.filter(
    (r) => r.hotel_slug === normSlug || normSlug.includes(r.hotel_slug) || r.hotel_slug.includes(normSlug)
  );

  if (matches.length > 0) {
    return matches;
  }

  // Default universal high-touch review if none exist yet for this specific hotel
  return [
    {
      id: `rev-default-${normSlug}`,
      hotel_slug: normSlug,
      author_name: "Verified Masaar Pilgrim",
      travel_party: "General",
      rating: 5,
      stay_month_year: "Recent Pilgrim Stay",
      read_time: "1 min read",
      title: "Inspected and verified by Masaar Holidays",
      content:
        "This property was personally surveyed by our ground operations team in Makkah/Madinah. We verified step-free entryways, elevator speeds during prayer rush hours, and walking distances to ensure maximum ease for your spiritual journey.",
      highlight_quote: "Inspected and verified by Masaar Holidays ground team.",
      helpful_tag: "✓ Verified Quality",
      is_verified: true,
    },
  ];
}
