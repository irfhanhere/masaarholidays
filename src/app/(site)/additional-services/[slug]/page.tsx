import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { FaqSchema } from "@/components/site/FaqSchema";
import { ServiceFaqAccordion } from "@/components/site/ServiceFaqAccordion";
import { buildServiceWhatsAppUrl } from "@/lib/whatsapp-templates";
import {
  getAllPublishedAdditionalServices,
  getAdditionalServiceBySlug,
} from "@/lib/data/additional-services";
import { buildPageMetadata } from "@/lib/i18n";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getAdditionalServiceBySlug(slug);

  if (!service) {
    return buildPageMetadata({
      path: `/additional-services/${slug}`,
      title: "Service Not Found | Masaar Holidays",
      description: "The requested Umrah service could not be found.",
    });
  }

  return buildPageMetadata({
    path: `/additional-services/${service.slug}`,
    title: service.meta_title || `${service.name} for Umrah | Masaar Holidays`,
    description: service.meta_description || service.short_description,
    ogImageUrl: service.image_url,
  });
}

export default async function AdditionalServiceDetailPage({ params }: Props) {
  const { slug } = await params;

  if (slug === "umrah-guide") {
    redirect("/additional-services/umrah-guide");
  }

  const service = await getAdditionalServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const canonicalUrl = `https://www.masaarholidays.com/additional-services/${service.slug}`;
  const whatsappUrl = buildServiceWhatsAppUrl(service.slug, {
    service_name: service.name,
    service_url: canonicalUrl,
  });

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.short_description,
    provider: {
      "@type": "TravelAgency",
      name: "Masaar Holidays",
      url: "https://www.masaarholidays.com",
    },
    areaServed: [
      { "@type": "City", name: "Makkah" },
      { "@type": "City", name: "Madinah" },
      { "@type": "Country", name: "Saudi Arabia" },
    ],
    serviceType: service.category,
    url: canonicalUrl,
    ...(service.price_type === "fixed" && service.price_aed
      ? {
          offers: {
            "@type": "Offer",
            price: service.price_aed,
            priceCurrency: "AED",
          },
        }
      : {}),
  };

  const visibleFaqs = (service.faqs || []).filter((f) => f.published !== false);
  const faqItemsForSchema = visibleFaqs.map((faq) => ({
    question: faq.q,
    answer: faq.a,
  }));

  return (
    <div className="min-h-screen bg-warm-ivory/20 text-masaar-black">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqItemsForSchema.length > 0 && <FaqSchema faqs={faqItemsForSchema} />}

      {/* Breadcrumbs */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Additional Services", href: "/additional-services" },
              { label: service.name },
            ]}
          />
        </Container>
      </div>

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white sm:py-24">
        <div className="absolute inset-0 z-0 opacity-25">
          <Image
            src={service.image_url}
            alt={service.image_alt || service.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/85 to-transparent" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-pure-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pure-gold border border-pure-gold/30">
              — {service.category.toUpperCase()} —
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-5xl text-white">
              {service.name}
            </h1>
            <p className="mt-4 text-xs leading-relaxed text-white/80 sm:text-sm sm:leading-relaxed">
              {service.short_description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-masaar-black shadow-lg hover:bg-light-gold transition-all"
              >
                <span>Enquire About {service.name}</span>
                <span>→</span>
              </a>
              <Link
                href="/additional-services"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-all"
              >
                All Services
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content Details */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Descriptions & Inclusions */}
            <div className="lg:col-span-8 space-y-10">
              {/* Full Description */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  Your Umrah Journey, Guided with Care
                </h2>
                <div className="mt-4 text-xs leading-relaxed text-masaar-black/75 sm:text-sm sm:leading-relaxed space-y-4">
                  <p>
                    {service.full_description ||
                      "At Masaar Holidays, we believe every Umrah journey deserves thoughtful planning, personal attention, and spiritual comfort. Our dedicated services are tailored to help pilgrims experience each stage of their sacred journey with confidence, understanding, and peace of mind."}
                  </p>
                  <p>
                    Whether this is your first Umrah or a return pilgrimage, our experienced team and licensed ground coordinators are here to make your journey smoother, more meaningful, and completely stress-free.
                  </p>
                </div>
              </div>

              {/* Key Inclusions & Features */}
              {service.features && service.features.length > 0 && (
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                    What to Expect
                  </h2>
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {service.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-black/5 bg-warm-ivory/30 p-4"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-[#936E0F] text-xs font-bold">
                          ✓
                        </span>
                        <p className="text-xs font-medium text-masaar-black/85 leading-relaxed">
                          {feature}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service FAQs if available */}
              {visibleFaqs.length > 0 && (
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black mb-6">
                    Frequently Asked Questions
                  </h2>
                  <ServiceFaqAccordion faqs={visibleFaqs} />
                </div>
              )}

              {/* Our Recommended Hotels */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  Our Recommended Hotels
                </h2>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Comfortable and conveniently located stays for a smoother Umrah experience.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/10 bg-warm-ivory/20 p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                      Makkah Al-Mukarramah
                    </span>
                    <h3 className="mt-1 font-semibold text-masaar-black text-sm">
                      Makkah Towers / Swissôtel or similar
                    </h3>
                    <ul className="mt-3 space-y-1.5 text-xs text-masaar-black/70">
                      <li>• Approximately 100 metres from the Haram</li>
                      <li>• Around 2 minutes walking distance</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-black/10 bg-warm-ivory/20 p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                      Madinah Al-Munawwarah
                    </span>
                    <h3 className="mt-1 font-semibold text-masaar-black text-sm">
                      Anwar Al Madinah Mövenpick or similar
                    </h3>
                    <ul className="mt-3 space-y-1.5 text-xs text-masaar-black/70">
                      <li>• Approximately 50 metres from the Haram</li>
                      <li>• Around 1 minute walk via flat walking pathway</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Booking Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-pure-gold/40 bg-white p-6 shadow-sm">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                  Service Information
                </h3>

                <div className="mt-4 space-y-3 border-t border-black/5 pt-4 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-masaar-black/60">Availability:</span>
                    <span className="font-semibold text-masaar-black">
                      {service.tour_info?.availability || "Arranged on confirmation"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-masaar-black/60">Pricing:</span>
                    <span className="font-semibold text-deep-gold">
                      {service.price_type === "fixed" && service.price_aed
                        ? `AED ${service.price_aed}`
                        : service.price_type === "from" && service.price_aed
                        ? `From AED ${service.price_aed}`
                        : "Tailored on Request"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-masaar-black/60">Locations:</span>
                    <span className="font-semibold text-masaar-black">Makkah & Madinah</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-black/5 pt-4">
                  <p className="text-[11px] text-masaar-black/60 leading-relaxed">
                    💡 <strong>Need to bundle with flights or hotels?</strong> Our Umrah concierge can add this service directly to your personalized package quotation.
                  </p>
                </div>

                <div className="mt-6">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-pure-gold py-3 text-xs font-bold uppercase tracking-wider text-masaar-black shadow hover:bg-light-gold transition-all"
                  >
                    Enquire on WhatsApp Now
                  </a>
                </div>
              </div>

              {/* Assistance Card */}
              <div className="rounded-2xl border border-black/10 bg-warm-ivory p-6 text-center">
                <h4 className="font-semibold text-sm text-masaar-black">Have Questions?</h4>
                <p className="mt-1 text-xs text-masaar-black/70 leading-relaxed">
                  Speak with our UAE-based team for bespoke coordination and family arrangements.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-block text-xs font-bold text-deep-gold hover:underline"
                >
                  Contact Masaar Concierge →
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Cross-Link Services: Thoughtful Services for Every Part of Your Journey */}
      <CrossLinkServices
        exclude={[service.slug]}
        className="py-16 bg-white border-t border-black/5"
      />
    </div>
  );
}
