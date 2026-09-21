import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { WhatsAppButton, WhatsAppGlyph } from "@/components/site/WhatsAppButton";
import { ClockIcon, HeadsetIcon, LocationIcon, MailIcon, PhoneIcon } from "@/components/site/icons";
import { CONTACT } from "@/lib/contact";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { ContactForm } from "./ContactForm";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/contact",
    fallbackTitle: "Contact Masaar Holidays | Umrah & Hajj Enquiries",
    fallbackDescription:
      "Reach Masaar Holidays by WhatsApp, phone, or email — a dedicated advisor responds personally to every Umrah or Hajj enquiry.",
  });
}

// Office address, business hours, and traveller-support copy are the
// client's confirmed details (contact.ts) — real content, not placeholders.
export default function ContactPage() {
  return (
    <>
      <Hero
        eyebrow="Contact Masaar"
        h1="Let's Plan Your"
        h1Gold="Journey Together"
        image="/brand/banners/default.png"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
        ]}
      >
        <p className="mt-4 max-w-xl text-sm text-masaar-black/60 sm:text-base">
          Questions about a package, hotel, visa or journey?
          Reach out and our team will help you with the next step.
        </p>
      </Hero>

      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border border-pure-gold/30 bg-warm-ivory p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#25D366]">
                  <WhatsAppGlyph className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-masaar-black">WhatsApp</h2>
                  <p className="text-sm text-masaar-black/60">The fastest way to reach us.</p>
                </div>
              </div>
              <div className="mt-4">
                <WhatsAppButton templateKey="contact" variant="whatsapp-green" className="w-full">
                  Chat with Masaar on WhatsApp
                </WhatsAppButton>
              </div>
            </div>

            <a
              href={`tel:+${CONTACT.whatsappPhoneIntl}`}
              className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-5 transition-colors hover:border-pure-gold"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <PhoneIcon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-masaar-black">Call Us</h3>
                <p className="text-sm text-masaar-black/60">{CONTACT.phoneDisplay}</p>
              </div>
            </a>

            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <MailIcon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-masaar-black">Email</h3>
                  <a href={`mailto:${CONTACT.emailGeneral}`} className="text-sm text-deep-gold hover:underline">
                    {CONTACT.emailGeneral}
                  </a>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-3 text-xs text-masaar-black/50">
                <span>
                  Partnerships & agents:{" "}
                  <a href={`mailto:${CONTACT.emailPartnerships}`} className="text-masaar-black/70 hover:text-deep-gold hover:underline">
                    {CONTACT.emailPartnerships}
                  </a>
                </span>
                <span>
                  Accounts & billing:{" "}
                  <a href={`mailto:${CONTACT.emailAccounts}`} className="text-masaar-black/70 hover:text-deep-gold hover:underline">
                    {CONTACT.emailAccounts}
                  </a>
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <LocationIcon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-masaar-black">Visit Us</h3>
                  <p className="text-sm text-masaar-black/60">{CONTACT.officeAddressLines[0]}</p>
                </div>
              </div>
              <div className="mt-3 border-t border-black/10 pt-3 text-sm text-masaar-black/70">
                {CONTACT.officeAddressLines.slice(1).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <ClockIcon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-masaar-black">Business Hours</h3>
                  <p className="text-sm text-masaar-black/60">{CONTACT.businessHours}</p>
                </div>
              </div>
              <p className="mt-3 border-t border-black/10 pt-3 text-xs text-masaar-black/50">
                {CONTACT.businessHoursNote}
              </p>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <HeadsetIcon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-masaar-black">Umrah Traveller Support</h3>
                  <p className="text-sm text-masaar-black/60">24/7 Emergency Assistance</p>
                </div>
              </div>
              <p className="mt-3 border-t border-black/10 pt-3 text-xs text-masaar-black/50">
                {CONTACT.emergencySupportNote}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-6 lg:self-start">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
              Send an Enquiry
            </h2>
            <p className="mt-1 text-sm text-masaar-black/60">
              Fill in the details below and our team will get back to you as soon as possible.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
