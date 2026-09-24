"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Badge, EmptyRow } from "@/components/admin/ui";
import type { DocumentRow } from "@/lib/types/database";

function statusTone(status?: string | null): "green" | "amber" | "gray" | "blue" | "gold" {
  if (!status) return "blue";
  if (status === "paid") return "green";
  if (["sent", "partially_paid", "issued"].includes(status)) return "gold";
  if (status === "cancelled") return "gray";
  return "blue";
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export function InvoicesClientList({ invoices }: { invoices: DocumentRow[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const client = (inv.client_name ?? "").toLowerCase();
      const docNum = (inv.document_number ?? "").toLowerCase();
      const bkgRef = (inv.booking_reference ?? "").toLowerCase();
      const q = search.trim().toLowerCase();

      const matchesSearch = !q || client.includes(q) || docNum.includes(q) || bkgRef.includes(q);
      const matchesStatus = selectedStatus === "all" || inv.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, selectedStatus]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((inv) => selectedIds.has(inv.id));
  const someFilteredSelected = filtered.some((inv) => selectedIds.has(inv.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((inv) => inv.id)));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDeleteOne(inv: DocumentRow) {
    if (!confirm(`Are you sure you want to delete invoice ${inv.document_number} for ${inv.client_name}? This cannot be undone.`)) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/admin/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id, document_type: "invoice" }),
      });
      const text = await response.text();
      let res: any = null;
      try {
        res = text ? JSON.parse(text) : null;
      } catch {
        // ignore
      }

      if (response.ok && res?.success) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(inv.id);
          return next;
        });
        router.refresh();
      } else {
        alert(res?.error || `Failed to delete invoice (Status ${response.status}).`);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete invoice.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected invoice(s)? This action cannot be undone.`)) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/admin/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), document_type: "invoice" }),
      });
      const text = await response.text();
      let res: any = null;
      try {
        res = text ? JSON.parse(text) : null;
      } catch {
        // ignore
      }

      if (response.ok && res?.success) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert(res?.error || `Failed to delete selected invoices (Status ${response.status}).`);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete selected invoices.");
    } finally {
      setIsPending(false);
    }
  }

  const statuses = [
    { label: "All", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Partially Paid", value: "partially_paid" },
    { label: "Issued", value: "issued" },
    { label: "Draft", value: "draft" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <Card className="!p-0">
      {/* ── SEARCH & FILTER BAR ── */}
      <div className="border-b border-black/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:max-w-md">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-masaar-black/40">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by client or invoice #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-black/15 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-admin-primary focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-masaar-black/40 hover:text-masaar-black"
              >
                ✕
              </button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isPending ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelectedStatus(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedStatus === s.value
                  ? "bg-masaar-black text-white"
                  : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-masaar-black/50">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-black/20 text-admin-primary focus:ring-admin-primary cursor-pointer"
                  title="Select all"
                />
              </th>
              <th className="px-6 py-3 font-medium">Invoice No.</th>
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Paid</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <EmptyRow colSpan={8}>
                {search || selectedStatus !== "all"
                  ? "No invoices match your search criteria."
                  : "No invoices yet — create one manually or from an accepted quotation."}
              </EmptyRow>
            )}
            {filtered.map((inv) => {
              const isSelected = selectedIds.has(inv.id);
              return (
                <tr
                  key={inv.id}
                  className={`border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors ${
                    isSelected ? "bg-amber-50/40" : ""
                  }`}
                >
                  <td className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(inv.id)}
                      className="h-4 w-4 rounded border-black/20 text-admin-primary focus:ring-admin-primary cursor-pointer"
                      title={`Select invoice ${inv.document_number}`}
                    />
                  </td>
                  <td className="px-6 py-3 font-medium">{inv.document_number}</td>
                  <td className="px-6 py-3 font-medium text-masaar-black">{inv.client_name}</td>
                  <td className="px-6 py-3 font-semibold">AED {Number(inv.total_aed ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-3 text-emerald-700">AED {Number(inv.amount_paid_aed ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <Badge tone={statusTone(inv.status)}>{(inv.status ?? "draft").replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-6 py-3 text-masaar-black/60">{formatDate(inv.created_at)}</td>
                  <td className="px-6 py-3 space-x-3">
                    <Link href={`/admin/documents/invoices/${inv.id}`} className="font-medium text-admin-primary hover:underline">
                      Open
                    </Link>
                    {inv.status !== "paid" && (
                      <Link
                        href={`/admin/documents/invoices/${inv.id}/record-payment`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        Record Payment
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteOne(inv)}
                      disabled={isPending}
                      className="font-medium text-rose-600 hover:text-rose-800 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-black/5 bg-[#FAF9F6] text-xs text-masaar-black/50 flex justify-between items-center">
        <span>Showing {filtered.length} of {invoices.length} invoices {selectedIds.size > 0 ? `(${selectedIds.size} selected)` : ""}</span>
        {filtered.length !== invoices.length && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedStatus("all");
            }}
            className="text-admin-primary hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </Card>
  );
}
