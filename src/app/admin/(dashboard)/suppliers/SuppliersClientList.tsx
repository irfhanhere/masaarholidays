"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import type { SupplierRow } from "@/lib/data/suppliers";

export function SuppliersClientList({ initialSuppliers }: { initialSuppliers: SupplierRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const filtered = initialSuppliers.filter((s) => {
    if (selectedCat !== "all" && s.category !== selectedCat) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.supplier_reference && s.supplier_reference.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search supplier by name, contact, email, or ref..."
            className="w-full max-w-sm rounded-md border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
          />

          <div className="flex items-center gap-1">
            {["all", "hotel", "airline", "transport", "visa", "esim", "tour"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`rounded px-2.5 py-1.5 text-xs font-semibold capitalize transition ${
                  selectedCat === cat
                    ? "bg-masaar-black text-white"
                    : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Link href="/admin/suppliers/new">
          <PrimaryButton>+ Add Supplier Profile</PrimaryButton>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-black/10 text-left text-sm">
          <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            <tr>
              <th className="px-4 py-3">Supplier Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Contact Person</th>
              <th className="px-4 py-3">Phone & Email</th>
              <th className="px-4 py-3">Billing Terms</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-masaar-black">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-masaar-black/50">
                  No suppliers found matching the selected category.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-bold">{s.name}</div>
                    {s.supplier_reference && (
                      <div className="font-mono text-[11px] text-masaar-black/50">Ref: {s.supplier_reference}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="gray">
                      <span className="capitalize">{s.category}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">{s.contact_person || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{s.phone || "—"}</div>
                    {s.email && <div className="text-[11px] text-masaar-black/60">{s.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-semibold">{s.currency}</div>
                    <div className="text-[11px] text-masaar-black/60">{s.payment_terms || "Standard terms"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={s.is_active ? "green" : "gray"}>
                      <span>{s.is_active ? "Active" : "Inactive"}</span>
                    </Badge>
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
