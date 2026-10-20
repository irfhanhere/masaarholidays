import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { VisaApplicationRow } from "@/lib/types/database";
import VisaApplicationsClient from "./VisaApplicationsClient";

export const metadata: Metadata = {
  title: "Visa Applications | Masaar Admin",
  robots: { index: false },
};

export default async function VisaApplicationsAdminPage() {
  let dbApplications: VisaApplicationRow[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("visa_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        dbApplications = data;
      }
    } catch (err) {
      console.warn("[admin-visa-applications] DB error fetching applications:", err);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-masaar-black/50">
        <a href="/admin" className="hover:text-masaar-black">Home</a>
        <span>/</span>
        <a href="/admin/visa-types" className="hover:text-masaar-black">Visa Services</a>
        <span>/</span>
        <span className="font-semibold text-masaar-black">Applications</span>
      </div>

      <VisaApplicationsClient dbApplications={dbApplications} />
    </div>
  );
}
