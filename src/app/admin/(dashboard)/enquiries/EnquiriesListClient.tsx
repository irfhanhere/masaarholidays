"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, EmptyRow, PageHeader } from "@/components/admin/ui";
import type { EnquiryRow } from "@/lib/types/database";
import { deleteEnquiries } from "./actions";

const STATUS_TONE: Record<string, "green" | "blue" | "amber" | "gray"> = {
  new: "green",
  viewed: "blue",
  contacted: "amber",
  closed: "gray",
};

export function EnquiriesListClient({ enquiries: initialEnquiries }: { enquiries: EnquiryRow[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const allSelected = enquiries.length > 0 && selected.size === enquiries.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(enquiries.map((e) => e.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected enquir${selected.size === 1 ? "y" : "ies"}? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    const ids = Array.from(selected);
    setEnquiries((prev) => prev.filter((e) => !selected.has(e.id)));
    setSelected(new Set());
    try {
      await deleteEnquiries(ids);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="View and manage all enquiries from your website."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Enquiries" }]}
        actions={
          selected.size > 0 ? (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {isDeleting ? "Deleting…" : `Delete Selected (${selected.size})`}
            </button>
          ) : undefined
        }
      />

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all enquiries"
                  className="rounded border-black/20"
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Enquiry</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {enquiries.length === 0 && <EmptyRow colSpan={7}>No enquiries yet.</EmptyRow>}
            {enquiries.map((e) => (
              <tr key={e.id} className={selected.has(e.id) ? "bg-warm-ivory/40" : undefined}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggleOne(e.id)}
                    aria-label={`Select enquiry from ${e.name}`}
                    className="rounded border-black/20"
                  />
                </td>
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
