import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { CONTACT } from "@/lib/contact";
import { buildPageMetadata } from "@/lib/i18n";
import { ContactForm } from "./ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/contact",
    title: "Contact Masaar Holidays | Umrah & Hajj Enquiries",
    description:
      "Reach Masaar Holidays by WhatsApp, phone, or email — a dedicated advisor responds personally to every Umrah or Hajj enquiry.",
  });
}

export default function ContactPage() {
  return (
    <>
      <Hero
        eyebrow="Contact"
        h1="Get in Touch"
        image="/brand/banners/default.png"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
        ]}
      />

      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <ContactCard title="Phone / WhatsApp" line1={CONTACT.phoneDisplay} line2="We're available to assist you." />
            <ContactCard
              title="General Enquiries"
              line1={CONTACT.emailGeneral}
              line2="For package information, travel advice or any questions."
            />
            <ContactCard
              title="Partnerships"
              line1={CONTACT.emailPartnerships}
              line2="For B2B enquiries, agents or collaboration opportunities."
            />
            <ContactCard
              title="Accounts & Billing"
              line1={CONTACT.emailAccounts}
              line2="For invoices, payments and billing-related queries."
            />
            <ContactCard
              title="Our Office"
              line1="Masaar Holidays, Dubai, United Arab Emirates"
              line2="(Meetings by appointment only)"
            />
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-6">
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

function ContactCard({ title, line1, line2 }: { title: string; line1: string; line2: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <h3 className="font-semibold text-masaar-black">{title}</h3>
      <p className="mt-1 text-sm text-masaar-black/60">{line2}</p>
      <p className="mt-1 font-medium text-deep-gold">{line1}</p>
    </div>
  );
}
