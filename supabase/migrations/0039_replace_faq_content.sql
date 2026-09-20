-- Migration: 0039_replace_faq_content.sql
-- Replaces all existing FAQ rows with updated content across 6 categories.
-- Apply in Supabase SQL Editor (do not auto-execute).

-- Remove all current FAQ rows before inserting replacement content.
DELETE FROM faqs;

-- Seed replacement FAQs (37 total: 6 umrah + 6 hajj + 6 hotels + 6 visa + 5 transfers + 8 general)
INSERT INTO faqs (category, question, answer, display_order, published) VALUES

-- Umrah (6)
('umrah',
 'What''s the difference between Essential, Signature and Exclusive Umrah packages?',
 'All three packages receive the same standard of care. The difference is in accommodation, location, and convenience.

Essential – Smart & Comfortable: A budget-conscious option for younger travellers, with comfortable accommodation and shuttle service.

Signature – Comfort & Convenience: Suitable for all age groups, with hotels located just a few steps from the Haram.

Exclusive – Premium & Private: Designed for those seeking greater comfort and convenience, particularly parents, elderly travellers, and pilgrims requiring additional assistance. Selected accommodation is within the Haram Plaza area, approximately 1–4 minutes from the Haram.',
 1, true),

('umrah',
 'Can I customize my Umrah journey?',
 'Absolutely. Tell us who you''re travelling with — parents, children, as a couple, or as a group — along with your dates and preferences. We''ll tailor the journey around your needs.',
 2, true),

('umrah',
 'What is included in an Umrah package?',
 'Our standard Umrah packages include hotel accommodation, airport pick-up and drop-off, private transportation, Makkah–Madinah transfers, and a qualified Umrah guide. Flights and Ziyarat can be added separately on request.',
 3, true),

('umrah',
 'Are flights included in the Umrah packages?',
 'Flights are not included in the standard packages. We can arrange and add flights to your journey upon request.',
 4, true),

('umrah',
 'Can I request specific rooms or views?',
 'Yes. You can request connecting or family rooms, as well as specific views such as Haram View or Kaaba View. All requests are subject to availability.',
 5, true),

('umrah',
 'How far in advance should I plan my Umrah?',
 'We recommend planning as early as possible, particularly during peak periods, to secure your preferred hotels, room types, and travel dates.',
 6, true),

-- Hajj (6)
('hajj',
 'Does Masaar guarantee Hajj visas or quota allocations?',
 'Hajj visas and quota allocations are subject to official availability and confirmation. We do not guarantee a Hajj place, visa, or quota unless it is explicitly confirmed for your booking.',
 1, true),

('hajj',
 'How is Hajj availability confirmed?',
 'Hajj availability is limited and seasonal. Each enquiry is reviewed individually, and our team will confirm the available options for the current Hajj season.',
 2, true),

('hajj',
 'What''s included in the Hajj package tiers?',
 'Our Essential, Signature, and Exclusive packages include accommodation, transportation, and pilgrimage support, with the level of comfort, proximity, and services varying by tier.',
 3, true),

('hajj',
 'How early should I register my interest for Hajj?',
 'We recommend registering as early as possible. Hajj availability is limited and confirmed season by season.',
 4, true),

('hajj',
 'Does accommodation location vary between Hajj packages?',
 'Yes. Accommodation location and proximity to the holy sites vary by package tier. We''ll confirm the available options for your chosen package.',
 5, true),

('hajj',
 'What if my preferred dates or package are unavailable?',
 'We''ll proactively explore alternative dates, accommodation, and package options to find the most suitable arrangement for your journey.',
 6, true),

-- Hotels (6)
('hotels',
 'How does Masaar select its hotels?',
 'We select hotels based on location, comfort, service standards, and proximity to the Haram — not simply on price.',
 1, true),

('hotels',
 'Are hotel prices shown per night or for the full stay?',
 'Prices shown are per room, per night. Your total will depend on your dates, room type, and length of stay.',
 2, true),

('hotels',
 'Can I request a hotel that isn''t listed?',
 'Yes. Share your preferred hotel with us and we''ll check availability and the best available rate.',
 3, true),

('hotels',
 'How do I know how close a hotel is to the Haram?',
 'Each hotel listing shows its approximate walking distance, route type, and terrain to the Haram, helping you choose based on the level of convenience you prefer.',
 4, true),

('hotels',
 'Can I book a hotel separately from an Umrah or Hajj package?',
 'Yes. Hotels can be arranged as part of your pilgrimage journey or booked separately.',
 5, true),

('hotels',
 'What if my selected hotel is unavailable?',
 'We''ll recommend a suitable alternative based on location, quality, and your preferences, and confirm the price before proceeding.',
 6, true),

-- Visa (6)
('visa',
 'What visa services does Masaar provide?',
 'We assist with Umrah and travel visas for Saudi Arabia and the UAE. We''ll guide you towards the appropriate visa based on your travel plans.',
 1, true),

('visa',
 'Can Masaar guarantee visa approval?',
 'Visa approval is subject to the relevant authorities. We handle the application process and guide you through the required documentation.',
 2, true),

('visa',
 'How long does visa processing take?',
 'Processing times vary by visa type, nationality, and current authority requirements. We''ll confirm the latest expected processing time when you enquire.',
 3, true),

('visa',
 'What documents do I need?',
 'Requirements vary by visa type. For UAE residents, requirements may include a passport valid for at least 6 months, a UAE residence visa valid for at least 3 months, a recent white-background photograph, and a copy of the UAE residence visa. Additional documents may be required depending on the visa.',
 4, true),

('visa',
 'Do visa requirements differ by nationality?',
 'Yes. Visa requirements, processing times, and fees can vary by nationality and visa type. We''ll confirm the applicable requirements for your application.',
 5, true),

('visa',
 'Are visa fees included in package prices?',
 'Visa fees are separate unless specifically included in your selected package. We''ll clearly confirm what is included before you proceed.',
 6, true),

-- Transfers (5)
('transfers',
 'What types of vehicles are available?',
 'We arrange private vehicles ranging from comfortable sedans to larger vehicles for families and groups. The vehicle is selected according to your group size and requirements.',
 1, true),

('transfers',
 'Can you arrange transfers for large families or groups?',
 'Yes. We arrange private transfers for families and groups of different sizes, including multi-generational families travelling together.',
 2, true),

('transfers',
 'Are transfers included in Umrah and Hajj packages?',
 'Transfers included in your package depend on the selected package. Additional private transfers can also be arranged separately.',
 3, true),

('transfers',
 'Can I add private day trips to my journey?',
 'Yes. Private day trips such as Jeddah–Taif and Makkah–Taif can be arranged as part of your itinerary.',
 4, true),

('transfers',
 'What happens if my flight is delayed?',
 'If your flight is delayed, contact our team as soon as possible. We''ll coordinate with the transfer provider and adjust the pick-up time where possible.',
 5, true),

-- General (8)
('general',
 'What does Masaar Holidays do?',
 'Masaar Holidays creates and arranges bespoke Umrah, Hajj, and premium travel journeys, bringing together accommodation, private transfers, visa assistance, and carefully selected travel experiences.',
 1, true),

('general',
 'Why choose Masaar instead of booking everything separately?',
 'We bring the journey together around you — coordinating accommodation, transportation, visas, and other arrangements so you have one team managing the details.',
 2, true),

('general',
 'Do you only serve UAE-based travellers?',
 'Our primary market is the UAE, but we also assist travellers from other countries. Contact our team to discuss your requirements.',
 3, true),

('general',
 'How do I get a personalized quote?',
 'Message us on WhatsApp with your travel dates, number of travellers, who you''re travelling with, and your preferences. We''ll recommend suitable options for your journey.',
 4, true),

('general',
 'Can I make changes after my booking is confirmed?',
 'Yes. Contact us as early as possible if your plans change. We''ll review what can be adjusted based on supplier and booking conditions.',
 5, true),

('general',
 'Will I have support during my journey?',
 'Yes. Our team remains reachable on WhatsApp throughout your journey for assistance with your arrangements.',
 6, true),

('general',
 'Can I pay through the website?',
 'Bookings are confirmed directly with our team. Payment options and instructions will be provided during the booking process.',
 7, true),

('general',
 'What is your cancellation policy?',
 'Cancellation terms depend on the hotels, airlines, transport providers, visas, and other services included in your booking. We''ll provide the applicable terms before confirmation.',
 8, true);
