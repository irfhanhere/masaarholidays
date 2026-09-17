import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, PageHeader, PrimaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UmrahDepartureMonthRow } from "@/lib/types/database";
import { deleteDepartureMonth, toggleDepartureMonthActive } from "./actions";

export const metadata: Metadata = { title: "Umrah Departures | Masaar Admin", robots: { index: false } };

async function getMonths(): Promise<UmrahDepartureMonthRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("umrah_departure_months")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export default async function AdminUmrahDeparturesPage() {
  const months = await getMonths();

  return (
    <div>
      <PageHeader
        title="Umrah Departures"
        description='The "Departure Month" nav dropdown and landing pages under /umrah — Umrah only, not Hajj. Every active month shows the same package grid as the main Umrah page.'
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Umrah Departures" }]}
        actions={
          <Link href="/admin/umrah-departures/new">
            <PrimaryButton>+ Add Month</PrimaryButton>
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Nav Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {months.length === 0 && <EmptyRow colSpan={5}>No departure months yet.</EmptyRow>}
            {months.map((month) => (
              <tr key={month.id}>
                <td className="px-4 py-3 font-medium text-masaar-black">{month.display_label}</td>
                <td className="px-4 py-3 font-mono text-xs text-masaar-black/60">{month.slug}</td>
                <td className="px-4 py-3 text-masaar-black/70">{month.sort_order}</td>
                <td className="px-4 py-3">
                  <Badge tone={month.is_active ? "green" : "gray"}>{month.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/umrah-departures/${month.id}`} className="text-sm font-medium text-admin-primary">
                      Edit
                    </Link>
                    <form action={toggleDepartureMonthActive.bind(null, month.id, !month.is_active)}>
                      <button type="submit" className="text-sm text-masaar-black/60 underline">
                        {month.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteDepartureMonth.bind(null, month.id)}>
                      <button type="submit" className="text-sm text-red-600 underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
