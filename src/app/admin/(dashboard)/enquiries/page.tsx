import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { EnquiryRow } from "@/lib/types/database";

export const metadata: Metadata = { title: "Enquiries | Masaar Admin", robots: { index: false } };

const STATUS_TONE: Record<string, "green" | "blue" | "amber" | "gray"> = {
  new: "green",
  viewed: "blue",
  contacted: "amber",
  closed: "gray",
};

export default async function AdminEnquiriesPage() {
  let enquiries: EnquiryRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("enquiries").select("*").order("received_at", { ascending: false });
    enquiries = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="View and manage all enquiries from your website."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Enquiries" }]}
      />

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Enquiry</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {enquiries.length === 0 && <EmptyRow colSpan={6}>No enquiries yet.</EmptyRow>}
            {enquiries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium text-masaar-black">{e.name}</td>
                <td className="px-4 py-3 text-masaar-black/70">{e.phone ?? "—"}</td>
                <td className="px-4 py-3 text-masaar-black/70">{e.enquiry_type}</td>
                <td className="px-4 py-3 text-masaar-black/70">
                  {new Date(e.received_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/enquiries/${e.id}`} className="text-sm font-medium text-admin-primary">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
