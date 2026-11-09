import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ServiceFaqAccordion } from "@/components/site/ServiceFaqAccordion";
import { FaqSchema } from "@/components/site/FaqSchema";
import { CONTACT } from "@/lib/contact";
import { getAdditionalServiceBySlug } from "@/lib/data/additional-services";
import { buildPageMetadata } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const service = await getAdditionalServiceBySlug("umrah-guide");

  const title =
    service?.meta_title || "Umrah Guide in Makkah & Madinah | Masaar Holidays";
  const description =
    service?.meta_description ||
    "Get practical Umrah guidance and assistance with Ihram, Tawaf and Sa'i. Enquire about arranging an Umrah Guide with Masaar Holidays.";

  return buildPageMetadata({
    path: "/additional-services/umrah-guide",
    title,
    description,
    ogImageUrl: "/services/umrah-guide-hero.webp",
  });
}

export default async function UmrahGuidePage() {
  const service = await getAdditionalServiceBySlug("umrah-guide");

  if (!service) {
    notFound();
  }

  const origin = getSiteOrigin();
  const canonicalUrl = `${origin}/additional-services/umrah-guide`;

  const whatsappMessage = encodeURIComponent(
    "Hello Masaar Holidays, I would like to enquire about arranging an Umrah Guide in Makkah and Madinah for my upcoming pilgrimage."
  );
  const whatsappUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${whatsappMessage}`;

  // Structured Data (JSON-LD)
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl}#service`,
    name: "Umrah Guide in Makkah & Madinah",
    serviceType: "Pilgrimage Spiritual Guidance",
    description: service.short_description,
    provider: {
      "@type": "TravelAgency",
      name: "Masaar Holidays",
      url: "https://www.masaarholidays.com",
      telephone: "+971555670845",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Office 108, Al Zahra Building, Al Soor",
        addressLocality: "Sharjah",
        addressCountry: "AE",
      },
    },
    areaServed: [
      {
        "@type": "Place",
        name: "Makkah",
      },
      {
        "@type": "Place",
        name: "Madinah",
      },
      {
        "@type": "Place",
        name: "Sharjah",
      },
      {
        "@type": "Place",
        name: "Dubai",
      },
      {
        "@type": "Country",
        name: "United Arab Emirates",
      },
    ],
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Additional Services",
        item: `${origin}/additional-services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Umrah Guide",
        item: canonicalUrl,
      },
    ],
  };

  const faqItemsForSchema = (service.faqs || []).map((faq) => ({
    question: faq.q,
    answer: faq.a,
  }));

  return (
    <div className="min-h-screen bg-warm-ivory/20 text-masaar-black">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqItemsForSchema.length > 0 && <FaqSchema faqs={faqItemsForSchema} />}

      {/* Breadcrumbs */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-3">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Additional Services", href: "/additional-services" },
              { label: "Umrah Guide" },
            ]}
          />
        </Container>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-warm-ivory/80 via-white to-warm-ivory/30 py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <span className="inline-block font-semibold uppercase tracking-[0.2em] text-deep-gold text-xs">
                ADDITIONAL SERVICE —
              </span>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-masaar-black sm:text-4xl md:text-5xl lg:leading-[1.15]">
                {service.hero_headline || "Your Umrah Journey, Guided with Care"}
              </h1>
              <p className="mt-5 max-w-xl text-xs sm:text-sm leading-relaxed text-masaar-black/75">
                {service.hero_subtext ||
                  "Personal guidance and practical assistance to help you understand and complete the essential stages of Umrah with clarity and confidence."}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-lg bg-pure-gold px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-masaar-black shadow-md hover:bg-light-gold hover:shadow-lg transition-all"
                >
                  <svg
                    className="size-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Enquire on WhatsApp</span>
                </a>

                {/* Only render PDF if explicitly uploaded and approved */}
                {service.pdf_url && (
                  <a
                    href={service.pdf_url}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-black/20 bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-masaar-black hover:bg-black/5 transition-all"
                  >
                    <span>Download PDF</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-pure-gold/30 bg-warm-ivory shadow-lg">
                <Image
                  src="/services/umrah-guide-hero.webp"
                  alt="Umrah guide in Makkah and Madinah assisting pilgrims with rituals at the Holy Haram"
                  width={560}
                  height={320}
                  priority
                  className="h-auto w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="text-[11px] font-medium tracking-wide drop-shadow-md">
                    Curated Umrah With Care · Personal Attention at the Two Holy Mosques
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Introduction & Highlights */}
      <section className="py-14 sm:py-18 bg-white border-y border-black/5">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-4 text-xs sm:text-sm leading-relaxed text-masaar-black/80">
              <p className="font-semibold text-masaar-black text-sm sm:text-base leading-relaxed">
                At Masaar Holidays, we believe every Umrah journey deserves thoughtful guidance,
                personal attention and spiritual comfort.
              </p>
              <p>
                Our dedicated Umrah Guide service is designed to help pilgrims experience each stage
                of their sacred journey with confidence and understanding. Whether this is your first
                Umrah or a return journey, our experienced guides are here to make your pilgrimage
                easier and more meaningful.
              </p>
              <p>
                Pilgrims travel from the UAE with varying levels of familiarity with the rites of
                Umrah. By arranging personal guidance in Makkah and Madinah, you gain clarity on
                every step, allowing you to immerse your heart entirely in devotion and prayer.
              </p>
            </div>

            {/* Right Highlights Cards */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex items-start gap-4 rounded-xl border border-black/10 bg-warm-ivory/30 p-4 transition-colors hover:border-pure-gold/50">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold">
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-masaar-black">
                    Personal Guidance
                  </h3>
                  <p className="mt-0.5 text-xs text-masaar-black/70">
                    For Ihram, Tawaf, Sa&apos;i and key rituals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-black/10 bg-warm-ivory/30 p-4 transition-colors hover:border-pure-gold/50">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold">
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-masaar-black">
                    Spiritual Understanding
                  </h3>
                  <p className="mt-0.5 text-xs text-masaar-black/70">
                    Learn the meaning and significance of Umrah.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-black/10 bg-warm-ivory/30 p-4 transition-colors hover:border-pure-gold/50">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold">
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-masaar-black">
                    For Individuals, Families & Groups
                  </h3>
                  <p className="mt-0.5 text-xs text-masaar-black/70">
                    Tailored support for every traveller.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Ritual Guidance Details */}
      <section className="py-14 sm:py-18 bg-warm-ivory/30">
        <Container>
          <div className="max-w-3xl">
            <span className="font-semibold uppercase tracking-[0.2em] text-deep-gold text-xs">
              COMPREHENSIVE RITUAL SUPPORT
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
              Personal Guidance Throughout Your Pilgrimage
            </h2>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-masaar-black/75">
              Every stage of Umrah carries sacred meaning. Our guides provide thoughtful explanations
              and practical assistance, ensuring you perform each ritual in accordance with the
              Sunnah.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-2xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold font-bold text-sm">
                01
              </div>
              <h3 className="mt-4 font-semibold text-sm text-masaar-black">Preparing for Ihram</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Understand the state of Ihram, Miqat boundaries, intention (Niyyah), Talbiyah
                etiquette, and the rules governing what is permissible and prohibited.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-2xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold font-bold text-sm">
                02
              </div>
              <h3 className="mt-4 font-semibold text-sm text-masaar-black">Understanding Tawaf</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Learn how to enter Masjid Al-Haram, begin from the Black Stone, complete the seven
                circuits, and offer the two Rak&apos;ahs behind Maqam Ibrahim.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-2xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold font-bold text-sm">
                03
              </div>
              <h3 className="mt-4 font-semibold text-sm text-masaar-black">Understanding Sa&apos;i</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Practical pacing and guidance between Safa and Marwa, recalling the devotion of
                Sayyidatina Hajar, supplications at each mount, and completion with Halq or Taqsir.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-2xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold font-bold text-sm">
                04
              </div>
              <h3 className="mt-4 font-semibold text-sm text-masaar-black">More Than Guidance</h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                Beyond physical movements, gain spiritual understanding and historical context
                behind the sacred sites and traditions of Makkah and Madinah.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* What You Can Expect */}
      <section className="py-14 sm:py-18 bg-white">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
              What You Can Expect
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-masaar-black/70">
              Clear, dependable assistance structured to give you spiritual peace and comfort.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(service.expectations || []).map((exp, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-black/10 bg-warm-ivory/20 p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-pure-gold/50 hover:bg-white hover:shadow-xs"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-pure-gold/15 text-deep-gold">
                  {idx === 0 && (
                    <svg
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                      />
                    </svg>
                  )}
                  {idx === 1 && (
                    <svg
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                  )}
                  {idx === 2 && (
                    <svg
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  )}
                  {idx === 3 && (
                    <svg
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                  )}
                </div>
                <h3 className="mt-4 font-semibold text-xs sm:text-sm text-masaar-black">
                  {exp.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why Choose Masaar Holidays */}
      <section className="py-14 sm:py-18 bg-warm-ivory/40 border-t border-black/5">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Title */}
            <div className="lg:col-span-5">
              <span className="font-semibold uppercase tracking-[0.2em] text-deep-gold text-xs">
                CURATED UMRAH WITH CARE
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl md:text-4xl">
                Why Choose Masaar Holidays for Your Umrah Guidance?
              </h2>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-masaar-black/75">
                Our approach blends reverent care with organised professionalism, giving you and
                your family complete reassurance every step of the pilgrimage.
              </p>
            </div>

            {/* Right Checklist */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
                {(service.why_choose || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-pure-gold/25 text-deep-gold text-xs font-bold">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm text-masaar-black leading-relaxed">
                        <strong className="font-semibold text-masaar-black">{item.title}:</strong>{" "}
                        <span className="text-masaar-black/75">{item.description}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Recommended Hotels Section */}
      <section className="py-14 sm:py-18 bg-white border-t border-black/5">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
              Our Recommended Hotels
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-masaar-black/70">
              Comfortable and conveniently located stays for a smoother Umrah experience.
            </p>
            <p className="mt-2 text-[11px] text-masaar-black/60 italic">
              * Note: Hotel accommodation and reservations are separate from the Umrah Guide
              service unless explicitly booked or bundled together in your custom pilgrimage
              package.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Makkah Hotel Card */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-warm-ivory/20 shadow-2xs transition-all hover:border-pure-gold/40">
              <div className="grid grid-cols-1 sm:grid-cols-12">
                <div className="relative h-48 sm:h-auto sm:col-span-5 bg-warm-ivory">
                  <Image
                    src="/hotels/makkah-towers-swissotel.webp"
                    alt="Makkah Towers / Swissôtel near the Grand Mosque in Makkah"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5 sm:col-span-7 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-deep-gold">
                      <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Makkah
                    </span>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-base font-bold text-masaar-black">
                      Makkah Towers / Swissôtel or similar
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs text-masaar-black/75">
                      <li className="flex items-center gap-2">
                        <span>🚶</span>
                        <span>Approximately 100 metres from the Haram</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span>Around 2 minutes&apos; walking distance</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/5">
                    <Link
                      href="/hotels"
                      className="text-xs font-semibold text-deep-gold hover:underline"
                    >
                      Explore Makkah Stays →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Madinah Hotel Card */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-warm-ivory/20 shadow-2xs transition-all hover:border-pure-gold/40">
              <div className="grid grid-cols-1 sm:grid-cols-12">
                <div className="relative h-48 sm:h-auto sm:col-span-5 bg-warm-ivory">
                  <Image
                    src="/hotels/anwar-al-madinah-movenpick.webp"
                    alt="Anwar Al Madinah Mövenpick hotel near the Prophet's Mosque in Madinah"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5 sm:col-span-7 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-deep-gold">
                      <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Madinah
                    </span>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-base font-bold text-masaar-black">
                      Anwar Al Madinah Mövenpick or similar
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs text-masaar-black/75">
                      <li className="flex items-center gap-2">
                        <span>🚶</span>
                        <span>Approximately 50 metres from the Haram</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span>Around 1 minute walking distance, with a flat pathway</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/5">
                    <Link
                      href="/hotels"
                      className="text-xs font-semibold text-deep-gold hover:underline"
                    >
                      Explore Madinah Stays →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQs & Tour Information (Two Columns) */}
      <section className="py-14 sm:py-18 bg-warm-ivory/30 border-t border-black/5">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Left: FAQs */}
            <div className="lg:col-span-7">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-1 text-xs text-masaar-black/60">
                Key questions about arranging an Umrah guide with Masaar Holidays.
              </p>

              <div className="mt-6">
                <ServiceFaqAccordion faqs={service.faqs || []} />
              </div>
            </div>

            {/* Right: Tour Information Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-black/10 bg-[#F9F6F0] p-6 sm:p-7 shadow-xs">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">
                  Tour Information
                </h3>

                <div className="mt-6 space-y-5 border-t border-black/10 pt-5 text-xs sm:text-sm">
                  {/* Availability */}
                  {service.tour_info?.availability && (
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold">
                        <svg
                          className="size-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                          />
                        </svg>
                      </span>
                      <div>
                        <span className="block font-semibold text-masaar-black">Availability</span>
                        <span className="mt-0.5 block text-masaar-black/75">
                          {service.tour_info.availability}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Important Reminder */}
                  {service.tour_info?.important_reminder && (
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pure-gold/20 text-deep-gold">
                        <svg
                          className="size-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                          />
                        </svg>
                      </span>
                      <div>
                        <span className="block font-semibold text-masaar-black">
                          Important Reminder
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-masaar-black/75">
                          {service.tour_info.important_reminder}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Only render PDF if explicitly uploaded and approved */}
                {service.pdf_url && (
                  <div className="mt-6 border-t border-black/10 pt-4">
                    <a
                      href={service.pdf_url}
                      download
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/20 bg-white py-3 text-xs font-semibold uppercase tracking-wider text-masaar-black hover:bg-black/5 transition-all"
                    >
                      <span>Download PDF</span>
                    </a>
                  </div>
                )}

                <div className="mt-6 border-t border-black/10 pt-5">
                  <p className="text-[11px] leading-relaxed text-masaar-black/60">
                    💡 <strong>Combine with Umrah Packages:</strong> Looking for a full flight,
                    hotel, and visa package? Our advisors can include dedicated guide arrangements
                    directly into your itinerary.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/umrah"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-deep-gold hover:underline"
                    >
                      <span>View All Umrah Packages</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Bottom Dark CTA Banner */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white text-center sm:py-20">
        <Container className="relative z-10">
          <div className="max-w-xl mx-auto">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl text-white">
              Book Your Umrah Guide Today
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed">
              Let Masaar Holidays be part of your blessed journey. Experience your pilgrimage with
              greater clarity, comfort and devotion.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-lg bg-pure-gold px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-masaar-black shadow-lg hover:bg-light-gold transition-all"
              >
                <svg
                  className="size-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Enquire Now on WhatsApp</span>
              </a>
              <Link
                href="/additional-services"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-white/30 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
              >
                All Additional Services
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

