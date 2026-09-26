"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Badge, EmptyRow, PrimaryButton, SecondaryButton, GoldButton, Field, inputClass } from "@/components/admin/ui";
import type { EnquiryRow } from "@/lib/types/database";
import { parseCrmMeta } from "./crm-utils";
import {
  updateEnquiryCrm,
  createEnquiryLead,
  deleteEnquiries,
  type CreateEnquiryInput,
} from "./actions";

// High-fidelity status configuration matching the CRM screen
const STATUS_CONFIG: Record<
  string,
  { label: string; tone: "blue" | "green" | "amber" | "gray" | "gold"; badgeClass: string }
> = {
  new: { label: "New", tone: "blue", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", tone: "amber", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  preparing_quote: { label: "Preparing Quote", tone: "blue", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" },
  quote_sent: { label: "Quote Sent", tone: "gold", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  revision_requested: { label: "Revision Requested", tone: "amber", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
  accepted: { label: "Accepted", tone: "green", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  converted: { label: "Converted to Booking", tone: "green", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  lost: { label: "Lost", tone: "gray", badgeClass: "bg-gray-100 text-gray-600 border-gray-200" },
};

function formatEnquiryId(index: number, rawId: string): string {
  if (rawId.startsWith("ENQ-")) return rawId;
  const num = 100 + index;
  return `ENQ-2026-0${num}`;
}

export function EnquiriesListClient({ enquiries: initialEnquiries }: { enquiries: EnquiryRow[] }) {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>(initialEnquiries);
  const [search, setSearch] = useState("");
  const [filterTravelType, setFilterTravelType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(
    initialEnquiries.length > 0 ? initialEnquiries[0].id : null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalEnquiryId, setModalEnquiryId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selected single enquiry for side drawer
  const selectedEnquiry = useMemo(() => {
    return enquiries.find((e) => e.id === selectedEnquiryId) ?? null;
  }, [enquiries, selectedEnquiryId]);

  const selectedMeta = useMemo(() => {
    return parseCrmMeta(selectedEnquiry?.internal_notes);
  }, [selectedEnquiry]);

  // Selected enquiry for popup modal
  const modalEnquiry = useMemo(() => {
    return enquiries.find((e) => e.id === modalEnquiryId) ?? null;
  }, [enquiries, modalEnquiryId]);

  const modalMeta = useMemo(() => {
    return parseCrmMeta(modalEnquiry?.internal_notes);
  }, [modalEnquiry]);

  // Aggregate KPI stats
  const stats = useMemo(() => {
    let total = enquiries.length;
    let countNew = 0;
    let countPreparing = 0;
    let countSent = 0;
    let countRevision = 0;
    let countConverted = 0;
    let countLost = 0;

    for (const e of enquiries) {
      const meta = parseCrmMeta(e.internal_notes);
      const st = meta.crm_status || e.status;
      if (st === "new") countNew++;
      else if (st === "preparing_quote") countPreparing++;
      else if (st === "quote_sent") countSent++;
      else if (st === "revision_requested") countRevision++;
      else if (st === "converted" || st === "accepted") countConverted++;
      else if (st === "lost" || st === "closed") countLost++;
    }

    return {
      total,
      new: countNew,
      preparing: countPreparing,
      quoteSent: countSent,
      revision: countRevision,
      converted: countConverted,
      lost: countLost,
    };
  }, [enquiries]);

  // Filtered enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const meta = parseCrmMeta(e.internal_notes);
      const crmStatus = meta.crm_status || e.status;

      // Search match
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.phone && e.phone.toLowerCase().includes(q)) ||
        (meta.country && meta.country.toLowerCase().includes(q)) ||
        (meta.preferred_package && meta.preferred_package.toLowerCase().includes(q)) ||
        e.enquiry_type.toLowerCase().includes(q);

      // Travel type match
      const matchesTravelType =
        filterTravelType === "all" ||
        e.enquiry_type.toLowerCase() === filterTravelType.toLowerCase();

      // Status match
      const matchesStatus =
        filterStatus === "all" ||
        crmStatus === filterStatus ||
        (filterStatus === "converted" && (crmStatus === "converted" || crmStatus === "accepted")) ||
        (filterStatus === "lost" && (crmStatus === "lost" || crmStatus === "closed"));

      return matchesSearch && matchesTravelType && matchesStatus;
    });
  }, [enquiries, search, filterTravelType, filterStatus]);

  function handleStatusChange(enquiryId: string, newStatus: string) {
    startTransition(async () => {
      const typedStatus = newStatus as
        | "new"
        | "contacted"
        | "preparing_quote"
        | "quote_sent"
        | "revision_requested"
        | "accepted"
        | "converted"
        | "lost";

      await updateEnquiryCrm(enquiryId, { crm_status: typedStatus });

      setEnquiries((prev) =>
        prev.map((item) => {
          if (item.id === enquiryId) {
            const m = parseCrmMeta(item.internal_notes);
            return {
              ...item,
              internal_notes: JSON.stringify({ ...m, crm_status: typedStatus }),
            };
          }
          return item;
        })
      );
    });
  }

  function handleAddLeadSubmit(formData: FormData) {
    const input: CreateEnquiryInput = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      country: String(formData.get("country") ?? "UAE").trim(),
      enquiry_type: String(formData.get("enquiry_type") ?? "Umrah"),
      travel_date: String(formData.get("travel_date") ?? "").trim() || undefined,
      adults: Number(formData.get("adults")) || 2,
      children: Number(formData.get("children")) || 0,
      preferred_package: String(formData.get("preferred_package") ?? "Standard"),
      crm_status: "new",
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    };

    startTransition(async () => {
      try {
        const newId = await createEnquiryLead(input);
        setShowAddModal(false);
        const newRecord: EnquiryRow = {
          id: newId,
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          enquiry_type: input.enquiry_type,
          number_of_travellers: `${input.adults} Adults${input.children ? `, ${input.children} Children` : ""}`,
          travel_date: input.travel_date || null,
          page_source: "Admin CRM Lead Form",
          status: "new",
          internal_notes: JSON.stringify({
            crm_status: "new",
            country: input.country,
            travel_dates: input.travel_date,
            preferred_package: input.preferred_package,
            adults: input.adults,
            children: input.children,
            notes: input.notes,
          }),
          message: input.notes || null,
          referring_url: null,
          received_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEnquiries((prev) => [newRecord, ...prev]);
        setSelectedEnquiryId(newId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to add enquiry.");
      }
    });
  }

  function toggleAll() {
    if (selectedIds.size === filteredEnquiries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEnquiries.map((e) => e.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected leads? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    setEnquiries((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    await deleteEnquiries(ids);
  }

  return (
    <div className="space-y-6">
      {/* ── BREADCRUMB & HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-r from-[#FAF8F5] via-[#F4EFE6] to-[#FAF8F5] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-masaar-black/50 mb-1">
              <Link href="/admin">Dashboard</Link> ›{" "}
              <Link href="/admin/documents">Documents</Link> › Enquiries
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-masaar-black">Enquiries</h1>
            <p className="mt-1 text-sm text-masaar-black/60">
              Manage client trip requests, contact details, and booking status in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GoldButton onClick={() => setShowAddModal(true)} type="button">
              <span>+</span> Add New Enquiry
            </GoldButton>
          </div>
        </div>
      </div>

      {/* ── 7 SUMMARY KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-masaar-black/50 text-xs font-semibold uppercase tracking-wider">
            <span>👥</span> Total
          </div>
          <p className="mt-2 text-2xl font-bold text-masaar-black">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <span>✨</span> New
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">{stats.new}</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold uppercase tracking-wider">
            <span>📄</span> Preparing
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-900">{stats.preparing}</p>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-sky-700 text-xs font-semibold uppercase tracking-wider">
            <span>✈️</span> Quote Sent
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-900">{stats.quoteSent}</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold uppercase tracking-wider">
            <span>🔄</span> Revision
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">{stats.revision}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <span>✅</span> Converted
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.converted}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>✕</span> Lost
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-700">{stats.lost}</p>
        </div>
      </div>

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
          {/* Search Input */}
          <div className="lg:col-span-6 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-masaar-black/40">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by client name, email, phone, trip details…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-black/15 bg-white py-2 pl-9 pr-3 text-xs focus:border-admin-primary focus:outline-none"
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

          {/* Travel Type Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterTravelType}
              onChange={(e) => setFilterTravelType(e.target.value)}
              className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs focus:border-admin-primary focus:outline-none"
            >
              <option value="all">Trip Request: All Types</option>
              <option value="Umrah">Umrah</option>
              <option value="Hajj">Hajj</option>
              <option value="Hotels">Hotels</option>
              <option value="Transfers">Transfers</option>
              <option value="Private Trip">Private Trip</option>
              <option value="Visa">Visa</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-xs focus:border-admin-primary focus:outline-none"
            >
              <option value="all">Status: All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="preparing_quote">Preparing Quote</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="revision_requested">Revision Requested</option>
              <option value="accepted">Accepted</option>
              <option value="converted">Converted to Booking</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Action bar for active filters or batch delete */}
        {(search || filterTravelType !== "all" || filterStatus !== "all" || selectedIds.size > 0) && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/5 text-xs">
            <div className="flex items-center gap-2">
              {(search || filterTravelType !== "all" || filterStatus !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterTravelType("all");
                    setFilterStatus("all");
                  }}
                  className="rounded-md border border-black/15 bg-white px-3 py-1 font-semibold text-masaar-black hover:bg-black/5"
                >
                  Clear Filters
                </button>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="rounded-md bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-700"
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MASTER-DETAIL SPLIT GRID (TABLE + RIGHT DRAWER) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT: MASTER TABLE */}
        <div className={`overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xs ${selectedEnquiry ? "lg:col-span-8" : "lg:col-span-12"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/10 bg-[#FAF9F6] uppercase tracking-wide text-masaar-black/50 font-semibold">
                <tr>
                  <th className="w-8 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredEnquiries.length && filteredEnquiries.length > 0}
                      onChange={toggleAll}
                      className="rounded border-black/20"
                    />
                  </th>
                  <th className="px-3 py-3">Enquiry No.</th>
                  <th className="px-3 py-3">Client Details</th>
                  <th className="px-3 py-3">Trip Request</th>
                  <th className="px-3 py-3">Trip Date</th>
                  <th className="px-3 py-3">Status of Booking</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredEnquiries.length === 0 && (
                  <EmptyRow colSpan={7}>
                    No client enquiries found. Click &quot;+ Add New Enquiry&quot; above to create one.
                  </EmptyRow>
                )}
                {filteredEnquiries.map((e, index) => {
                  const meta = parseCrmMeta(e.internal_notes);
                  const crmStatus = meta.crm_status || e.status;
                  const cfg = STATUS_CONFIG[crmStatus] || STATUS_CONFIG.new;
                  const isRowSelected = selectedEnquiryId === e.id;
                  const displayId = formatEnquiryId(index, e.id);

                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedEnquiryId(e.id)}
                      className={`cursor-pointer transition-colors ${
                        isRowSelected ? "bg-amber-50/60 font-medium" : "hover:bg-black/[0.02]"
                      }`}
                    >
                      <td className="px-3 py-3 text-center" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(e.id)}
                          onChange={() => toggleOne(e.id)}
                          className="rounded border-black/20"
                        />
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-admin-primary whitespace-nowrap">
                        {displayId}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-masaar-black">{e.name}</p>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-masaar-black/60 font-mono mt-0.5">
                          {e.phone && <span>{e.phone}</span>}
                          {e.phone && e.email && <span>•</span>}
                          {e.email && <span className="font-sans truncate max-w-[140px]">{e.email}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-masaar-black/80">
                            {e.enquiry_type}
                          </span>
                          {meta.preferred_package && (
                            <span className="text-[11px] text-deep-gold font-medium">
                              {meta.preferred_package}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-masaar-black/50 mt-0.5">
                          {meta.adults ? `${meta.adults} Adults` : "2 Adults"}
                          {meta.children ? `, ${meta.children} Children` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-masaar-black/70">
                        {meta.travel_dates || e.travel_date || "Not specified"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedEnquiryId(e.id);
                            setModalEnquiryId(e.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-admin-primary/20 bg-admin-primary/5 px-2.5 py-1 text-xs font-semibold text-admin-primary transition-colors hover:bg-admin-primary hover:text-white"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-black/5 bg-[#FAF9F6] text-xs text-masaar-black/50 flex justify-between items-center">
            <span>Showing {filteredEnquiries.length} of {enquiries.length} enquiries</span>
          </div>
        </div>

        {/* RIGHT: SELECTED LEAD DETAILS DRAWER */}
        {selectedEnquiry && (
          <div className="lg:col-span-4 space-y-4 sticky top-6">
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <div>
                  <h3 className="font-mono text-base font-bold text-masaar-black">
                    {formatEnquiryId(
                      enquiries.findIndex((e) => e.id === selectedEnquiry.id),
                      selectedEnquiry.id
                    )}
                  </h3>
                  <div className="mt-1">
                    {(() => {
                      const cfg =
                        STATUS_CONFIG[selectedMeta.crm_status || selectedEnquiry.status] ||
                        STATUS_CONFIG.new;
                      return (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEnquiryId(null)}
                    className="rounded p-1 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black text-xs"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 1. Client Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60 mb-2">
                  Client Details
                </h4>
                <div className="rounded-lg border border-black/10 bg-[#FAF9F6] p-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-masaar-black/50">Client Name:</span>
                    <span className="font-bold text-masaar-black">{selectedEnquiry.name}</span>
                  </div>

                  {selectedEnquiry.phone ? (
                    <div className="flex justify-between items-center">
                      <span className="text-masaar-black/50">Phone Number:</span>
                      <a
                        href={`https://wa.me/${selectedEnquiry.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>💬</span> {selectedEnquiry.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-masaar-black/50">Phone Number:</span>
                      <span className="text-masaar-black/40">Not provided</span>
                    </div>
                  )}

                  {selectedEnquiry.email ? (
                    <div className="flex justify-between items-center">
                      <span className="text-masaar-black/50">Email Address:</span>
                      <a
                        href={`mailto:${selectedEnquiry.email}`}
                        className="font-medium text-admin-primary hover:underline truncate max-w-[180px]"
                      >
                        {selectedEnquiry.email}
                      </a>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-masaar-black/50">Email Address:</span>
                      <span className="text-masaar-black/40">Not provided</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-masaar-black/50">Country / City:</span>
                    <span className="text-masaar-black">{selectedMeta.country || "UAE"}</span>
                  </div>
                </div>
              </div>

              {/* 2. Trip Request Details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60 mb-2">
                  Trip Request Details
                </h4>
                <div className="rounded-lg border border-black/10 bg-[#FAF9F6] p-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-masaar-black/50">Enquiry Number:</span>
                    <span className="font-mono font-semibold text-admin-primary">
                      {formatEnquiryId(
                        enquiries.findIndex((e) => e.id === selectedEnquiry.id),
                        selectedEnquiry.id
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/50">Trip Request:</span>
                    <span className="font-semibold text-masaar-black">{selectedEnquiry.enquiry_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/50">Trip Date:</span>
                    <span className="text-masaar-black font-medium">
                      {selectedMeta.travel_dates || selectedEnquiry.travel_date || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/50">Passengers:</span>
                    <span className="text-masaar-black">
                      {selectedMeta.adults ?? 2} Adults, {selectedMeta.children ?? 0} Children
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/50">Requested Package:</span>
                    <span className="font-medium text-deep-gold">{selectedMeta.preferred_package || "Standard"}</span>
                  </div>
                  {(selectedMeta.notes || selectedEnquiry.message) && (
                    <div className="pt-2 border-t border-black/5">
                      <span className="text-masaar-black/50 block mb-1">Trip Request Notes:</span>
                      <p className="text-masaar-black/80 italic whitespace-pre-line text-[11px] leading-relaxed">
                        {selectedMeta.notes || selectedEnquiry.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Status of Booking */}
              <div className="space-y-2 pt-2 border-t border-black/10">
                <span className="text-xs font-bold uppercase tracking-wider text-masaar-black/60 block">
                  Status of Booking / Enquiry
                </span>
                <select
                  value={selectedMeta.crm_status || selectedEnquiry.status}
                  onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value)}
                  className="w-full text-xs font-semibold border border-black/15 rounded-md px-3 py-2 bg-white focus:outline-none text-admin-primary"
                  disabled={isPending}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="preparing_quote">Preparing Quote</option>
                  <option value="quote_sent">Quote Sent</option>
                  <option value="revision_requested">Revision Requested</option>
                  <option value="accepted">Accepted</option>
                  <option value="converted">Converted to Booking</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* 4. Direct Communication Actions */}
              <div className="pt-3 border-t border-black/10">
                <p className="text-[11px] font-semibold text-masaar-black/50 uppercase tracking-wider mb-2">
                  Client Communication
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedEnquiry.phone ? (
                    <a
                      href={`https://wa.me/${selectedEnquiry.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Assalamu Alaikum ${selectedEnquiry.name}, thank you for contacting Masaar Holidays regarding your ${selectedEnquiry.enquiry_type} trip enquiry.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded-md border border-black/10 px-3 py-2 text-xs text-black/30"
                    >
                      No WhatsApp
                    </button>
                  )}

                  {selectedEnquiry.email ? (
                    <a
                      href={`mailto:${selectedEnquiry.email}?subject=${encodeURIComponent(
                        `Masaar Holidays — ${selectedEnquiry.enquiry_type} Trip Enquiry`
                      )}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
                    >
                      <span>✉️</span> Email
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded-md border border-black/10 px-3 py-2 text-xs text-black/30"
                    >
                      No Email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD NEW ENQUIRY MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-masaar-black">Add New Enquiry</h3>
                <p className="text-xs text-masaar-black/60">Log a new client trip request into the enquiries dashboard.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-masaar-black/40 hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <form action={handleAddLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <Field label="Client Name" required>
                    <input name="name" required className={inputClass} placeholder="e.g. Mrs Mohammed" />
                  </Field>
                </div>

                <Field label="Phone / WhatsApp">
                  <input name="phone" className={inputClass} placeholder="e.g. +971 50 123 4567" />
                </Field>

                <Field label="Email Address">
                  <input name="email" type="email" className={inputClass} placeholder="client@example.com" />
                </Field>

                <Field label="Country / City">
                  <input name="country" className={inputClass} defaultValue="Dubai, UAE" />
                </Field>

                <Field label="Trip Request / Travel Type">
                  <select name="enquiry_type" className={inputClass} defaultValue="Umrah">
                    <option value="Umrah">Umrah</option>
                    <option value="Hajj">Hajj</option>
                    <option value="Hotels">Hotels</option>
                    <option value="Transfers">Transfers</option>
                    <option value="Private Trip">Private Trip</option>
                    <option value="Visa">Visa</option>
                  </select>
                </Field>

                <Field label="Preferred Package">
                  <select name="preferred_package" className={inputClass} defaultValue="Exclusive">
                    <option value="Exclusive">Exclusive Package (Non-Shifting)</option>
                    <option value="Signature">Signature Package (Shifting)</option>
                    <option value="Essential">Essential Package (Shifting)</option>
                    <option value="VIP Custom">VIP Custom Itinerary</option>
                  </select>
                </Field>

                <Field label="Trip Date (if available)">
                  <input name="travel_date" className={inputClass} placeholder="e.g. 10 Jun 2026 – 23 Jun 2026" />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Adults">
                    <input name="adults" type="number" min="1" defaultValue="2" className={inputClass} />
                  </Field>
                  <Field label="Children">
                    <input name="children" type="number" min="0" defaultValue="0" className={inputClass} />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Trip Request Notes / Requirements">
                    <textarea
                      name="notes"
                      rows={2}
                      className={inputClass}
                      placeholder="e.g. Looking for 5 star hotels near Haram. Prefer direct flights."
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-black/10">
                <SecondaryButton type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isPending}>
                  {isPending ? "Creating Enquiry…" : "Save Enquiry"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ENQUIRY DETAILS POPUP MODAL (PACKAGE INFO, CONTACT DETAILS, STATUS OF TRIP) ── */}
      {modalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-admin-primary/10 text-admin-primary text-lg font-bold">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-lg font-bold text-masaar-black">
                      {formatEnquiryId(
                        enquiries.findIndex((e) => e.id === modalEnquiry.id),
                        modalEnquiry.id
                      )}
                    </h3>
                    {(() => {
                      const cfg =
                        STATUS_CONFIG[modalMeta.crm_status || modalEnquiry.status] ||
                        STATUS_CONFIG.new;
                      return (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-masaar-black/60">
                    Enquiry Details &amp; Booking Status
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalEnquiryId(null)}
                className="rounded-full p-2 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black text-sm"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* 1. Contact Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60 mb-2 flex items-center gap-1.5">
                <span>👤</span> Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-black/10 bg-[#FAF9F6] p-4 text-xs">
                <div>
                  <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Client Name</span>
                  <span className="font-bold text-sm text-masaar-black">{modalEnquiry.name}</span>
                </div>

                <div>
                  <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Country / City</span>
                  <span className="text-masaar-black font-medium">{modalMeta.country || "Dubai, UAE"}</span>
                </div>

                <div>
                  <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Phone / WhatsApp</span>
                  {modalEnquiry.phone ? (
                    <a
                      href={`https://wa.me/${modalEnquiry.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-700 hover:underline flex items-center gap-1 font-mono text-xs mt-0.5"
                    >
                      <span>💬</span> {modalEnquiry.phone}
                    </a>
                  ) : (
                    <span className="text-masaar-black/40">Not provided</span>
                  )}
                </div>

                <div>
                  <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Email Address</span>
                  {modalEnquiry.email ? (
                    <a
                      href={`mailto:${modalEnquiry.email}`}
                      className="font-medium text-admin-primary hover:underline truncate block text-xs mt-0.5"
                    >
                      {modalEnquiry.email}
                    </a>
                  ) : (
                    <span className="text-masaar-black/40">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Package & Trip Information */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60 mb-2 flex items-center gap-1.5">
                <span>📦</span> Package &amp; Trip Information
              </h4>
              <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-4 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Trip Request</span>
                    <span className="inline-block mt-0.5 rounded bg-black/5 px-2 py-0.5 text-xs font-semibold text-masaar-black">
                      {modalEnquiry.enquiry_type}
                    </span>
                  </div>

                  <div>
                    <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Preferred Package</span>
                    <span className="font-semibold text-deep-gold text-xs block mt-0.5">
                      {modalMeta.preferred_package || "Standard Package"}
                    </span>
                  </div>

                  <div>
                    <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Passengers</span>
                    <span className="text-masaar-black font-medium text-xs block mt-0.5">
                      {modalMeta.adults ?? 2} Adults, {modalMeta.children ?? 0} Children
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/5">
                  <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold">Trip Date</span>
                  <span className="text-masaar-black font-semibold text-xs mt-0.5 block">
                    {modalMeta.travel_dates || modalEnquiry.travel_date || "Flexible / Not specified"}
                  </span>
                </div>

                {(modalMeta.notes || modalEnquiry.message) && (
                  <div className="pt-2 border-t border-black/5">
                    <span className="text-masaar-black/50 block text-[10px] uppercase font-semibold mb-1">
                      Special Requirements / Notes
                    </span>
                    <p className="text-masaar-black/80 italic whitespace-pre-line text-xs leading-relaxed bg-white p-3 rounded-lg border border-black/5">
                      {modalMeta.notes || modalEnquiry.message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Status of Trip / Booking */}
            <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-4 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/70 flex items-center gap-1.5">
                    <span>🔄</span> Status of Trip / Booking
                  </h4>
                  <p className="text-[11px] text-masaar-black/50 mt-0.5">
                    Update the current booking stage for this enquiry.
                  </p>
                </div>

                <div className="sm:w-60">
                  <select
                    value={modalMeta.crm_status || modalEnquiry.status}
                    onChange={(e) => handleStatusChange(modalEnquiry.id, e.target.value)}
                    className="w-full text-xs font-bold border border-black/15 rounded-md px-3 py-2 bg-white focus:outline-none text-admin-primary shadow-2xs"
                    disabled={isPending}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="preparing_quote">Preparing Quote</option>
                    <option value="quote_sent">Quote Sent</option>
                    <option value="revision_requested">Revision Requested</option>
                    <option value="accepted">Accepted</option>
                    <option value="converted">Converted to Booking</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Communication & Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/10">
              <div className="flex items-center gap-2">
                {modalEnquiry.phone && (
                  <a
                    href={`https://wa.me/${modalEnquiry.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Assalamu Alaikum ${modalEnquiry.name}, thank you for contacting Masaar Holidays regarding your ${modalEnquiry.enquiry_type} enquiry.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>💬</span> WhatsApp
                  </a>
                )}
                {modalEnquiry.email && (
                  <a
                    href={`mailto:${modalEnquiry.email}?subject=${encodeURIComponent(
                      `Masaar Holidays — ${modalEnquiry.enquiry_type} Trip Enquiry`
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
                  >
                    <span>✉️</span> Email
                  </a>
                )}
              </div>

              <SecondaryButton type="button" onClick={() => setModalEnquiryId(null)}>
                Close
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
