"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import type { CustomerRow } from "@/lib/data/customers";

export function CustomersClientList({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filtered = initialCustomers.filter((c) => {
    if (selectedType !== "all" && c.customer_type !== selectedType) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.customer_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-4">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers by name, phone, email, or ID..."
            className="w-full max-w-md rounded-md border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
          />
          <div className="flex items-center gap-1">
            {["all", "individual", "corporate", "vip", "agent"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`rounded px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  selectedType === type
                    ? "bg-masaar-black text-white"
                    : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <Link href="/admin/customers/new">
          <PrimaryButton>
            <span>+ Add Customer</span>
          </PrimaryButton>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-black/10 text-left text-sm">
          <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            <tr>
              <th className="px-4 py-3">Customer ID</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Phone / WhatsApp</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-masaar-black">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-masaar-black/50">
                  No customers found matching your search.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-pure-gold">
                    {c.customer_number}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/customers/${c.id}`} className="hover:underline">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{c.phone}</div>
                    {c.whatsapp && c.whatsapp !== c.phone && (
                      <div className="text-[11px] text-green-700">WA: {c.whatsapp}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-masaar-black/70">{c.email || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.customer_type === "vip" ? "gold" : c.customer_type === "corporate" ? "blue" : "gray"}>
                      <span className="capitalize">{c.customer_type}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-masaar-black/70">
                    {c.customer_source}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/quotations/new?customerId=${c.id}&clientName=${encodeURIComponent(c.full_name)}&clientPhone=${encodeURIComponent(c.phone)}&clientEmail=${encodeURIComponent(c.email || "")}`}
                        className="rounded bg-light-gold/20 px-2 py-1 text-xs font-semibold text-deep-gold hover:bg-light-gold/30"
                      >
                        Quote
                      </Link>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="rounded border border-black/15 px-2 py-1 text-xs font-semibold hover:bg-black/5"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
