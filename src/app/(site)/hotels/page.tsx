import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { HotelsBrowser } from "@/components/site/HotelsBrowser";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { computeHotelIsRefundable, computeHotelMinPrice, type HotelWithSummary } from "@/lib/hotel-format";
import { getActiveHotelRoomPriceSummaries, getActiveHotels } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/hotels",
    fallbackTitle: "Makkah & Madinah Hotels | Masaar Holidays",
    fallbackDescription:
      "Hotels in Makkah and Madinah selected for Haram proximity, comfort, and family suitability — standalone or as part of your Umrah/Hajj package.",
  });
}

export default async function HotelsPage() {
  const [hotels, roomSummaries] = await Promise.all([getActiveHotels(), getActiveHotelRoomPriceSummaries()]);

  const roomsByHotel = new Map<string, typeof roomSummaries>();
  for (const room of roomSummaries) {
    const list = roomsByHotel.get(room.hotel_id) ?? [];
    list.push(room);
    roomsByHotel.set(room.hotel_id, list);
  }

  const hotelsWithSummary: HotelWithSummary[] = hotels.map((hotel) => {
    const rooms = roomsByHotel.get(hotel.id) ?? [];
    return {
      ...hotel,
      minPriceAed: computeHotelMinPrice(rooms, hotel.price_from_aed),
      isRefundable: computeHotelIsRefundable(rooms),
    };
  });

  return (
    <>
      <Hero
        eyebrow="Hotels"
        h1="Hotels in Makkah & Madinah"
        image="/brand/banners/hotel.png"
      >
        {/* Draft copy pending Haseeb's approval */}
        <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
          Location and comfort matter as much as price. Every hotel we recommend is one we&apos;d choose for our own family, within walking distance that respects your time for prayer.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton templateKey="general">Enquire on WhatsApp</WhatsAppButton>
        </div>
      </Hero>

      <section className="py-16">
        <Container>
          <HotelsBrowser hotels={hotelsWithSummary} />
        </Container>
      </section>

      <CrossLinkServices exclude="hotels" />
    </>
  );
}
