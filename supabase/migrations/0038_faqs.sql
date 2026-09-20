-- Migration: 0038_faqs.sql
-- Creates the faqs table and seeds 38 initial FAQs across 6 categories.
-- Note: Do not execute automatically; apply in Supabase SQL Editor.

CREATE TYPE faq_category AS ENUM ('umrah', 'hajj', 'hotels', 'visa', 'transfers', 'general');

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category faq_category NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for public category queries and ordering
CREATE INDEX IF NOT EXISTS idx_faqs_category_published_order ON faqs (category, published, display_order);

-- Enable Row Level Security
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to published faqs"
  ON faqs FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "Allow authenticated full access to faqs"
  ON faqs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE TRIGGER set_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Seed initial published FAQs (38 total: 6 umrah + 6 hajj + 6 hotels + 6 visa + 6 transfers + 8 general)
INSERT INTO faqs (category, question, answer, display_order, published) VALUES
-- Umrah (6)
('umrah', 'What''s the difference between Essential, Signature and Exclusive Umrah packages?', 'Our three tiers offer distinct levels of accommodation and proximity to the Haram, while maintaining the same standard of dedicated personal care. Essential provides comfortable, reliable 4-star hotels; Signature features premium 5-star properties close to the Haram; and Exclusive offers luxury 5-star courtyard or front-row hotels with private VIP transport and tailored services.', 1, true),
('umrah', 'Can I customize an Umrah package for my family''s needs?', 'Yes. Every family has unique preferences, mobility requirements, and schedules. We can tailor the duration in Makkah and Madinah, room configurations, private vehicle types, and optional ziyarat visits to suit your family.', 2, true),
('umrah', 'Do Umrah packages include flights?', 'We arrange flights from all major UAE airports (Dubai, Abu Dhabi, Sharjah) with leading airlines upon request. You may also book your own flights and have us manage all ground arrangements, including hotels, visas, and private transfers.', 3, true),
('umrah', 'How many nights are typically included in Makkah vs Madinah?', 'Most families choose 4 to 5 nights in Makkah and 3 to 4 nights in Madinah for a balanced 7 to 10 night journey. However, the distribution of nights is completely flexible based on your family''s travel plans.', 4, true),
('umrah', 'Can I request specific room types or connecting rooms for family groups?', 'Yes, connecting rooms, suites, quadruple rooms, and Haram-view rooms can be requested at the time of enquiry. We work directly with our hotel partners to accommodate family rooming requests subject to availability.', 5, true),
('umrah', 'How far in advance should we book an Umrah package?', 'We recommend booking 3 to 6 weeks in advance for regular seasons, and 2 to 3 months ahead for peak periods like Ramadan, December school holidays, and public holidays to ensure preferred hotel availability and favorable rates.', 6, true),

-- Hajj (6)
('hajj', 'Does Masaar guarantee Hajj visas or quota allocations?', 'Masaar Holidays facilitates Hajj registrations and travel arrangements in accordance with official UAE and Saudi Ministry of Hajj and Umrah regulations. Official quotas and visa approvals remain subject to regulatory authority allocations and criteria.', 1, true),
('hajj', 'How is Hajj availability confirmed?', 'Hajj registrations are handled on an individual case-by-case basis. Once you submit your enquiry, our team guides you through the official documentation and confirms available package allocations directly with you.', 2, true),
('hajj', 'What''s included in the Hajj package tiers?', 'Our Hajj packages include accommodation near the holy sites in Makkah and Madinah, Mina and Arafat encampment arrangements (Maktab category based on tier), daily meals, air-conditioned transport, guided support, and dedicated coordination throughout the rituals.', 3, true),
('hajj', 'How far in advance should we register interest for Hajj?', 'Due to limited quotas and early registration timelines set by authorities, we encourage families to register interest as early as possible—ideally 6 to 9 months prior to the Hajj season.', 4, true),
('hajj', 'Is accommodation location fixed, or does it vary by tier?', 'Accommodation in Makkah and Madinah varies by package tier (walking distance, hotel category, and view). Mina and Arafat tent allocations also reflect the selected Maktab category.', 5, true),
('hajj', 'What happens if our preferred dates aren''t available?', 'Hajj dates follow the lunar Islamic calendar and official ritual timelines. If your initial package or tent allocation preference is fully booked, our team will present alternative options that align closely with your requirements.', 6, true),

-- Hotels (6)
('hotels', 'How are hotels selected for the Makkah & Madinah listings?', 'Every hotel in our portfolio is personally vetted for proximity to the Haram, cleanliness, family comfort, and reliable service. We prioritize walking convenience and peace of mind over simply offering the cheapest rates.', 1, true),
('hotels', 'Are the prices shown per night or for the full stay?', 'Rates displayed on the website are starting indicative prices per night. Final package or stay pricing is calculated for your exact travel dates, room configuration, and duration, confirmed transparently on WhatsApp.', 2, true),
('hotels', 'Can I request a specific hotel not listed on the site?', 'Yes. If you have a specific hotel in mind that is not featured in our online selection, please let us know. We have direct relationships with major hotel groups across Makkah and Madinah.', 3, true),
('hotels', 'What''s the difference in walking distance between tiers of hotels?', 'Our hotels range from front-row properties directly on the Haram courtyard (0–2 minutes) to premium stays within a comfortable 5–10 minute flat walk. Walking distance and terrain details are clearly specified for each hotel.', 4, true),
('hotels', 'Can hotel bookings be combined with a Hajj/Umrah package, or booked separately?', 'You can book hotels as part of a comprehensive Umrah/Hajj package (including visa and private transfers) or as standalone hotel reservations if you already have your own travel arrangements.', 5, true),
('hotels', 'What''s your policy if a listed hotel is unavailable for our dates?', 'If a specific hotel is fully booked for your dates, our team will propose alternative hotels in the same or higher category with comparable proximity to the Haram, ensuring no compromise on your comfort.', 6, true),

-- Visa (6)
('visa', 'What visa types does Masaar assist with?', 'We provide end-to-end guidance for Saudi Umrah visas, Saudi Tourist e-Visas, UAE entry visas, GCC resident visas, Saudi transit visas, and related document attestations.', 1, true),
('visa', 'Can Masaar guarantee visa approval?', 'While we ensure your documentation is prepared accurately to maximize approval likelihood, final issuance and approval decisions rest solely with the relevant government embassies and immigration authorities.', 2, true),
('visa', 'How long does visa processing typically take?', 'Electronic visas (such as Saudi Tourist e-Visas and Umrah e-Visas) are typically processed within 24 to 72 hours. Stamped or consular visas may require 5 to 10 working days depending on nationality.', 3, true),
('visa', 'What documents do I need to provide?', 'Generally, a valid passport with at least 6 months validity, a recent passport-size photograph with white background, and (for UAE residents) a copy of your UAE residence visa and Emirates ID are required.', 4, true),
('visa', 'Do visa requirements differ by nationality?', 'Yes. Eligibility for instant e-visas versus standard consular applications depends on your nationality, passport type, and UAE residency status. Our team will advise on the exact criteria for your situation.', 5, true),
('visa', 'Is the visa fee included in package pricing, or separate?', 'Visa fees can be bundled into your complete package or quoted transparently as a separate item depending on the package tier and your preferred booking structure.', 6, true),

-- Transfers (6)
('transfers', 'What types of vehicles are available for private transfers?', 'Our private fleet includes comfortable modern sedans (Toyota Camry/Lexus), spacious family SUVs (GMC Yukon/Ford Expedition), multi-passenger vans (Toyota HiAce/Hyundai H1), and luxury VIP vehicles with professional drivers.', 1, true),
('transfers', 'Can transfers be arranged for large family groups?', 'Yes. We accommodate family groups of all sizes, coordinating multiple vehicles or private minivans with ample luggage capacity so your family travels together comfortably.', 2, true),
('transfers', 'Are transfers included in Umrah/Hajj packages, or booked separately?', 'Private airport and intercity transfers are included in our Signature and Exclusive packages, and can be added to Essential packages or booked completely standalone.', 3, true),
('transfers', 'Can we add a day trip (e.g. Jeddah–Taif) to our itinerary?', 'Yes. We arrange private day trips to Taif (cable car, rose factories, historical mosques), Jeddah historical Al-Balad, and coastal visits, tailored around your prayer and rest times.', 4, true),
('transfers', 'How far in advance should transfers be booked?', 'We recommend booking transfers at least 48 hours before arrival. For peak seasons (Ramadan and Hajj), reserving 1 to 2 weeks ahead ensures driver and preferred vehicle availability.', 5, true),
('transfers', 'What happens if our flight is delayed?', 'Our drivers monitor live flight schedules using your flight number. If your flight is delayed, your driver adjusts pickup timing accordingly at no additional charge.', 6, true),

-- General (8)
('general', 'What does Masaar Holidays do?', 'Masaar Holidays is a UAE-based travel company specializing in thoughtfully planned, family-paced Umrah, Hajj, hotel accommodation, private transfers, and visa assistance with sincere care and transparent guidance.', 1, true),
('general', 'Why go through Masaar instead of booking separately?', 'Booking with Masaar gives you peace of mind: vetted hotels, trusted private drivers, direct WhatsApp support, coordinated logistics, and one dedicated advisor handling every detail so you can focus on worship.', 2, true),
('general', 'Do you only serve UAE-based families?', 'While we are based in the UAE and specialize in arrangements for UAE residents and citizens, we warmly assist international pilgrims and overseas family members joining trips.', 3, true),
('general', 'How do I get a quote?', 'Simply click the ''Enquire on WhatsApp'' button on any page or contact us with your travel dates, number of travelers, and preferred comfort level. Our team typically responds within minutes.', 4, true),
('general', 'Can I pay online through the website?', 'To ensure availability is verified and personalized details are confirmed before payment, we confirm bookings directly via WhatsApp and provide secure payment links or bank transfer details.', 5, true),
('general', 'Can we make changes after arrangements are set?', 'Yes, we accommodate date adjustments, room upgrades, or itinerary modifications subject to partner hotel and airline policies. We always strive to keep change fees minimal and transparent.', 6, true),
('general', 'What if we need help during the trip?', 'You have a dedicated Masaar support contact available via WhatsApp and phone throughout your entire journey—from airport arrival to your safe return home.', 7, true),
('general', 'What''s your cancellation policy?', 'Cancellation terms depend on the specific hotel, airline, and package tier booked. Many of our hotel options feature flexible cancellation. All policies are clearly stated and confirmed in writing before booking.', 8, true);
