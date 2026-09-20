-- Migration: 0048_fix_makkah_madinah_itinerary_label.sql
-- Fixes a duration_label mismatch: migration 0045 set the real "5 Nights /
-- 6 Days Makkah & Madinah Split Package" itinerary (from the client's day
-- wise itinerary.docx) on rows matching the plain label '5 Nights / 6 Days',
-- but 0047 seeded the actual Makkah+Madinah combined configs with the more
-- descriptive label '5 Nights / 6 Days (3N Makkah + 2N Madinah)' (matching
-- the "3+2" row of the client's combined pricing table) — so the itinerary
-- never attached and the live page fell back to the "being finalized"
-- placeholder for that duration.
--
-- Apply manually in Supabase SQL Editor.

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
where journey_type = 'makkah_madinah' and duration_label = '5 Nights / 6 Days (3N Makkah + 2N Madinah)';
