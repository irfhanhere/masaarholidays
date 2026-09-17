import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { IconByKey, DocumentIcon, EyeIcon, MountainFlagIcon } from "@/components/site/icons";
import { getAboutContent } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import type { AboutIconItem } from "@/lib/types/database";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/about",
    fallbackTitle: "About Masaar Holidays | Family-Focused Umrah Travel",
    fallbackDescription:
      "Masaar Holidays is an Umrah travel company serving families from the UAE with thoughtfully planned journeys, personal support and considered arrangements.",
  });
}

const FEATURES = [
  { icon: DocumentIcon, title: "Faith-Led Travel", subtitle: "Rooted in sincerity and care" },
  { icon: MountainFlagIcon, title: "Family-Paced Journeys", subtitle: "Never rushed, never generic" },
  { icon: EyeIcon, title: "Honest Guidance", subtitle: "Clear, transparent support" },
  { icon: DocumentIcon, title: "Care at Every Step", subtitle: "Before, during and after" },
];

const DEFAULT_CORE_VALUES: AboutIconItem[] = [
  { icon_key: "document", label: "Honesty", description: "Clear information and no hidden surprises." },
  { icon_key: "heart", label: "Care", description: "Your comfort, our priority." },
  { icon_key: "family", label: "Responsibility", description: "We do what we say, and we follow through." },
  { icon_key: "headset", label: "Good Service", description: "Responsive, respectful and reliable support." },
  { icon_key: "dome", label: "Halal", description: "Faith-aligned travel in every detail." },
  { icon_key: "giving-hand", label: "Giving Back", description: "Using travel as a means to create positive impact." },
];

const DEFAULT_DIFFERENTIATORS: AboutIconItem[] = [
  { icon_key: "family", label: "Paced Around the Family", description: "Flexible itineraries that suit your needs, not a fixed group schedule." },
  { icon_key: "headset", label: "One Dedicated Point of Contact", description: "A real person who knows your journey from start to finish." },
  { icon_key: "kaaba", label: "Curated & Vetted Accommodation", description: "Comfortable, well-located hotels selected with care and trust." },
  { icon_key: "handshake", label: "The Relationship Continues", description: "We're here even after your trip, for future travel and ongoing support." },
];

function paragraphs(text: string | null | undefined, fallback: string): string[] {
  return (text || fallback).split("\n").map((p) => p.trim()).filter(Boolean);
}

export default async function AboutPage() {
  const about = await getAboutContent();

  const purposeParagraphs = paragraphs(
    about?.purpose_text,
    "Masaar was founded with a simple intention — to help families and individuals experience Umrah and Hajj with ease, dignity and peace of mind.\nWe know that every journey to the Holy Cities is deeply personal. It's not just about destinations or dates, but about faith, family and a lifelong memory. Our purpose is to make this journey accessible, comfortable and reassuring, with honest guidance and genuine care."
  );
  const sadaqahParagraphs = paragraphs(
    about?.sadaqah_text,
    "A part of what we do is dedicated to giving back. Through every journey, we aim to contribute towards initiatives that create ongoing benefit — supporting community projects, education and causes that help others on their journey, insha'Allah.\nTravel with purpose. Make a difference that lasts."
  );
  const founderParagraphs = paragraphs(
    about?.founder_text,
    "Masaar Holidays began with a sincere intention — to help people experience the beauty and peace of Umrah and Hajj in a better way. As a team who deeply values family and faith, we understand how important this journey is, and how much trust it requires.\nWe don't know how far Allah will take Masaar, but we do know this: we will always strive to do the right thing, communicate honestly, and take care of every traveller as we would our own family.\nThank you for considering Masaar. We look forward to being a part of your journey."
  );
  const founderSignoff = paragraphs(about?.founder_signoff, "With sincere regards,\nThe Masaar Holidays Team");
  const foundingStoryParagraphs = paragraphs(
    about?.founding_story_text,
    "Masaar Holidays began with a son's promise to his mother.\nIn 2018, after fifteen years of saving, a mother made her first and only journey for Umrah. She deserved to be cared for at every step. Instead, she found a cramped hotel room, a twenty-five-minute walk that left her in tears, and a guide who moved through Tawaf so quickly she couldn't finish her du'as.\nOne of the strongest women in her son's life sat on the marble floor outside the Haram — not overwhelmed by the sacredness of the moment, but exhausted and disappointed by how poorly the journey had been arranged. That day, a promise was made: that no pilgrim travelling with this family's company would ever be treated that way again.\nMasaar Holidays is that promise, kept — built on years spent learning the industry, forming real relationships with trusted hotels in Makkah and Madinah, and holding onto one simple standard: treat every traveller the way that mother deserved to be treated."
  );

  const coreValues = about?.core_values?.length ? about.core_values : DEFAULT_CORE_VALUES;
  const differentiators = about?.differentiators?.length ? about.differentiators : DEFAULT_DIFFERENTIATORS;

  return (
    <>
      <Hero
        eyebrow="About Masaar"
        h1="Every Journey Paced Around the Family, Not the Group"
        image="/brand/banners/destination.png"
      >
        <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
          {about?.hero_subline || "Faith-led travel, with clarity, care and peace at every step."}
        </p>
      </Hero>

      <section className="bg-warm-ivory py-10">
        <Container>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, subtitle }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-white text-deep-gold">
                  <Icon className="size-5" />
                </span>
                <p className="text-sm font-medium text-masaar-black">{title}</p>
                <p className="text-xs text-masaar-black/50">{subtitle}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Purpose */}
      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="Our Purpose" title="More Than a Trip, A More Meaningful Journey" align="left" />
            <div className="mt-4 max-w-xl space-y-3 text-sm leading-relaxed text-masaar-black/70">
              {purposeParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1.3fr_1fr] sm:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black/5">
              <Image src={about?.purpose_image_url || "/brand/banners/umrah.png"} alt="" fill className="object-cover" />
            </div>
            <div className="border-l-2 border-pure-gold pl-4">
              <p className="font-[family-name:var(--font-display)] text-lg italic leading-snug text-masaar-black">
                &ldquo;{about?.purpose_quote || "To serve those on the path to Allah with sincerity, care and responsibility."}&rdquo;
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/*
        Founding Story — the fuller origin story Our Purpose only gestures
        at. Third-person institutional voice throughout, no first-person
        language and no named individual, same standing rule as the
        Commitment section below.
      */}
      <section className="py-4">
        <Container className="grid gap-10 overflow-hidden rounded-lg bg-warm-ivory lg:grid-cols-2">
          <div className="relative h-64 lg:h-auto">
            <Image
              src={about?.founding_story_image_url || "/brand/banners/hajj.png"}
              alt=""
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">Our Founding Story</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
              {about?.founding_story_heading || "A Promise Kept"}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-masaar-black/70">
              {foundingStoryParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Vision & Mission */}
      <section className="bg-warm-ivory py-16">
        <Container className="grid gap-10 sm:grid-cols-2">
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold">
              <EyeIcon className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-masaar-black">Our Vision</h3>
              <p className="mt-2 text-sm leading-relaxed text-masaar-black/70">
                {about?.vision_text ||
                  "To be a trusted travel partner for families and individuals seeking Umrah and Hajj, known for honest guidance, reliable service and a more human, caring approach to spiritual travel."}
              </p>
            </div>
          </div>
          <div className="flex gap-4 sm:border-l sm:border-black/10 sm:pl-10">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold">
              <MountainFlagIcon className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-masaar-black">Our Mission</h3>
              <p className="mt-2 text-sm leading-relaxed text-masaar-black/70">
                {about?.mission_text ||
                  "To make Umrah and Hajj journeys simpler, safer and more meaningful by offering carefully curated travel experiences, transparent communication and dedicated support — before, during and after the trip."}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Our Values */}
      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Our Values" title="Guided by What Matters" />
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {coreValues.map((value, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                  <IconByKey iconKey={value.icon_key} className="size-6" />
                </span>
                <p className="text-sm font-medium text-masaar-black">{value.label}</p>
                <p className="text-xs text-masaar-black/50">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Sadaqah Jariyah */}
      <section className="py-4">
        <Container className="grid overflow-hidden rounded-lg lg:grid-cols-2">
          <div className="relative h-64 lg:h-auto">
            <Image src={about?.sadaqah_image_url || "/brand/banners/hajj.png"} alt="" fill className="object-cover" />
          </div>
          <div className="flex flex-col justify-center bg-warm-ivory p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">Giving Back</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
              Sadaqah Jariyah, A <span className="text-deep-gold">Lasting Impact</span>
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-masaar-black/70">
              {sadaqahParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Our Approach */}
      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="Our Approach" title="A Different Kind of Travel Partner" align="left" />
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-masaar-black/70">
              {about?.approach_text ||
                "Masaar is a private, family-focused travel brand. We are not a high-volume operator — and that's by design. Our focus is on quality over quantity, building genuine relationships, and ensuring every journey is planned with care, clarity and integrity."}
            </p>
          </div>
          <div className="rounded-lg bg-warm-ivory p-8">
            <p className="font-[family-name:var(--font-display)] text-xl italic leading-snug text-masaar-black">
              &ldquo;{about?.approach_quote || "We don't just arrange trips. We walk with you on a journey that brings you closer."}&rdquo;
            </p>
          </div>
        </Container>
      </section>

      {/* Who We Serve + What Makes Us Different */}
      <section className="bg-warm-ivory py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">Who We Serve</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
              Families, Individuals and Small Groups
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-masaar-black/70">
              {about?.who_we_serve_text ||
                "We support families, couples, elderly travellers and small groups who value a more personal, well-planned and faith-centered travel experience. Whether it's your first Umrah or a return visit, we are here to make the journey smoother and more meaningful."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">What Makes Masaar Different</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {differentiators.map((item, i) => (
                <div key={i} className="flex flex-col items-start gap-2">
                  <span className="flex size-11 items-center justify-center rounded-full bg-white text-deep-gold">
                    <IconByKey iconKey={item.icon_key} className="size-5" />
                  </span>
                  <p className="text-sm font-semibold text-masaar-black">{item.label}</p>
                  <p className="text-xs text-masaar-black/60">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/*
        Commitment section — deliberately unsigned, per Masaar's standing
        rule: no founder name, no personal photo, anywhere on the site.
        Written in first-person institutional "we" voice and signed as a
        team, never a named individual.
      */}
      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr_1fr] lg:items-center">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-black/5">
            <Image src={about?.founder_image_url || "/brand/banners/destination.png"} alt="" fill className="object-cover" />
          </div>

          <div>
            <SectionHeading eyebrow={about?.founder_eyebrow || "Our Commitment"} title="A Personal Commitment" align="left" />
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-masaar-black/70">
              {founderParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-4 text-sm text-masaar-black/80">
              {founderSignoff.map((line, i) => (
                <p key={i} className={i === 0 ? "" : "font-semibold"}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-pure-gold/30 bg-warm-ivory p-6">
            <p className="font-[family-name:var(--font-display)] text-lg italic leading-snug text-masaar-black">
              &ldquo;{about?.founder_quote || "May your journey be accepted and your path be easier."}&rdquo;
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
