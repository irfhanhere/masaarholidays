import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { FaqSection } from "@/components/site/FaqSection";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { buildServiceWhatsAppUrl } from "@/lib/whatsapp-templates";
import { getAllPublishedAdditionalServices } from "@/lib/data/additional-services";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/additional-services",
    title: "Additional Services for Umrah & Pilgrimage | Masaar Holidays",
    description:
      "Enhance your Umrah journey with curated services: Umrah guides, wheelchair assistance, Makkah & Madinah Ziyarah, private transport and VIP support.",
    ogImageUrl: "/brand/banners/umrah.webp",
  });
}

export default async function AdditionalServicesPage() {
  const services = await getAllPublishedAdditionalServices();

  return (
    <div className="min-h-screen bg-warm-ivory/20 text-masaar-black">
      {/* Breadcrumbs */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Additional Services" },
            ]}
          />
        </Container>
      </div>

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white sm:py-20">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src="/brand/banners/umrah.webp"
            alt="Masaar Holidays Additional Services"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-masaar-black via-masaar-black/80 to-transparent" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-pure-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pure-gold border border-pure-gold/30">
              — THOUGHTFUL ENHANCEMENTS —
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-5xl text-white">
              Additional Services for Your Umrah Journey
            </h1>
            <p className="mt-4 text-xs leading-relaxed text-white/80 sm:text-sm sm:leading-relaxed">
              Choose from a range of carefully arranged services to make your pilgrimage to Makkah and Madinah more comfortable, organised and spiritually enriching.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Services Catalog */}
      <section className="py-16">
        <Container>
          {/* Services Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const enquiryUrl = buildServiceWhatsAppUrl(service.slug, {
                service_name: service.name,
                service_url: `https://www.masaarholidays.com/additional-services/${service.slug}`,
              });

              return (
                <article
                  key={service.slug}
                  className="group flex flex-col justify-between rounded-2xl border border-black/10 bg-white shadow-2xs hover:shadow-md hover:border-black/20 transition-all duration-300 overflow-hidden"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-warm-ivory/50">
                      <Image
                        src={service.image_url}
                        alt={service.image_alt || service.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 rounded-full bg-masaar-black/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pure-gold">
                        {service.category}
                      </span>
                    </div>

                    <div className="p-6">
                      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-masaar-black">
                        {service.name}
                      </h2>
                      <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
                        {service.short_description}
                      </p>

                      {service.features && service.features.length > 0 && (
                        <ul className="mt-4 space-y-1.5 border-t border-black/5 pt-4 text-xs text-masaar-black/75">
                          {service.features.slice(0, 3).map((feat, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-deep-gold font-bold">✓</span>
                              <span className="truncate">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <div className="flex items-center gap-3 pt-4 border-t border-black/5">
                      <Link
                        href={`/additional-services/${service.slug}`}
                        className="flex-1 inline-flex items-center justify-center rounded-lg border border-black/15 bg-warm-ivory/40 py-2.5 px-3 text-xs font-semibold text-masaar-black hover:border-pure-gold hover:bg-pure-gold/15 transition-all text-center"
                      >
                        <span>View Details</span>
                        <span className="ml-1 text-deep-gold">→</span>
                      </Link>
                      <a
                        href={enquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg bg-pure-gold px-4 py-2.5 text-xs font-bold text-masaar-black shadow hover:bg-light-gold transition-all"
                      >
                        Enquire
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Why Choose Masaar Holidays */}
      <section className="bg-white py-16 border-t border-black/5">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="md:col-span-1">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                Why Choose Masaar Holidays?
              </h2>
            </div>
            <div className="rounded-xl border border-black/5 bg-warm-ivory/30 p-5">
              <p className="font-bold text-sm text-masaar-black">Reliable Service</p>
              <p className="mt-1 text-xs text-masaar-black/70">Trusted support throughout your pilgrimage journey.</p>
            </div>
            <div className="rounded-xl border border-black/5 bg-warm-ivory/30 p-5">
              <p className="font-bold text-sm text-masaar-black">Experienced Team</p>
              <p className="mt-1 text-xs text-masaar-black/70">Knowledgeable ground coordinators and caring assistance.</p>
            </div>
            <div className="rounded-xl border border-black/5 bg-warm-ivory/30 p-5">
              <p className="font-bold text-sm text-masaar-black">Personalised Care</p>
              <p className="mt-1 text-xs text-masaar-black/70">Tailored arrangements for individuals, families and seniors.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Cross-Link Services: Thoughtful Services for Every Part of Your Journey */}
      <CrossLinkServices
        className="py-16 bg-warm-ivory/30 border-t border-black/5"
      />

      {/* FAQ Section: Frequently Asked Questions & Your Questions, Our Guidance */}
      <FaqSection
        category="additional_services"
        title="Your Questions, Our Guidance"
        subtitle="Clear answers to common questions about our additional pilgrimage services in Makkah and Madinah."
        className="py-16 bg-white border-t border-black/5"
      />
    </div>
  );
}
