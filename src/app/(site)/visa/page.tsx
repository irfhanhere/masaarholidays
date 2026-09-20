import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import {
  DocumentIcon,
  LocationIcon,
  PassportIcon,
  PaymentIcon,
  PlaneIcon,
  WarningTriangleIcon,
} from "@/components/site/icons";
import { CONTACT } from "@/lib/contact";
import { getActiveVisaTypes, getVisaLandingContent } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { FaqSection } from "@/components/site/FaqSection";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/visa",
    fallbackTitle: "Visa & Document Assistance | Masaar Holidays",
    fallbackDescription:
      "From pilgrimage visas to international travel documentation, Masaar Holidays helps you understand the requirements, prepare the necessary documents and navigate the application process with greater clarity.",
  });
}

const FALLBACK_IMPORTANT_INFO =
  "Visa requirements, processing times and fees vary by visa type and nationality, and can change frequently. Please always verify the latest information with the relevant embassy, consulate or authority.\nMasaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.";

/** Landing-page card icon per visa type — not admin-editable. */
const CARD_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  umrah: PassportIcon,
  uae: DocumentIcon,
  global: PlaneIcon,
  "saudi-tourist": PassportIcon,
  "emirates-id": PaymentIcon,
  india: LocationIcon,
};

export default async function VisaPage() {
  const [visaTypes, landingContent] = await Promise.all([getActiveVisaTypes(), getVisaLandingContent()]);
  const importantInfo = (landingContent?.important_info_text || FALLBACK_IMPORTANT_INFO)
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <Breadcrumbs items={[{ label: "Visa" }]} />
      <Hero eyebrow="Visa Assistance" h1="Visa Assistance," h1Gold="With Clarity" image="/brand/banners/destination.png">
        <p className="mt-4 max-w-xl text-sm text-masaar-black/60 sm:text-base">
          Guidance through the documentation and application process, so you know what is needed before your journey.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="visa" params={{ visaType: "General enquiry" }}>
            Enquire on WhatsApp
          </WhatsAppButton>
        </div>
      </Hero>

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Visa Services" title="Visa & Document Assistance" />
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-masaar-black/60">
            Explore our visa services below — each page covers what&apos;s required and how we
            can help.
          </p>

          <div className="mt-10">
            {visaTypes.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visaTypes.map((visa) => {
                  const Icon = CARD_ICONS[visa.slug] ?? DocumentIcon;
                  return (
                    <Link
                      key={visa.id}
                      href={`/visa/${visa.slug}`}
                      className="group rounded-lg border border-black/10 bg-white p-6 transition-colors hover:border-pure-gold"
                    >
                      <span className="flex size-12 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                        <Icon className="size-6" />
                      </span>
                      <h3 className="mt-4 font-semibold text-masaar-black">{visa.name}</h3>
                      {visa.description && (
                        <p className="mt-2 text-sm text-masaar-black/60">{visa.description}</p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-deep-gold">
                        Learn More
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Visa types not published yet"
                note="Umrah Visa · UAE Visa · Global Visa · Saudi Tourist Visa · Emirates ID · India Visa will appear here once published in Admin → Visa Types."
              />
            )}
          </div>
        </Container>
      </section>

      <section className="py-4">
        <Container>
          <div className="rounded-lg border border-light-gold/40 bg-warm-ivory p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold">
                <WarningTriangleIcon className="size-5" />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-deep-gold">
                  Important Information
                </h3>
                <div className="mt-2 space-y-2 text-sm text-masaar-black/70">
                  {importantInfo.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-warm-ivory py-16">
        <Container className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-masaar-black sm:text-3xl">
              {landingContent?.cta_heading || "Start Your Visa Application"}
            </h2>
            <p className="mt-2 text-sm text-masaar-black/60">
              {landingContent?.cta_line || "Reach out and our team will guide you through the next steps."}
            </p>
          </div>

          <div className="hidden h-full w-px bg-black/10 lg:block" />

          <div>
            <div className="flex flex-col gap-3">
              <Link
                href={`tel:+${CONTACT.whatsappPhoneIntl}`}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-pure-gold px-5 py-4 text-sm font-semibold text-masaar-black transition-colors hover:bg-light-gold"
              >
                Call {CONTACT.phoneDisplay} · Speak to our team directly
              </Link>
              <WhatsAppButton
                templateKey="visa"
                params={{ visaType: "General enquiry" }}
                variant="whatsapp-green"
                className="w-full py-4"
              >
                Enquire on WhatsApp · Get quick support
              </WhatsAppButton>
            </div>
            <p className="mt-3 text-xs text-masaar-black/50">
              {landingContent?.cta_note || "Our team is available to assist you during working hours."}
            </p>
          </div>
        </Container>
      </section>

      <CrossLinkServices exclude="visa" />

      <FaqSection category="visa" />
    </>
  );
}
