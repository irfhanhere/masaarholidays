import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TransferForm } from "../TransferForm";
import { VERIFIED_ROUTE_CATALOG } from "@/lib/data/transfers";

export const metadata: Metadata = {
  title: "Edit Transfer | Masaar Admin",
  robots: { index: false },
};

export default async function EditTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: transfer } = await supabase.from("transfers").select("*").eq("id", id).maybeSingle();

  if (!transfer) {
    // Check fallback catalog if mock ID
    const fallback = Object.values(VERIFIED_ROUTE_CATALOG).find(
      (r) => `route_${r.slug}` === id || r.slug === id
    );
    if (fallback) {
      return (
        <TransferForm
          transferId={id}
          initial={{
            id,
            route_name: fallback.route_name,
            slug: fallback.slug,
            transfer_type: fallback.transfer_type,
            description: fallback.description,
            image_url: fallback.image_url,
            is_active: true,
            display_order: 1,
            pickup_location: fallback.pickup_location,
            dropoff_location: fallback.dropoff_location,
            route_type: fallback.route_type,
            long_description: fallback.long_description,
            duration: fallback.duration,
            route_notes: fallback.route_notes,
            featured: fallback.featured,
            seo_title: fallback.seo_title,
            meta_description: fallback.meta_description,
            focus_keyword: fallback.focus_keyword,
          } as any}
        />
      );
    }
    notFound();
  }

  return <TransferForm transferId={transfer.id} initial={transfer} />;
}
