import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";

export type ServiceKey =
  | "umrah"
  | "hajj"
  | "hotels"
  | "transfers"
  | "visa"
  | "esim"
  | "private-trips";

export interface CrossLinkService {
  key: ServiceKey;
  href: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

export const CROSS_LINK_SERVICES: CrossLinkService[] = [
  {
    key: "umrah",
    href: "/umrah",
    title: "Umrah",
    description: "Thoughtfully planned Umrah journeys for every generation of the family.",
    image: "/brand/banners/umrah.webp",
    alt: "Umrah pilgrimage package in Makkah and Madinah",
  },
  {
    key: "hajj",
    href: "/hajj",
    title: "Hajj",
    description: "A guided Hajj journey, planned with care from arrival to return.",
    image: "/brand/Explore cards/explore-hajj.jpg",
    alt: "Hajj guided pilgrimage package at Mount Arafat",
  },
  {
    key: "hotels",
    href: "/hotels",
    title: "Makkah & Madinah Accommodation",
    description: "A handpicked selection of hotels to suit different needs and preferences.",
    image: "/brand/Explore cards/explore-hotels.jpg",
    alt: "Makkah and Madinah hotel accommodation options",
  },
  {
    key: "transfers",
    href: "/transfers",
    title: "Private Transfers",
    description: "Reliable and comfortable transport across all major routes.",
    image: "/brand/Explore cards/explore-transfers.jpg",
    alt: "Private chauffeur transfer vehicle for Saudi Arabia travel",
  },
  {
    key: "visa",
    href: "/visa",
    title: "Visa Assistance",
    description: "Simple, reliable visa processing with dedicated support.",
    image: "/brand/Explore cards/explore-visa.jpg",
    alt: "Saudi Arabia Umrah and tourist visa assistance",
  },
  {
    key: "esim",
    href: "/esim",
    title: "eSIM",
    description: "Instant prepaid 4G/5G data connectivity across Saudi Arabia and the UAE.",
    image: "/brand/Explore cards/explore-esim.jpg",
    alt: "Saudi Arabia prepaid travel eSIM connectivity on mobile phone",
  },
  {
    key: "private-trips",
    href: "/private-trips",
    title: "Private Trips",
    description: "Privately arranged journeys to meaningful places around Makkah and Madinah.",
    image: "/brand/Explore cards/explore-private-trips.jpg",
    alt: "Private Ziyarat tour and historical excursion in Makkah and Madinah",
  },
];

export function CrossLinkServices({
  exclude,
  eyebrow = "Explore More",
  title = "Thoughtful Services for Every Part of Your Journey",
  subtitle = "Complete arrangements with personal care and trusted support from start to finish.",
  className = "py-16",
}: {
  exclude?: ServiceKey | ServiceKey[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const excludedKeys = Array.isArray(exclude) ? exclude : exclude ? [exclude] : [];
  const filteredServices = CROSS_LINK_SERVICES.filter((s) => !excludedKeys.includes(s.key));

  return (
    <section className={className}>
      <Container>
        <div className="text-center">
          <SectionHeading eyebrow={eyebrow} title={title} />
          {subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-sm text-masaar-black/70 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`mt-10 grid gap-6 ${
            filteredServices.length === 4
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {filteredServices.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition-all hover:border-pure-gold hover:shadow-md"
            >
              <div className="relative h-48 w-full overflow-hidden bg-warm-ivory">
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold text-masaar-black transition-colors group-hover:text-deep-gold">
                  {service.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-masaar-black/60">
                  {service.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-deep-gold group-hover:underline">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

export { CrossLinkServices as ExploreMore };

