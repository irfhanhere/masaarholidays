import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, PageHeader, PrimaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { HotelRow } from "@/lib/types/database";
import { deleteHotel, toggleHotelActive } from "./actions";

export const metadata: Metadata = { title: "Hotels | Masaar Admin", robots: { index: false } };

export default async function AdminHotelsPage() {
  let hotels: HotelRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("hotels").select("*").order("display_order");
    hotels = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Hotels"
        description="Manage the hotels displayed on your website — sellable standalone and attachable inside packages."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Hotels" }]}
        actions={
          <Link href="/admin/hotels/new">
            <PrimaryButton>+ Add Hotel</PrimaryButton>
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">From (AED)</th>
              <th className="px-4 py-3">Data Confidence</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {hotels.length === 0 && <EmptyRow colSpan={7}>No hotels yet.</EmptyRow>}
            {hotels.map((hotel) => (
              <tr key={hotel.id}>
                <td className="px-4 py-3 font-medium text-masaar-black">{hotel.name}</td>
                <td className="px-4 py-3 text-masaar-black/70">{hotel.city}</td>
                <td className="px-4 py-3 text-masaar-black/70">{hotel.category ?? "—"}</td>
                <td className="px-4 py-3 text-masaar-black/70">
                  {hotel.price_from_aed != null ? `AED ${hotel.price_from_aed.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {hotel.data_confidence ? (
                    <Badge
                      tone={
                        hotel.data_confidence === "verified"
                          ? "green"
                          : hotel.data_confidence === "estimated"
                            ? "amber"
                            : "gray"
                      }
                    >
                      {hotel.data_confidence === "needs_verification" ? "Needs Verification" : hotel.data_confidence === "estimated" ? "Estimated" : "Verified"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-masaar-black/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={hotel.is_active ? "green" : "gray"}>{hotel.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/hotels/${hotel.id}`} className="text-sm font-medium text-admin-primary">
                      Edit
                    </Link>
                    <form action={toggleHotelActive.bind(null, hotel.id, !hotel.is_active)}>
                      <button type="submit" className="text-sm text-masaar-black/60 underline">
                        {hotel.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteHotel.bind(null, hotel.id)}>
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
