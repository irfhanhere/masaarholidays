import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";

const STATS = [
  {
    stat: "17+",
    label: "Years of Travel Experience",
    subtitle:
      "Decades of experience across Umrah, holidays, corporate and premium travel.",
  },
  {
    stat: "UAE",
    label: "Based & Supported",
    subtitle:
      "A dedicated team based in the UAE, Saudi, India, Qatar & USA, available to coordinate your journey from planning to return.",
  },
  {
    stat: "First-Hand",
    label: "Hotels Personally Visited",
    subtitle:
      "We don't select hotels from listings alone. Our team has personally visited and experienced many of the hotels we recommend, including checking their location and walking distance to the Haram.",
  },
];

export function WhyMasaar() {
  return (
    <section className="bg-warm-ivory py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Why Masaar"
          title="Built on Personal Care & First-Hand Knowledge"
        />

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
          {STATS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center rounded-xl border border-black/10 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md sm:p-8"
            >
              <div className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-deep-gold sm:text-4xl">
                {item.stat}
              </div>
              <h3 className="mt-3 text-base font-semibold text-masaar-black">
                {item.label}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-masaar-black/70 sm:text-sm">
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs font-medium italic leading-relaxed text-masaar-black/75 sm:text-sm">
          &ldquo;We believe distance matters. That&apos;s why we personally visit and experience many of the hotels we recommend, so you can choose with greater confidence.&rdquo;
        </p>
      </Container>
    </section>
  );
}
