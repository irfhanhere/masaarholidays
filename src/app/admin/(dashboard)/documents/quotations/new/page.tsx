import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewQuotationWizard } from "./NewQuotationWizard";

export const metadata: Metadata = {
  title: "Create Quotation | Masaar Admin",
  robots: { index: false },
};

async function getEnquiries() {
  let supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createAdminClient();
  }

  const { data } = await supabase
    .from("enquiries")
    .select("id, name, email, phone, enquiry_type, travel_date, message, internal_notes")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ seedEnquiryId?: string }>;
}) {
  const params = await searchParams;
  const enquiries = await getEnquiries();

  return <NewQuotationWizard enquiries={enquiries} seedEnquiryId={params.seedEnquiryId} />;
}
