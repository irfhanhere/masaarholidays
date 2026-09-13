import type { Metadata } from "next";
import { ContentPending, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { FamilyIcon, HeartHandIcon, LocationIcon } from "@/components/site/icons";

export const metadata: Metadata = {
  title: "About Masaar Holidays | Family-Focused Umrah Travel",
  description:
    "Masaar Holidays is an Umrah travel company serving families from the UAE with thoughtfully planned journeys, personal support and considered arrangements.",
};

// Values grid is structural placeholder — labels only, per brief's "Guided
// by What Matters" values row. Descriptions pending final copy.
const VALUES = ["Honesty", "Care", "Responsibility", "Good Service", "Halal", "Giving Back"];

export default function AboutPage() {
  return (
    <>
      <Hero
        eyebrow="About Masaar"
        h1="Every Journey Paced Around the Family, Not the Group"
        image="/brand/banners/destination.png"
      />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Our Purpose" title="More Than a Trip, a More Meaningful Journey" align="left" />
          <div className="mt-4 max-w-3xl">
            <ContentPending />
          </div>
        </Container>
      </section>

      <section className="bg-warm-ivory py-16">
        <Container className="grid gap-10 sm:grid-cols-2">
          <div className="flex gap-4">
            <LocationIcon className="size-8 shrink-0 text-deep-gold" />
            <div>
              <h3 className="font-semibold text-masaar-black">Our Vision</h3>
              <div className="mt-2">
                <ContentPending />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <HeartHandIcon className="size-8 shrink-0 text-deep-gold" />
            <div>
              <h3 className="font-semibold text-masaar-black">Our Mission</h3>
              <div className="mt-2">
                <ContentPending />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Our Values" title="Guided by What Matters" />
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {VALUES.map((value) => (
              <div key={value} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <FamilyIcon className="size-6" />
                </span>
                <p className="text-sm font-medium text-masaar-black">{value}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-warm-ivory py-16">
        <Container>
          <SectionHeading eyebrow="Our Approach" title="A Different Kind of Travel Partner" align="left" />
          <div className="mt-4 max-w-3xl">
            <ContentPending />
          </div>
        </Container>
      </section>

      {/*
        A Note from the Founder — stays unsigned per Haseeb's explicit
        instruction: no founder name, no personal photo, anywhere on the
        site (brief, "Brand system (locked)").
      */}
      <section className="py-16">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="A Note from the Founder" title="A Personal Commitment" align="left" />
          <div className="mt-4">
            <ContentPending note="First-person founder note pending — signed generically (e.g. “— The Masaar Team”), never with a personal name or photo." />
          </div>
        </Container>
      </section>
    </>
  );
}
