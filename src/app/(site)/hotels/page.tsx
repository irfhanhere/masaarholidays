import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { HotelsBrowser } from "@/components/site/HotelsBrowser";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getActiveHotels } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/hotels",
    title: "Makkah & Madinah Hotels | Masaar Holidays",
    description:
      "Hotels in Makkah and Madinah selected for Haram proximity, comfort, and family suitability — standalone or as part of your Umrah/Hajj package.",
  });
}

export default async function HotelsPage() {
  const hotels = await getActiveHotels();

  return (
    <>
      <Hero
        eyebrow="Hotels"
        h1="Hotels in Makkah & Madinah"
        image="/brand/banners/hotel.png"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="general">Enquire on WhatsApp</WhatsAppButton>
        </div>
      </Hero>

      <section className="py-16">
        <Container>
          <HotelsBrowser hotels={hotels} />
        </Container>
      </section>
    </>
  );
}
