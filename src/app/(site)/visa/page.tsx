import type { Metadata } from "next";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { ImportantNotice } from "@/components/site/ImportantNotice";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getActiveVisaTypes, getVisaDocumentContext } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";
import type { VisaDocumentContextKey } from "@/lib/types/database";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/visa",
    title: "Umrah Visa Requirements | Masaar Holidays",
    description:
      "Umrah visa requirements and documents, explained clearly — Masaar facilitates applications but always recommends verifying current rules with the relevant authority.",
  });
}

const CONTEXTS: VisaDocumentContextKey[] = [
  "umrah_package",
  "standalone_umrah_visa",
  "hotel",
  "hajj",
];

export default async function VisaPage() {
  const [visaTypes, ...contexts] = await Promise.all([
    getActiveVisaTypes(),
    ...CONTEXTS.map((key) => getVisaDocumentContext(key)),
  ]);

  return (
    <>
      <Hero
        eyebrow="Visa & Documents"
        h1="Umrah Visa Requirements & Documents"
        image="/brand/banners/default.png"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="visa" params={{ visaType: "General enquiry" }}>
            Enquire on WhatsApp
          </WhatsAppButton>
        </div>
      </Hero>

      {/* The six visa/document types — brief Part 2 */}
      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Visa Services" title="Visa & Document Assistance" />
          <div className="mt-10">
            {visaTypes.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visaTypes.map((visa) => (
                  <div key={visa.id} id={visa.slug} className="rounded-lg border border-black/10 bg-white p-6">
                    <h3 className="font-semibold text-masaar-black">{visa.name}</h3>
                    {visa.description && (
                      <p className="mt-2 text-sm text-masaar-black/70">{visa.description}</p>
                    )}
                    {visa.audience_text && (
                      <p className="mt-2 text-xs text-masaar-black/50">{visa.audience_text}</p>
                    )}
                    <div className="mt-4">
                      <WhatsAppButton templateKey="visa" params={{ visaType: visa.name }}>
                        Enquire on WhatsApp
                      </WhatsAppButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Visa types not published yet"
                note="Umrah Visa · UAE Visa · Global Visa · Saudi Tourist Visa · Emirates ID · Indian Visa — copy and per-nationality specifics pending Haseeb's input (content-seo-starter-kit.md, Section 4, item 13)."
              />
            )}
          </div>
        </Container>
      </section>

      {/* The 4 separate document-set contexts — brief Part 2 */}
      <section className="bg-warm-ivory py-16">
        <Container>
          <SectionHeading eyebrow="Documents Required" title="Document Checklists by Product" />
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-masaar-black/60">
            Umrah package, standalone Umrah visa, Hotel booking and Hajj package each have their
            own document checklist — kept separate rather than one generic list.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {contexts.map((entry, i) => {
              const key = CONTEXTS[i];
              const label =
                entry?.context.label ??
                { umrah_package: "Umrah Package", standalone_umrah_visa: "Standalone Umrah Visa", hotel: "Hotel Booking", hajj: "Hajj Package" }[key];
              return (
                <div key={key} className="rounded-lg border border-black/10 bg-white p-6">
                  <h3 className="font-semibold text-masaar-black">{label}</h3>
                  {entry && entry.documents.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-masaar-black/70">
                      {entry.documents.map((doc) => (
                        <li key={doc.id}>• {doc.title}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm italic text-masaar-black/40">
                      No documents listed yet — manage from Admin → Visa Content.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <ImportantNotice
              title="Important Information"
              points={[
                "Visa requirements, processing times and fees can change frequently and may vary based on your nationality.",
                "Please always verify the latest information with the relevant embassy, consulate or authority.",
                "Masaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.",
              ]}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
