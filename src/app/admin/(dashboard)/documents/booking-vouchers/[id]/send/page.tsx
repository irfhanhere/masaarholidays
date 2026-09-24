import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDocument, ensureDocumentShare } from "@/lib/data/documents";
import { getSiteOrigin } from "@/lib/site-url";
import { WHATSAPP_DEFAULT_PHONE } from "@/lib/whatsapp-templates";
import { SendDocumentPanel } from "@/components/documents/SendDocumentPanel";

export const metadata: Metadata = { title: "Send Booking Voucher | Masaar Admin", robots: { index: false } };

export default async function SendBookingVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document || document.document_type !== "booking_voucher") notFound();

  const activeShare = await ensureDocumentShare(id);

  const supabase = await createClient();
  const { data: settings } = await supabase.from("whatsapp_settings").select("phone_number").eq("id", 1).maybeSingle();

  const secureLink = `${getSiteOrigin()}/quote/${activeShare.share_token}`;

  return (
    <SendDocumentPanel
      documentId={id}
      documentType="booking_voucher"
      documentNumber={document.document_number}
      basePath="/admin/documents/booking-vouchers"
      moduleLabel="Booking Vouchers"
      clientName={document.client_name}
      clientEmail={document.client_email}
      totalAed={document.total_aed}
      secureLink={secureLink}
      whatsappPhone={settings?.phone_number ?? WHATSAPP_DEFAULT_PHONE}
    />
  );
}
