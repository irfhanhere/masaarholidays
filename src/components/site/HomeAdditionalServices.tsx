import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { buildServiceWhatsAppUrl } from "@/lib/whatsapp-templates";
import type { AdditionalServiceRow } from "@/lib/types/database";

interface Props {
  services: AdditionalServiceRow[];
}

function ServiceIcon({ name }: { name: string }) {
  switch (name) {
    case "wheelchair":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <circle cx="12" cy="4" r="2" />
          <path d="M5 19a5 5 0 1 0 10 0" />
          <path d="M14 13h4l2 5" />
          <path d="M9 19V10h5" />
        </svg>
      );
    case "mountain":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      );
    case "mosque":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="M12 2v2M10 4a4 4 0 0 1 4 0v3H10V4zM4 10h16v11H4V10zM10 21v-5a2 2 0 0 1 4 0v5" />
        </svg>
      );
    case "car":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "map-pin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "luggage":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <rect width="16" height="14" x="4" y="7" rx="2" />
          <path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3M9 21v1M15 21v1" />
        </svg>
      );
    case "baby":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="M9 12h.01M15 12h.01M10 16c.5.5 1.2.8 2 .8s1.5-.3 2-.8M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 5 6.3" />
        </svg>
      );
    case "users":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
  }
}

export function HomeAdditionalServices({ services }: Props) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="additional-services-heading"
      className="relative overflow-hidden bg-gradient-to-b from-white via-warm-ivory/25 to-white py-16 sm:py-24 border-t border-black/5"
    >
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-6 sm:w-10 bg-pure-gold/50" />
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#936E0F]">
              Additional Services
            </p>
            <span className="h-px w-6 sm:w-10 bg-pure-gold/50" />
          </div>

          <h2
            id="additional-services-heading"
            className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-masaar-black sm:text-4xl lg:text-5xl"
          >
            Enhance Your Umrah Journey
          </h2>

          <p className="mt-3 text-xs leading-relaxed text-masaar-black/70 sm:text-sm sm:leading-relaxed">
            Thoughtfully arranged services to make your pilgrimage more comfortable, organised and meaningful.
          </p>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {services.map((service) => {
            const enquiryUrl = buildServiceWhatsAppUrl(service.slug, {
              service_name: service.name,
              service_url: `https://www.masaarholidays.com/additional-services/${service.slug}`,
            });

            return (
              <article
                key={service.slug}
                className="group flex flex-col justify-between rounded-2xl border border-black/10 bg-white shadow-2xs hover:shadow-md hover:border-black/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div>
                  {/* Card Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-warm-ivory/50">
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    {/* Icon & Category */}
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-pure-gold/15 text-[#936E0F]">
                        <ServiceIcon name={service.icon} />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-black/50 truncate">
                        {service.category}
                      </span>
                    </div>

                    <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-masaar-black line-clamp-1">
                      {service.name}
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-masaar-black/70 line-clamp-3">
                      {service.short_description}
                    </p>
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="p-4 sm:p-5 pt-0">
                  <div className="flex items-center gap-2 pt-3 border-t border-black/5">
                    <Link
                      href={`/additional-services/${service.slug}`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg border border-black/15 bg-warm-ivory/40 py-2 px-2.5 text-xs font-semibold text-masaar-black hover:border-pure-gold hover:bg-pure-gold/15 transition-all text-center"
                    >
                      <span>View Details</span>
                      <span className="ml-1 text-deep-gold">→</span>
                    </Link>
                    <a
                      href={enquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Enquire about ${service.name} on WhatsApp`}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/15 bg-white text-masaar-black/70 hover:border-pure-gold hover:bg-pure-gold/15 hover:text-masaar-black transition-all"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-[#936E0F]" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* View All Additional Services Button */}
        <div className="mt-12 text-center">
          <Link
            href="/additional-services"
            className="inline-flex items-center gap-2.5 rounded-full bg-masaar-black px-7 py-3 text-xs font-semibold text-white shadow-md hover:bg-black/85 hover:shadow-lg transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-pure-gold" aria-hidden="true">
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <span>View All Additional Services</span>
            <span className="text-pure-gold">→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}

