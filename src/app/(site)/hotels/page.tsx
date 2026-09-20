import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { HotelsBrowser } from "@/components/site/HotelsBrowser";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { computeHotelIsRefundable, computeHotelMinPrice, type HotelWithSummary } from "@/lib/hotel-format";
import { getActiveHotelRoomPriceSummaries, getActiveHotels } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { FaqSection } from "@/components/site/FaqSection";

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
      <Breadcrumbs items={[{ label: "Hotels" }]} />
      <Hero
        eyebrow="Hotels"
        h1="Stay Closer to"
        h1Gold="What Matters"
        image="/brand/banners/hotel.png"
      >
        <p className="mt-4 max-w-xl text-sm text-masaar-black/60 sm:text-base">
          Carefully selected hotels in Makkah and Madinah, chosen around location, comfort and the needs of your journey.
        </p>
        {/* Category Tags */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {["Closest to Haram", "Easy Walking Access", "Value + Shuttle", "Premium"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-masaar-black/15 bg-masaar-black/5 px-3.5 py-1 text-xs font-medium text-masaar-black/70"
            >
              {tag}
            </span>
          ))}
        </div>
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

      <FaqSection category="hotels" />
    </>
  );
}
