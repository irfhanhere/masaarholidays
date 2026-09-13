import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, PageHeader, PrimaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TransferRow } from "@/lib/types/database";
import { deleteTransfer, toggleTransferActive } from "./actions";

export const metadata: Metadata = { title: "Transfers | Masaar Admin", robots: { index: false } };

export default async function AdminTransfersPage() {
  let transfers: TransferRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("transfers").select("*").order("display_order");
    transfers = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Transfers"
        description="Manage the transfer routes displayed on your website."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Transfers" }]}
        actions={
          <Link href="/admin/transfers/new">
            <PrimaryButton>+ Add Transfer</PrimaryButton>
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">From (AED)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {transfers.length === 0 && <EmptyRow colSpan={6}>No transfer routes yet.</EmptyRow>}
            {transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td className="px-4 py-3 font-medium text-masaar-black">{transfer.route_name}</td>
                <td className="px-4 py-3 text-masaar-black/70 capitalize">{transfer.transfer_type}</td>
                <td className="px-4 py-3 text-masaar-black/70">{transfer.vehicle_type ?? "—"}</td>
                <td className="px-4 py-3 text-masaar-black/70">
                  {transfer.price_from_aed != null ? `AED ${transfer.price_from_aed.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={transfer.is_active ? "green" : "gray"}>{transfer.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/transfers/${transfer.id}`} className="text-sm font-medium text-admin-primary">
                      Edit
                    </Link>
                    <form action={toggleTransferActive.bind(null, transfer.id, !transfer.is_active)}>
                      <button type="submit" className="text-sm text-masaar-black/60 underline">
                        {transfer.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteTransfer.bind(null, transfer.id)}>
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
