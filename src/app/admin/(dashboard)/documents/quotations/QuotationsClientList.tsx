"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Badge, EmptyRow } from "@/components/admin/ui";
import { ShareQuotationModal } from "@/components/documents/ShareQuotationModal";
import type { DocumentRow } from "@/lib/types/database";

function statusTone(status?: string | null): "green" | "amber" | "gray" | "blue" | "gold" {
  if (!status) return "blue";
  if (status === "accepted") return "green";
  if (status === "revision_requested") return "amber";
  if (["sent", "viewed"].includes(status)) return "gold";
  if (["rejected", "cancelled", "expired"].includes(status)) return "gray";
  return "blue";
}

function formatStatus(status?: string | null): string {
  if (!status) return "Draft";
  if (status === "revision_requested") return "Revision Requested";
  if (status === "sent") return "Awaiting Client";
  if (status === "viewed") return "Viewed by Client";
  return status.charAt(0).toUpperCase() + status.slice(1);
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

export function QuotationsClientList({
  quotations,
  shareMap = {},
}: {
  quotations: DocumentRow[];
  shareMap?: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareDoc, setShareDoc] = useState<DocumentRow | null>(null);

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      const client = (q.client_name ?? "").toLowerCase();
      const docNum = (q.document_number ?? "").toLowerCase();
      const email = (q.client_email ?? "").toLowerCase();
      const phone = (q.client_phone ?? "").toLowerCase();
      const term = search.trim().toLowerCase();

      const matchesSearch = !term || client.includes(term) || docNum.includes(term) || email.includes(term) || phone.includes(term);
      const matchesStatus =
        selectedStatus === "all" ||
        q.status === selectedStatus ||
        (selectedStatus === "sent_or_viewed" && ["sent", "viewed"].includes(q.status));
      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, selectedStatus]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id));
  const someFilteredSelected = filtered.some((q) => selectedIds.has(q.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((q) => q.id)));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteOne(q: DocumentRow) {
    if (!confirm(`Are you sure you want to delete quotation ${q.document_number} for ${q.client_name}? This cannot be undone.`)) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/admin/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, document_type: "quotation" }),
      });
      const res = await response.json().catch(() => null);

      if (response.ok && res?.success) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(q.id);
          return next;
        });
        router.refresh();
      } else {
        alert(res?.error || `Failed to delete quotation (Status ${response.status}).`);
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : "Network error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected quotation(s)? This cannot be undone.`)) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/admin/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), document_type: "quotation" }),
      });
      const res = await response.json().catch(() => null);

      if (response.ok && res?.success) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert(res?.error || `Failed to delete quotations.`);
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : "Network error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="!p-0">
      <div className="flex flex-col gap-4 border-b border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            placeholder="Search by quote #, client name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm text-masaar-black placeholder:text-masaar-black/40 focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm text-masaar-black focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent_or_viewed">Awaiting Client</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Declined</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-masaar-black/60">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-masaar-black/50">
              <th className="w-8 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="rounded border-black/20 text-admin-primary focus:ring-admin-primary"
                />
              </th>
              <th className="px-4 py-3 font-medium">Quote #</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Journey</th>
              <th className="px-4 py-3 font-medium">Travel Dates</th>
              <th className="px-4 py-3 font-medium">Travellers</th>
              <th className="px-4 py-3 font-medium">Total (AED)</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow colSpan={10}>No quotations found matching your criteria.</EmptyRow>
            ) : (
              filtered.map((q) => {
                const isSelected = selectedIds.has(q.id);
                const travellers = [
                  q.adults ? `${q.adults}A` : null,
                  q.children ? `${q.children}C` : null,
                  q.infants ? `${q.infants}I` : null,
                ]
                  .filter(Boolean)
                  .join(" + ") || "—";

                return (
                  <tr
                    key={q.id}
                    className={`border-b border-black/5 transition-colors last:border-0 hover:bg-black/[0.01] ${
                      isSelected ? "bg-light-gold/10" : ""
                    }`}
                  >
                    <td className="w-8 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(q.id)}
                        className="rounded border-black/20 text-admin-primary focus:ring-admin-primary"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-masaar-black">
                      <Link
                        href={`/admin/documents/quotations/${q.id}`}
                        className="text-admin-primary hover:underline"
                      >
                        {q.document_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-masaar-black">{q.client_name}</div>
                      {q.client_phone && <div className="text-xs text-masaar-black/50">{q.client_phone}</div>}
                    </td>
                    <td className="px-4 py-3 capitalize text-masaar-black/80">
                      {q.journey_type ?? "Umrah"}
                    </td>
                    <td className="px-4 py-3 text-xs text-masaar-black/70">
                      {q.travel_date ? (
                        <>
                          {formatDate(q.travel_date)}
                          {q.return_date ? ` – ${formatDate(q.return_date)}` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-masaar-black/70">{travellers}</td>
                    <td className="px-4 py-3 font-semibold text-masaar-black">
                      {Number(q.total_aed ?? 0) > 0 ? `AED ${Number(q.total_aed).toLocaleString()}` : "AED 0.00"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(q.status)}>{formatStatus(q.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-masaar-black/50">{formatDate(q.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <Link
                          href={`/admin/documents/quotations/${q.id}`}
                          className="font-medium text-admin-primary hover:underline"
                        >
                          Edit
                        </Link>
                        <span className="text-black/20">|</span>
                        <Link
                          href={`/admin/documents/quotations/${q.id}/pdf`}
                          className="text-masaar-black/70 hover:text-masaar-black hover:underline"
                        >
                          PDF
                        </Link>
                        <span className="text-black/20">|</span>
                        <Link
                          href={`/admin/documents/quotations/${q.id}/send`}
                          className="text-masaar-black/70 hover:text-masaar-black hover:underline"
                        >
                          Send
                        </Link>
                        <span className="text-black/20">|</span>
                        <button
                          type="button"
                          onClick={() => setShareDoc(q)}
                          className="font-medium text-[#b37e28] hover:underline cursor-pointer"
                        >
                          Share
                        </button>
                        <span className="text-black/20">|</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteOne(q)}
                          disabled={isPending}
                          className="text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Share Modal Popup */}
      {shareDoc && (
        <ShareQuotationModal
          isOpen={true}
          onClose={() => setShareDoc(null)}
          document={shareDoc}
          shareToken={shareMap[shareDoc.id] || shareDoc.id}
        />
      )}
    </Card>
  );
}
