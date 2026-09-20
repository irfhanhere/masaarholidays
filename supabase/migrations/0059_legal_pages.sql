-- Migration: 0059_legal_pages.sql
-- Replaces the "Coming Soon" Legal & Cookies admin stub and the four
-- "content pending" public legal pages (Privacy Policy, Terms &
-- Conditions, Accessibility) plus the Cookie Preferences intro text.
-- Content uses a light markup convention rendered by LegalPage.tsx:
--   "## Heading" -> subheading, "- item" -> bullet, blank line -> new paragraph.
--
-- The seeded text below is a genuine, usable first draft written for
-- Masaar Holidays' actual services and contact details (real phone/email
-- already used elsewhere on the site) — it is NOT a substitute for review
-- by qualified legal counsel before being relied upon as final.
--
-- Apply manually in Supabase SQL Editor.

create table if not exists public.legal_pages (
  key text primary key, -- 'privacy_policy' | 'terms_conditions' | 'cookie_policy' | 'accessibility'
  title text not null,
  content text not null,
  updated_at timestamptz not null default now()
);

create trigger legal_pages_set_updated_at
  before update on public.legal_pages
  for each row execute function public.set_updated_at();

alter table public.legal_pages enable row level security;

create policy "legal_pages_public_read" on public.legal_pages
  for select using (true);
create policy "legal_pages_admin_all" on public.legal_pages
  for all to authenticated using (true) with check (true);

insert into public.legal_pages (key, title, content) values
('privacy_policy', 'Privacy Policy', '## Who We Are
Masaar Holidays ("Masaar Holidays", "we", "us", "our") provides Umrah, Hajj, hotel, transfer, visa assistance and private sightseeing travel services from the United Arab Emirates. This Privacy Policy explains how we collect, use and protect your personal information when you visit our website or contact us about our services.

## Information We Collect
We collect information you provide directly to us, including:
- Your name, phone/WhatsApp number and email address when you submit an enquiry form
- Details about your travel plans, preferred package, dates and number of travellers
- Any additional information you share when registering interest in a Hajj package or requesting a private trip, hotel or visa service
- Messages you send us via WhatsApp, email or phone

We do not collect payment card details through this website — all bookings and payments are arranged directly with our team, not processed online.

## How We Use Your Information
We use the information you provide to:
- Respond to your enquiries and provide requested quotes or itineraries
- Coordinate travel arrangements, hotel bookings, transfers and visa processing on your behalf
- Send you information you have requested about our services
- Improve our website and services

We do not sell your personal information to third parties.

## Sharing Your Information
We may share your information with trusted partners directly involved in fulfilling your travel arrangements — such as hotels, transport providers and visa processing partners — only as needed to arrange the services you have requested. We do not share your information with third parties for their own marketing purposes.

## Data Retention
We retain enquiry and booking information for as long as necessary to provide our services and to meet our legal, accounting and reporting obligations.

## Your Rights
Depending on your location, you may have rights to access, correct or request deletion of your personal information. To exercise these rights, contact us using the details below.

## Cookies
Our website uses cookies to remember your preferences (such as your selected currency and language) and to understand how visitors use the site. You can manage your cookie preferences at any time on our Cookie Preferences page.

## Contact Us
If you have any questions about this Privacy Policy or how we handle your information, please contact us:
- Email: care@masaarholidays.com
- Phone / WhatsApp: +971 55 227 6299

## Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.'),

('terms_conditions', 'Terms & Conditions', '## Introduction
These Terms & Conditions govern your use of the Masaar Holidays website and your enquiries for Umrah, Hajj, hotel, transfer, visa assistance and private sightseeing services. By using this website or submitting an enquiry, you agree to these terms.

## Our Services
Masaar Holidays arranges Umrah and Hajj travel packages, hotel accommodation in Makkah and Madinah, private transfers, visa assistance and private sightseeing experiences. This website is for informational purposes and to collect enquiries — it is not a live booking or payment platform. All bookings, pricing confirmation and payment arrangements are finalised directly with our team via WhatsApp, phone or email.

## Enquiries and Pricing
Prices, hotel options and availability shown on this website are indicative and subject to confirmation at the time of enquiry. Final pricing depends on travel dates, occupancy, hotel availability and current supplier rates, and will be confirmed with you before any booking is made.

## Hajj Packages
Hajj travel is subject to official regulations, quota allocations and confirmed arrangements by the relevant authorities. Masaar Holidays does not guarantee Hajj visas, quota allocations or specific accommodation until a booking is formally confirmed. Registering interest in a Hajj package does not constitute a confirmed booking.

## Visa Assistance
Visa assistance provided by Masaar Holidays consists of guidance, documentation support and application processing on your behalf. Visa approval is at the sole discretion of the relevant government authority, and Masaar Holidays cannot guarantee visa approval.

## Changes and Cancellations
Changes or cancellations to confirmed bookings may be subject to supplier terms, cancellation charges and administrative fees, which will be communicated to you at the time of booking or change.

## Traveller Responsibilities
You are responsible for ensuring that you and your travelling party hold valid travel documents, meet health and vaccination requirements, and comply with the laws and customs of Saudi Arabia and any transit countries.

## Limitation of Liability
Masaar Holidays acts as an intermediary arranging services provided by third parties (hotels, transport operators, visa processing bodies and other suppliers). While we take care in selecting our partners, we are not liable for acts, errors, omissions or delays caused by third-party suppliers beyond our reasonable control.

## Governing Law
These Terms & Conditions are governed by the laws of the United Arab Emirates.

## Contact Us
For any questions about these Terms & Conditions, contact us:
- Email: care@masaarholidays.com
- Phone / WhatsApp: +971 55 227 6299'),

('cookie_policy', 'Cookie Policy', '## What Are Cookies
Cookies are small text files stored on your device when you visit a website. They help the website function properly and remember your preferences.

## How We Use Cookies
We use cookies for:
- Necessary functions — keeping the website working correctly, including remembering your selected currency and language (always active)
- Analytics — understanding how visitors use our website so we can improve it
- Marketing — measuring the effectiveness of our outreach, where enabled

## Managing Your Preferences
You can review and update your cookie preferences at any time below. Necessary cookies cannot be disabled as they are required for the website to function.

## Third-Party Cookies
Some cookies may be set by third-party services we use, such as analytics providers. We do not control these cookies directly; please refer to the relevant third party''s own cookie policy for more information.

## Contact Us
If you have questions about our use of cookies, contact us at care@masaarholidays.com.'),

('accessibility', 'Accessibility', '## Our Commitment
Masaar Holidays is committed to making our website accessible to as many people as possible, including those with visual, auditory, motor or cognitive disabilities.

## What We Are Doing
We aim to:
- Use clear, readable text and sufficient colour contrast
- Structure our pages with clear headings and logical navigation
- Ensure our website can be used on a range of devices, including mobile phones
- Continue to review and improve accessibility as we update the website

## Getting in Touch
If you experience any difficulty accessing information on our website, or need information in an alternative format, please contact us and we will do our best to help:
- Email: care@masaarholidays.com
- Phone / WhatsApp: +971 55 227 6299

## Ongoing Improvement
Accessibility is an ongoing effort. We welcome your feedback to help us identify and fix accessibility barriers.')
on conflict (key) do nothing;
