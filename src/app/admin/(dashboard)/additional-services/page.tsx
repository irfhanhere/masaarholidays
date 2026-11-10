import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEFAULT_ADDITIONAL_SERVICES } from "@/lib/data/additional-services-catalog";
import type { AdditionalServiceRow } from "@/lib/types/database";
import { AdditionalServicesAdminClient } from "./AdditionalServicesAdminClient";

export const metadata: Metadata = {
  title: "Additional Services | Masaar Admin",
  robots: { index: false },
};

export default async function AdminAdditionalServicesPage() {
  let services: AdditionalServiceRow[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        services = data as AdditionalServiceRow[];
      }
    } catch (e) {
      console.warn("Failed to query additional_services in admin, using initial catalogue:", e);
    }
  }

  if (services.length === 0) {
    services = DEFAULT_ADDITIONAL_SERVICES;
  }

  return (
    <div>
      <PageHeader
        title="Additional Services"
        description="Manage publication status, site-wide placements, enquiry popup visibility, display order, FAQs, and WhatsApp templates."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Additional Services" },
        ]}
      />

      <AdditionalServicesAdminClient initialServices={services} />
    </div>
  );
}
