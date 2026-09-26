"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  Badge,
} from "@/components/admin/ui";
import { saveDocumentVersion } from "../../../actions";
import type { DocumentRow, DocumentVersionRow } from "@/lib/types/database";

function statusTone(status?: string): "green" | "amber" | "gray" | "blue" | "gold" {
  if (status === "accepted") return "green";
  if (status === "revision_requested") return "amber";
  if (["sent", "viewed"].includes(status ?? "")) return "gold";
  if (status === "rejected") return "gray";
  return "blue";
}

export function QuotationVersionHistory({
  document,
  versions,
  shareToken,
}: {
  document: DocumentRow;
  versions: DocumentVersionRow[];
  shareToken?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || "current"
  );
  const [activeTab, setActiveTab] = useState<"preview" | "compare" | "changelog">("preview");

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];
  const snapshotDoc = (selectedVersion?.snapshot as any)?.document ?? document;
  const snapshotItems = (selectedVersion?.snapshot as any)?.items ?? [];

  function handleCreateNewVersion() {
    startTransition(async () => {
      try {
        await saveDocumentVersion(document.id, "quotation");
        router.refresh();
      } catch (err: any) {
        alert(err instanceof Error ? err.message : "Failed to create version.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="text-xs text-masaar-black/50">
            <Link href="/admin/documents" className="hover:text-masaar-black">
              Documents &amp; Bookings
            </Link>
            <span className="mx-2">&gt;</span>
            <Link href="/admin/documents/quotations" className="hover:text-masaar-black">
              Quotations
            </Link>
            <span className="mx-2">&gt;</span>
            <Link href={`/admin/documents/quotations/${document.id}`} className="hover:text-masaar-black">
              {document.document_number}
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="font-semibold text-masaar-black">Version History</span>
          </nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-masaar-black sm:text-3xl">
            Quotation Version History
          </h1>
          <p className="mt-0.5 text-xs text-masaar-black/60">
            Track, compare and manage all versions and revisions of this quotation.
          </p>
        </div>

        <Link href={`/admin/documents/quotations/${document.id}`}>
          <SecondaryButton type="button">
            ← Back to Quotation
          </SecondaryButton>
        </Link>
      </div>

      {/* Summary Header Strip Card */}
      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-xs">
          <div>
            <span className="uppercase text-masaar-black/40 font-medium">Quotation Number</span>
            <p className="mt-1 font-semibold text-masaar-black">{document.document_number}</p>
          </div>
          <div>
            <span className="uppercase text-masaar-black/40 font-medium">Client</span>
            <p className="mt-1 font-semibold text-masaar-black">{document.client_name}</p>
            <p className="text-[11px] text-masaar-black/50">{document.client_country || "Dubai, UAE"}</p>
          </div>
          <div>
            <span className="uppercase text-masaar-black/40 font-medium">Journey Type</span>
            <p className="mt-1 font-semibold capitalize text-masaar-black">
              {document.journey_type ?? "Umrah"}
            </p>
          </div>
          <div>
            <span className="uppercase text-masaar-black/40 font-medium">Travel Dates</span>
            <p className="mt-1 font-semibold text-masaar-black">
              {document.travel_date ? document.travel_date : "Pending"}
            </p>
            <p className="text-[11px] text-masaar-black/50">
              {document.adults} Adults, {document.children ?? 0} Children
            </p>
          </div>
          <div>
            <span className="uppercase text-masaar-black/40 font-medium">Current Status</span>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={statusTone(document.status)}>
                {document.status.replace(/_/g, " ").toUpperCase()}
              </Badge>
              <span className="text-[11px] text-masaar-black/50">
                v{versions[0]?.version_number ?? 1}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Versions Timeline Left, Details/Preview Right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Timeline */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-masaar-black">
              All Versions ({versions.length || 1})
            </h3>
            <PrimaryButton
              type="button"
              onClick={handleCreateNewVersion}
              disabled={isPending}
              className="text-xs"
            >
              + Create New Version
            </PrimaryButton>
          </div>

          <div className="space-y-4">
            {versions.length === 0 ? (
              <Card>
                <div className="flex items-start gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-light-gold font-bold text-masaar-black">
                    1
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-masaar-black">Version 1</h4>
                      <Badge tone="blue">Current</Badge>
                    </div>
                    <p className="mt-1 text-xs text-masaar-black/60">
                      Initial quotation created on {new Date(document.created_at).toLocaleDateString()}.
                    </p>
                    <p className="mt-2 text-sm font-bold text-masaar-black">
                      Total Amount: AED {Number(document.total_aed ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              versions.map((ver, idx) => {
                const isSelected = ver.id === selectedVersionId;
                const isCurrent = idx === 0;
                const snapDoc = (ver.snapshot as any)?.document ?? document;

                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`transition-all ${
                        isSelected ? "border-admin-primary ring-2 ring-admin-primary/20 shadow-sm" : "hover:border-black/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-light-gold font-bold text-masaar-black text-sm">
                            {ver.version_number}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-masaar-black">
                                Version {ver.version_number}
                              </h4>
                              <Badge tone={statusTone(ver.status_at_version)}>
                                {ver.status_at_version.replace(/_/g, " ")}
                              </Badge>
                              {isCurrent && <Badge tone="gold">Current</Badge>}
                            </div>
                            <p className="mt-1 text-xs text-masaar-black/50">
                              Created on {new Date(ver.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="mt-2 text-xs text-masaar-black/70">
                              {ver.version_number === 1
                                ? "Initial quotation generated based on client inquiry."
                                : "Revised itinerary, accommodation and services configured for client."}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs uppercase text-masaar-black/40 font-medium">Total Amount</span>
                          <p className="text-base font-bold text-masaar-black">
                            AED {Number(snapDoc.total_aed ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Version Inspector & Preview */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <div className="flex border-b border-black/10">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex-1 py-2 text-center text-xs font-semibold transition-colors ${
                  activeTab === "preview"
                    ? "border-b-2 border-admin-primary text-admin-primary"
                    : "text-masaar-black/60 hover:text-masaar-black"
                }`}
              >
                Version Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("compare")}
                className={`flex-1 py-2 text-center text-xs font-semibold transition-colors ${
                  activeTab === "compare"
                    ? "border-b-2 border-admin-primary text-admin-primary"
                    : "text-masaar-black/60 hover:text-masaar-black"
                }`}
              >
                Item Breakdown
              </button>
            </div>

            {activeTab === "preview" ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-lg border border-black/10 bg-warm-ivory/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-admin-primary">Masaar Holidays</span>
                    <Badge tone={statusTone(snapshotDoc.status)}>
                      {snapshotDoc.status}
                    </Badge>
                  </div>
                  <h4 className="mt-2 font-serif text-base font-bold text-masaar-black">
                    Your {snapshotDoc.journey_type || "Umrah"} Journey
                  </h4>
                  <p className="mt-1 text-masaar-black/60">
                    Prepared for: <span className="font-semibold text-masaar-black">{snapshotDoc.client_name}</span>
                  </p>
                  <p className="text-masaar-black/60">
                    Travellers: {snapshotDoc.adults} Adults, {snapshotDoc.children ?? 0} Children
                  </p>
                  <div className="mt-3 border-t border-black/10 pt-2 font-bold text-masaar-black">
                    Total: AED {Number(snapshotDoc.total_aed ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Link href={`/admin/documents/quotations/${document.id}/pdf`} className="block">
                    <PrimaryButton type="button" className="w-full justify-center text-xs py-2">
                      📄 View PDF Preview
                    </PrimaryButton>
                  </Link>

                  {shareToken && (
                    <Link href={`/quote/${shareToken}`} target="_blank" className="block">
                      <SecondaryButton type="button" className="w-full justify-center text-xs py-2">
                        👁️ Open Client Secure Link
                      </SecondaryButton>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs max-h-96 overflow-y-auto">
                {snapshotItems.length === 0 ? (
                  <p className="text-masaar-black/50 text-center py-4">No items recorded in this version snapshot.</p>
                ) : (
                  snapshotItems.map((item: any, i: number) => (
                    <div key={i} className="rounded border border-black/10 p-2.5">
                      <p className="font-semibold text-masaar-black">{item.description}</p>
                      {item.details && <p className="text-[11px] text-masaar-black/60 mt-0.5">{item.details}</p>}
                      <div className="mt-1 flex justify-between text-masaar-black/70 font-medium">
                        <span>Qty: {item.quantity}</span>
                        <span>AED {Number(item.amount_aed ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
