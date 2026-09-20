import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Hero } from "@/components/site/Hero";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { VisaIcon, FamilyIcon, WarningTriangleIcon } from "@/components/site/icons";
import { CONTACT } from "@/lib/contact";
import type { VisaDocumentRow, VisaTypeRow } from "@/lib/types/database";

const FALLBACK_IMPORTANT_INFO =
  "Visa requirements, processing times and fees can change frequently and may vary based on your nationality. Please always verify the latest information with the relevant embassy, consulate or authority.\nMasaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.";

/**
 * One shared detail-page template for all 6 visa types (Umrah, UAE,
 * Global, Saudi Tourist, Emirates ID, India) at /visa/[slug] — layout and
 * components are identical across every type; only `visaType`/`documents`
 * (per-slug data) differ. Matches the reference mockups' structure:
 * hero + 4-icon feature strip, Documents Required grid, Important
 * Information callout, optional Who May Need This section, dual CTA.
 */
export function VisaDetailTemplate({
  visaType,
  documents,
}: {
  visaType: VisaTypeRow;
  documents: VisaDocumentRow[];
}) {
  const eyebrow = visaType.name.toUpperCase();
  const headline = visaType.hero_headline || visaType.name;
  const heroImage = visaType.hero_image_url || (visaType.slug === "umrah" ? "/brand/banners/umrah.png" : "/brand/banners/default.png");
  const importantInfo = (visaType.important_info_text || FALLBACK_IMPORTANT_INFO)
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <Breadcrumbs items={[{ label: "Visa", href: "/visa" }, { label: visaType.name }]} />
      <Hero eyebrow={eyebrow} h1={headline} image={heroImage}>
        {visaType.hero_intro && <p className="mt-4 text-sm text-masaar-black/75 sm:text-base">{visaType.hero_intro}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="visa" params={{ visaType: visaType.name }}>
            Enquire on WhatsApp
          </WhatsAppButton>
        </div>
      </Hero>

      {visaType.features.length > 0 && (
        <section className="bg-warm-ivory py-10">
          <Container>
            <div className="grid divide-y divide-black/10 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
              {visaType.features.map((feature, i) => (
                <div key={i} className="flex flex-col items-center gap-2 px-4 py-4 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-white text-deep-gold">
                    <VisaIcon iconKey={feature.icon_key} className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-masaar-black">{feature.label}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow={eyebrow} title="Documents Required" />
          {visaType.documents_intro && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-masaar-black/60">
              {visaType.documents_intro}
            </p>
          )}

          <div className="mt-10">
            {documents.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-black/10 bg-white p-6">
                    <span className="flex size-10 items-center justify-center text-deep-gold">
                      <VisaIcon iconKey={doc.icon_key} className="size-6" />
                    </span>
                    <h3 className="mt-3 font-semibold text-masaar-black">{doc.title}</h3>
                    {doc.description && <p className="mt-1 text-sm text-masaar-black/60">{doc.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Document checklist pending"
                note={`Documents for ${visaType.name} will appear here once added in Admin → Visa Types.`}
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

      {visaType.who_needs_this.length > 0 && (
        <section className="py-16">
          <Container>
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <FamilyIcon className="size-5" />
                </span>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
                  Who May Need This Service?
                </h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-masaar-black/70">
                {visaType.who_needs_this.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-pure-gold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      <section className="bg-warm-ivory py-16">
        <Container className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-masaar-black sm:text-3xl">
              Start Your
              <br />
              {visaType.name} Application
            </h2>
            <p className="mt-2 text-sm text-masaar-black/60">
              Reach out and our team will guide you through the next steps.
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
                params={{ visaType: visaType.name }}
                variant="whatsapp-green"
                className="w-full py-4"
              >
                Enquire on WhatsApp · Get quick support
              </WhatsAppButton>
            </div>
            <p className="mt-3 text-xs text-masaar-black/50">
              {visaType.cta_note || "Our team is available to assist you during working hours."}
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
