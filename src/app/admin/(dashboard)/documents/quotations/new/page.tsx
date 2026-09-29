import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewQuotationWizard } from "./NewQuotationWizard";

export const metadata: Metadata = {
  title: "Create Quotation | Masaar Admin",
  robots: { index: false },
};

async function getSupabase() {
  try {
    return createAdminClient();
  } catch {}

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return supabase;
  } catch {}

  return createClient();
}

async function getClientsAndEnquiries() {
  const supabase = await getSupabase();

  // 1. Fetch enquiries (ordered by received_at)
  const { data: enqData, error: enqError } = await supabase
    .from("enquiries")
    .select("id, name, email, phone, enquiry_type, travel_date, message, internal_notes, received_at")
    .order("received_at", { ascending: false })
    .limit(100);

  if (enqError) {
    console.error("getEnquiries error:", enqError);
  }

  const list: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    enquiry_type?: string | null;
    travel_date?: string | null;
    passengers?: number | null;
    source?: string;
  }> = [];

  const seenKeys = new Set<string>();

  for (const e of enqData ?? []) {
    let country = "Dubai, UAE";
    let passengers = 2;
    let travel_date = e.travel_date;
    if (e.internal_notes) {
      try {
        const meta = JSON.parse(e.internal_notes);
        if (meta.country) country = meta.country;
        if (meta.adults) passengers = Number(meta.adults) || 2;
        if (meta.travel_dates) travel_date = meta.travel_dates;
      } catch {}
    }

    const key = `${e.name.toLowerCase().trim()}_${(e.phone || e.email || "").toLowerCase().trim()}`;
    seenKeys.add(key);

    list.push({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      country,
      enquiry_type: e.enquiry_type || "Umrah",
      travel_date,
      passengers,
      source: "Enquiry",
    });
  }

  // 2. Fetch past document clients for existing client lookup
  try {
    const { data: docData } = await supabase
      .from("documents")
      .select("id, client_name, client_email, client_phone, client_country, journey_type, travel_date, adults")
      .order("created_at", { ascending: false })
      .limit(100);

    for (const d of docData ?? []) {
      if (!d.client_name) continue;
      const key = `${d.client_name.toLowerCase().trim()}_${(d.client_phone || d.client_email || "").toLowerCase().trim()}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      list.push({
        id: `doc-${d.id}`,
        name: d.client_name,
        email: d.client_email,
        phone: d.client_phone,
        country: d.client_country || "Dubai, UAE",
        enquiry_type: d.journey_type === "hajj" ? "Hajj" : "Umrah",
        travel_date: d.travel_date,
        passengers: d.adults || 2,
        source: "Client",
      });
    }
  } catch (docErr) {
    console.error("getDocClients error:", docErr);
  }

  return list;
}

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ seedEnquiryId?: string; enquiry_id?: string }>;
}) {
  const params = await searchParams;
  const seedId = params?.seedEnquiryId || params?.enquiry_id;
  const clients = await getClientsAndEnquiries();

  return <NewQuotationWizard enquiries={clients} seedEnquiryId={seedId} />;
}
