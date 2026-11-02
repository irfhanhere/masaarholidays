import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { VisaApplicantRow, VisaApplicationDocumentRow, VisaPaymentRow } from "@/lib/types/database";
import type { VisaApplicationWithRelations } from "./types";
import { calculateRealMetrics } from "./types";
import VisaApplicationsClient from "./VisaApplicationsClient";

export const metadata: Metadata = {
  title: "Visa Applications | Masaar Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VisaApplicationsAdminPage() {
  let dbApplications: VisaApplicationWithRelations[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const [appsRes, applicantsRes, docsRes, paymentsRes] = await Promise.all([
        supabase.from("visa_applications").select("*").order("created_at", { ascending: false }),
        supabase.from("visa_applicants").select("*"),
        supabase.from("visa_application_documents").select("*"),
        supabase.from("visa_payments").select("*"),
      ]);

      if (appsRes.data) {
        const applicantsByApp = new Map<string, VisaApplicantRow[]>();
        (applicantsRes.data || []).forEach((a) => {
          const list = applicantsByApp.get(a.application_id) || [];
          list.push(a);
          applicantsByApp.set(a.application_id, list);
        });

        const docsByApp = new Map<string, VisaApplicationDocumentRow[]>();
        (docsRes.data || []).forEach((d) => {
          const list = docsByApp.get(d.application_id) || [];
          list.push(d);
          docsByApp.set(d.application_id, list);
        });

        const paymentsByApp = new Map<string, VisaPaymentRow[]>();
        (paymentsRes.data || []).forEach((p) => {
          const list = paymentsByApp.get(p.application_id) || [];
          list.push(p);
          paymentsByApp.set(p.application_id, list);
        });

        dbApplications = appsRes.data.map((app) => ({
          ...app,
          visa_applicants: applicantsByApp.get(app.id) || [],
          visa_application_documents: docsByApp.get(app.id) || [],
          visa_payments: paymentsByApp.get(app.id) || [],
        }));
      }
    } catch (err) {
      console.warn("[admin-visa-applications] DB error fetching applications:", err);
    }
  }

  const initialMetrics = calculateRealMetrics(dbApplications);

  return (
    <div className="p-6 md:p-8">
      {/* Breadcrumb matching admin Documents section navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs text-masaar-black/50">
        <Link href="/admin" className="hover:text-masaar-black transition-colors">Home</Link>
        <span>/</span>
        <Link href="/admin/documents" className="hover:text-masaar-black transition-colors">Documents</Link>
        <span>/</span>
        <span className="font-semibold text-masaar-black">Visa Applications</span>
      </div>

      <VisaApplicationsClient
        dbApplications={dbApplications}
        initialMetrics={initialMetrics}
      />
    </div>
  );
}
