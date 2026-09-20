import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";

export type ServiceKey = "umrah" | "hajj" | "hotels" | "transfers" | "visa" | "private-trips";

export interface CrossLinkService {
  key: ServiceKey;
  href: string;
  title: string;
  description: string;
  image: string;
}

export const CROSS_LINK_SERVICES: CrossLinkService[] = [
  {
    key: "umrah",
    href: "/umrah",
    title: "Umrah",
    description: "Thoughtfully planned Umrah journeys for every generation of the family.",
    image: "/brand/banners/umrah.png",
  },
  {
    key: "hajj",
    href: "/hajj",
    title: "Hajj",
    description: "A guided Hajj journey, planned with care from arrival to return.",
    image: "/brand/Explore cards/explore-hajj.jpg",
  },
  {
    key: "hotels",
    href: "/hotels",
    title: "Makkah & Madinah Accommodation",
    description: "A handpicked selection of hotels to suit different needs and preferences.",
    image: "/brand/Explore cards/explore-hotels.jpg",
  },
  {
    key: "transfers",
    href: "/transfers",
    title: "Private Transfers",
    description: "Reliable and comfortable transport across all major routes.",
    image: "/brand/Explore cards/explore-transfers.jpg",
  },
  {
    key: "visa",
    href: "/visa",
    title: "Visa Assistance",
    description: "Simple, reliable visa processing with dedicated support.",
    image: "/brand/Explore cards/explore-visa.jpg",
  },
  {
    key: "private-trips",
    href: "/private-trips",
    title: "Private Trips",
    description: "Privately arranged journeys to meaningful places around Makkah and Madinah.",
    image: "/brand/Explore cards/explore-private-trips.jpg",
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
                  alt={service.title}
                  fill
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
