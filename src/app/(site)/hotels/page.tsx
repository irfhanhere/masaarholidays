import type { Metadata } from "next";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { HotelCard } from "@/components/site/HotelCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getActiveHotels } from "@/lib/data/public";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

export const metadata: Metadata = {
  title: "Makkah & Madinah Hotels | Masaar Holidays",
  description:
    "Hotels in Makkah and Madinah selected for Haram proximity, comfort, and family suitability — standalone or as part of your Umrah/Hajj package.",
};

export default async function HotelsPage() {
  const [makkahHotels, madinahHotels] = await Promise.all([
    getActiveHotels("Makkah"),
    getActiveHotels("Madinah"),
  ]);

  return (
    <>
      <Hero
        eyebrow="Hotels"
        h1="Hotels in Makkah & Madinah"
        image="/brand/banners/hotel.png"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton message={WHATSAPP_TEMPLATES.general}>Enquire on WhatsApp</WhatsAppButton>
        </div>
      </Hero>

      <section id="makkah" className="py-16">
        <Container>
          <SectionHeading eyebrow="Makkah" title="Makkah Hotels Near Haram" align="left" />
          <div className="mt-8">
            {makkahHotels.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {makkahHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Makkah hotels published yet"
                note="Real hotel names, categories and prices are pending the client's pricing/package document — brief explicitly prohibits inventing hotel names or star ratings."
              />
            )}
          </div>
        </Container>
      </section>

      <section id="madinah" className="bg-warm-ivory py-16">
        <Container>
          <SectionHeading eyebrow="Madinah" title="Madinah Accommodation" align="left" />
          <div className="mt-8">
            {madinahHotels.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {madinahHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Madinah hotels published yet"
                note="Real hotel names, categories and prices are pending the client's pricing/package document."
              />
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
