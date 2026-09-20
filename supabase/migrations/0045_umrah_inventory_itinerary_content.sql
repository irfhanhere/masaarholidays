-- Migration: 0045_umrah_inventory_itinerary_content.sql
-- Populates umrah_inventory_configurations.itinerary with the real day-by-day
-- copy from the client's "day wise itinerary.docx" (spec item 12c). Matched
-- by duration_label + journey_type rather than by id, so the same itinerary
-- applies to every tier's configuration at that duration (Essential/
-- Signature/Exclusive all use the same day structure — only hotel/transfer
-- specifics named elsewhere on the page differ by tier).
--
-- Covers: 2 Nights / 3 Days (Makkah only), 3 Nights / 4 Days (Makkah only),
-- 5 Nights / 6 Days (Makkah + Madinah split).
--
-- NOT covered: a Makkah-only 5 Nights / 6 Days itinerary — the source docx
-- has no day-by-day copy for that duration (only the 2N/3D, 3N/4D Makkah-only
-- and 5N/6D Makkah+Madinah itineraries were provided). Don't invent one here;
-- that duration's itinerary section will simply stay empty until real copy
-- is provided.
--
-- Apply manually in Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────
-- 2 Nights / 3 Days — Makkah Only — "Quick Umrah Package"
-- ─────────────────────────────────────────────────────────────────────────
update public.umrah_inventory_configurations
set itinerary = '[
  {
    "day": 1,
    "title": "Arrival in Makkah",
    "items": [
      "Airport Pickup: greeted by your professional driver at the airport upon flight arrival and transferred directly to your Makkah hotel in a private car.",
      "Check-In & Umrah: smooth hotel check-in followed by time to refresh and perform your Umrah at your own pace."
    ]
  },
  {
    "day": 2,
    "title": "Makkah — Full Day for Ibadah",
    "items": [
      "Dedicate the entire day to prayers, optional Tawaf, and spiritual reflection inside Masjid al-Haram.",
      "Optional Add-On: private morning Ziyarat tour of Makkah''s historical landmarks."
    ]
  },
  {
    "day": 3,
    "title": "Alvida Tawaf & Departure",
    "items": [
      "Checkout & Transfer: complete final prayers (Alvida Tawaf), check out of the hotel, and enjoy a comfortable private transfer back to the airport according to your flight schedule."
    ]
  }
]'::jsonb
where journey_type = 'makkah_only' and duration_label = '2 Nights / 3 Days';

-- ─────────────────────────────────────────────────────────────────────────
-- 3 Nights / 4 Days — Makkah Only — "Essential Makkah Stay"
-- ─────────────────────────────────────────────────────────────────────────
update public.umrah_inventory_configurations
set itinerary = '[
  {
    "day": 1,
    "title": "Arrival in Makkah",
    "items": [
      "Airport Pickup: private car transfer from the airport to your Makkah hotel by your professional driver.",
      "Check-In & Umrah: check-in, settle in, and proceed to the Haram to complete your Umrah rituals comfortably."
    ]
  },
  {
    "day": 2,
    "title": "Makkah — Focused Worship",
    "items": [
      "A full day dedicated to prayers and spiritual devotions at Masjid al-Haram.",
      "Optional Add-On: private guided tour of key historical sites (Jabal al-Nour, Jabal Thawr, Jannat al-Mu''alla)."
    ]
  },
  {
    "day": 3,
    "title": "Day of Reflection & Rest",
    "items": [
      "Freedom to spend the day at your own pace for personal worship, Quran recitation, and optional shopping."
    ]
  },
  {
    "day": 4,
    "title": "Departure",
    "items": [
      "Checkout & Transfer: hotel checkout and seamless private car drop-off at the airport for your return flight."
    ]
  }
]'::jsonb
where journey_type = 'makkah_only' and duration_label = '3 Nights / 4 Days';

-- ─────────────────────────────────────────────────────────────────────────
-- 5 Nights / 6 Days — Makkah + Madinah Split Package
-- ─────────────────────────────────────────────────────────────────────────
update public.umrah_inventory_configurations
set itinerary = '[
  {
    "day": 1,
    "title": "Arrival in Makkah",
    "items": [
      "Airport Pickup: greeted by your professional driver at the airport upon flight arrival and transferred directly to your Makkah hotel in a private car.",
      "Check-In & Umrah: smooth hotel check-in followed by time to refresh and perform your Umrah at your own pace."
    ]
  },
  {
    "day": 2,
    "title": "Makkah — Ibadah & Optional Ziyarat",
    "items": [
      "Dedicate the day to prayers and Tawaf inside Masjid al-Haram.",
      "Optional Service: Ziyarat tour of Makkah''s historical landmarks can be scheduled today (or on Day 3 or Day 4, whichever the traveler prefers)."
    ]
  },
  {
    "day": 3,
    "title": "Makkah — Ibadah & Optional Ziyarat",
    "items": [
      "Continue your spiritual retreat with focused prayers and worship in Makkah.",
      "Optional Service: Ziyarat tour of Makkah''s historical landmarks can be scheduled today if preferred."
    ]
  },
  {
    "day": 4,
    "title": "Makkah to Madinah Transfer & Optional Ziyarat",
    "items": [
      "Journey: enjoy breakfast at your Makkah hotel, check out, and board your private car for a smooth transfer to Madinah (scheduled after breakfast or after Zuhr prayer, based on preference).",
      "Arrival: check into your Madinah hotel and visit Al-Masjid an-Nabawi.",
      "Optional Service: Ziyarat tour of Madinah''s sacred sites (Masjid Quba, Uhud, Qiblatain) can be arranged either today upon arrival or tomorrow on Day 5."
    ]
  },
  {
    "day": 5,
    "title": "Madinah — Masjid An-Nabawi & Optional Ziyarat",
    "items": [
      "Full day dedicated to prayers, peace, and final spiritual reflection at the Prophet''s Mosque.",
      "Optional Service: Madinah Ziyarat tour can be completed today if not done on Day 4."
    ]
  },
  {
    "day": 6,
    "title": "Departure",
    "items": [
      "Checkout & Transfer: complete final hotel check-out, and enjoy a comfortable private car drop-off at the airport according to your flight schedule."
    ]
  }
]'::jsonb
where journey_type = 'makkah_madinah' and duration_label = '5 Nights / 6 Days';
