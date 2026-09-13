import type { Metadata } from "next";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/site/Container";
import { Hero } from "@/components/site/Hero";
import { TransferCard } from "@/components/site/TransferCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getActiveTransfers } from "@/lib/data/public";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

export const metadata: Metadata = {
  title: "Private Umrah Transfers | Masaar Holidays",
  description:
    "Private transfers for your Umrah journey — Jeddah and Madinah airports, the Haramain train, and intercity routes, arranged as part of the care of the journey.",
};

const TYPE_LABEL: Record<string, string> = {
  airport: "Airport Transfers",
  train: "Haramain Train Transfers",
  intercity: "Intercity Transfers",
  other: "Other Transfers",
};

export default async function TransfersPage() {
  const transfers = await getActiveTransfers();
  const grouped = transfers.reduce<Record<string, typeof transfers>>((acc, t) => {
    (acc[t.transfer_type] ??= []).push(t);
    return acc;
  }, {});

  return (
    <>
      <Hero
        eyebrow="Transfers"
        h1="Private Transfers for Your Umrah Journey"
        image="/brand/banners/default.png"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton message={WHATSAPP_TEMPLATES.general}>Enquire on WhatsApp</WhatsAppButton>
        </div>
      </Hero>

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="Travel With Comfort and Confidence" title="Transfer Routes" />
          <div className="mt-10 space-y-10">
            {transfers.length > 0 ? (
              Object.entries(grouped).map(([type, list]) => (
                <div key={type}>
                  <h3 className="mb-4 text-lg font-semibold text-masaar-black">
                    {TYPE_LABEL[type] ?? type}
                  </h3>
                  <div className="space-y-4">
                    {list.map((transfer) => (
                      <TransferCard key={transfer.id} transfer={transfer} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No transfer routes published yet"
                note="Add routes and pricing in Admin → Transfers once confirmed."
              />
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
