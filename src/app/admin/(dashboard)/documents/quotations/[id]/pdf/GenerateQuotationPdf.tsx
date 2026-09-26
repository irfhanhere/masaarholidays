"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  SecondaryButton,
} from "@/components/admin/ui";
import { QuotationDocumentView, PDF_PAGE_SECTIONS } from "@/components/documents/QuotationDocumentView";
import { ShareQuotationModal } from "@/components/documents/ShareQuotationModal";
import type { DocumentItemRow, DocumentRow, DocumentTemplateRow } from "@/lib/types/database";

export function GenerateQuotationPdf({
  document,
  items,
  template,
  shareToken,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  shareToken?: string;
}) {
  const [templateStyle, setTemplateStyle] = useState<"premium" | "classic" | "minimal">("premium");
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(PDF_PAGE_SECTIONS.map((s) => s.id))
  );
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [addPageNumbers, setAddPageNumbers] = useState(true);
  const [customCoverMessage, setCustomCoverMessage] = useState(
    "A sacred journey, thoughtfully curated for you."
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isPreviewAll, setIsPreviewAll] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  function toggleSection(id: string) {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const enabledList = PDF_PAGE_SECTIONS.filter((s) => selectedSections.has(s.id));
  const totalEnabledPages = enabledList.length || 12;

  // Active section for current page
  const activeSection = enabledList[currentPage - 1] || enabledList[0] || PDF_PAGE_SECTIONS[0];

  const pdfDownloadUrl = shareToken ? `/quote/${shareToken}/pdf` : "#";
  const publicQuoteUrl = shareToken ? `/quote/${shareToken}` : "#";

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
            <span className="font-semibold text-masaar-black">Generate PDF</span>
          </nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-masaar-black sm:text-3xl">
            Generate Quotation PDF
          </h1>
          <p className="mt-0.5 text-xs text-masaar-black/60">
            Create a professional PDF for your client. Select sections, customise content and preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {shareToken && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03] cursor-pointer"
            >
              <span>🔗</span> Share with Pax
            </button>
          )}

          <Link href={`/admin/documents/quotations/${document.id}`}>
            <SecondaryButton type="button">
              ← Back to Quotation
            </SecondaryButton>
          </Link>
        </div>
      </div>

      {/* Main 3-Column Layout matching QUOTATION PDF.png:
          Left: PDF Settings (3 Cols) | Center: Live A4 Canvas (7 Cols) | Right: Pages Rail (2 Cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: PDF Settings Panel */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="!p-5">
            <div className="flex items-center gap-2 border-b border-black/10 pb-3">
              <div className="h-5 w-1 rounded-full bg-[#b37e28]" />
              <h3 className="font-serif text-base font-bold text-masaar-black">
                PDF Settings
              </h3>
            </div>

            {/* Template Style */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-masaar-black/50">
                Template Style
              </span>

              <label
                onClick={() => setTemplateStyle("premium")}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all ${
                  templateStyle === "premium"
                    ? "border-[#b37e28] bg-light-gold/15 ring-1 ring-[#b37e28]"
                    : "border-black/10 hover:border-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="templateStyle"
                  checked={templateStyle === "premium"}
                  onChange={() => setTemplateStyle("premium")}
                  className="text-[#b37e28] focus:ring-[#b37e28]"
                />
                <div className="relative h-10 w-9 shrink-0 overflow-hidden rounded border border-black/10 bg-neutral-100">
                  <Image src="/Assets/banner-image.png" alt="Premium" fill className="object-cover" unoptimized />
                </div>
                <div>
                  <p className="text-xs font-bold text-masaar-black">Masaar Premium</p>
                  <p className="text-[10px] text-masaar-black/60">Modern and elegant (Recommended)</p>
                </div>
              </label>

              <label
                onClick={() => setTemplateStyle("classic")}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all ${
                  templateStyle === "classic"
                    ? "border-[#b37e28] bg-light-gold/15 ring-1 ring-[#b37e28]"
                    : "border-black/10 hover:border-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="templateStyle"
                  checked={templateStyle === "classic"}
                  onChange={() => setTemplateStyle("classic")}
                  className="text-[#b37e28] focus:ring-[#b37e28]"
                />
                <div className="relative h-10 w-9 shrink-0 overflow-hidden rounded border border-black/10 bg-white flex items-center justify-center text-xs">
                  🏛️
                </div>
                <div>
                  <p className="text-xs font-bold text-masaar-black">Masaar Classic</p>
                  <p className="text-[10px] text-masaar-black/60">Clean and professional</p>
                </div>
              </label>

              <label
                onClick={() => setTemplateStyle("minimal")}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all ${
                  templateStyle === "minimal"
                    ? "border-[#b37e28] bg-light-gold/15 ring-1 ring-[#b37e28]"
                    : "border-black/10 hover:border-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="templateStyle"
                  checked={templateStyle === "minimal"}
                  onChange={() => setTemplateStyle("minimal")}
                  className="text-[#b37e28] focus:ring-[#b37e28]"
                />
                <div className="relative h-10 w-9 shrink-0 overflow-hidden rounded border border-black/10 bg-white flex items-center justify-center text-xs">
                  📄
                </div>
                <div>
                  <p className="text-xs font-bold text-masaar-black">Masaar Minimal</p>
                  <p className="text-[10px] text-masaar-black/60">Simple and clean</p>
                </div>
              </label>
            </div>

            {/* Include Sections Checklist */}
            <div className="mt-5 border-t border-black/10 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-masaar-black/50">
                Include Sections
              </span>
              <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {PDF_PAGE_SECTIONS.map((sec) => (
                  <label
                    key={sec.id}
                    className="flex cursor-pointer items-center justify-between rounded p-1.5 text-xs text-masaar-black hover:bg-black/[0.02]"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSections.has(sec.id)}
                        onChange={() => toggleSection(sec.id)}
                        className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28]"
                      />
                      <span>{sec.label}</span>
                    </div>
                    <span className="text-black/30 font-mono text-[11px]">::</span>
                  </label>
                ))}
              </div>
            </div>

            {/* PDF Options */}
            <div className="mt-5 border-t border-black/10 pt-4 space-y-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-masaar-black/50">
                PDF Options
              </span>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28]"
                />
                <span>Include company logo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFooter}
                  onChange={(e) => setIncludeFooter(e.target.checked)}
                  className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28]"
                />
                <span>Include footer with contact details</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addPageNumbers}
                  onChange={(e) => setAddPageNumbers(e.target.checked)}
                  className="rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28]"
                />
                <span>Add page numbers</span>
              </label>

              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-masaar-black/60">Custom message on cover (optional)</span>
                  <span className="text-[10px] text-masaar-black/40">{customCoverMessage.length}/100</span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={customCoverMessage}
                  onChange={(e) => setCustomCoverMessage(e.target.value)}
                  className="mt-1 w-full rounded border border-black/15 p-2 text-xs text-masaar-black"
                />
              </div>
            </div>

            {/* Bottom Buttons matching QUOTATION PDF.png */}
            <div className="mt-6 border-t border-black/10 pt-4 space-y-2.5">
              <a
                href={pdfDownloadUrl}
                download
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b37e28] py-3 text-sm font-semibold text-white shadow-md hover:bg-[#96681f] transition-all cursor-pointer"
              >
                <span>📄</span> Generate PDF
              </a>

              <button
                type="button"
                onClick={() => setIsPreviewAll(!isPreviewAll)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#b37e28] bg-white py-2.5 text-xs font-semibold text-[#b37e28] shadow-xs hover:bg-[#b37e28]/5 transition-all cursor-pointer"
              >
                <span>👁️</span> {isPreviewAll ? "Show Single Page View" : "Preview Full PDF"}
              </button>

              {shareToken && (
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-warm-ivory/60 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-light-gold/20 transition-all cursor-pointer"
                >
                  <span>🔗</span> Share Link with Passenger
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Center Column: Live A4 PDF Viewer (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Top Viewer Toolbar matching QUOTATION PDF.png */}
          <div className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-2 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPreviewAll(false);
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={currentPage <= 1 || isPreviewAll}
                className="rounded p-1 hover:bg-black/5 disabled:opacity-30"
              >
                ←
              </button>
              <div className="flex items-center gap-1 font-semibold text-masaar-black">
                <input
                  type="number"
                  min={1}
                  max={totalEnabledPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= totalEnabledPages) {
                      setIsPreviewAll(false);
                      setCurrentPage(val);
                    }
                  }}
                  className="h-6 w-10 rounded border border-black/20 text-center text-xs font-bold text-masaar-black"
                />
                <span className="text-black/50">/ {totalEnabledPages}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewAll(false);
                  setCurrentPage((p) => Math.min(totalEnabledPages, p + 1));
                }}
                disabled={currentPage >= totalEnabledPages || isPreviewAll}
                className="rounded p-1 hover:bg-black/5 disabled:opacity-30"
              >
                →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(60, z - 10))}
                className="rounded px-1.5 py-0.5 font-bold hover:bg-black/5 text-sm"
              >
                —
              </button>
              <span className="font-medium text-masaar-black w-10 text-center">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(130, z + 10))}
                className="rounded px-1.5 py-0.5 font-bold hover:bg-black/5 text-sm"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {shareToken && (
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="text-masaar-black/70 hover:text-[#b37e28] transition-colors cursor-pointer"
                  title="Share Quotation Link"
                >
                  🔗
                </button>
              )}
              <a href={pdfDownloadUrl} download className="text-masaar-black/70 hover:text-masaar-black" title="Download PDF">
                📥
              </a>
              <button type="button" onClick={() => window.print()} className="text-masaar-black/70 hover:text-masaar-black" title="Print Document">
                🖨️
              </button>
            </div>
          </div>

          {/* Rendered Canvas: Single Page or All Pages */}
          <div
            className="overflow-auto rounded-xl border border-black/15 bg-neutral-200/70 p-6 shadow-inner flex justify-center"
            style={{ minHeight: "850px" }}
          >
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
              }}
            >
              <QuotationDocumentView
                document={document}
                items={items}
                template={{
                  ...(template || ({} as any)),
                  layout: templateStyle,
                }}
                selectedPageId={isPreviewAll ? null : activeSection.id}
                enabledSections={selectedSections}
                customCoverMessage={customCoverMessage}
                showLogo={includeLogo}
                showFooter={includeFooter}
                showPageNumbers={addPageNumbers}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Page Thumbnails Rail (2 Cols) matching Pages (12) */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-masaar-black">
              Pages ({PDF_PAGE_SECTIONS.length})
            </h4>
          </div>

          <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
            {PDF_PAGE_SECTIONS.map((sec, idx) => {
              const pageNum = idx + 1;
              const isCurrent = !isPreviewAll && activeSection?.id === sec.id;
              const isIncluded = selectedSections.has(sec.id);

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setIsPreviewAll(false);
                    setCurrentPage(pageNum);
                  }}
                  className={`group block w-full rounded-lg border p-2 text-left transition-all ${
                    isCurrent
                      ? "border-[#b37e28] bg-light-gold/15 shadow-sm ring-2 ring-[#b37e28]/30"
                      : "border-black/10 bg-white hover:border-black/25"
                  } ${!isIncluded ? "opacity-40" : ""}`}
                >
                  {/* Miniature visual thumbnail */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded border border-black/10 bg-white flex flex-col justify-between p-1.5 shadow-2xs">
                    {sec.id === "cover" ? (
                      <div className="h-full w-full bg-[#0e0d0c] rounded flex flex-col justify-between p-1 text-[7px] text-white">
                        <div className="bg-[#FAF8F5] p-1 text-black text-center rounded-xs">
                          <span className="font-bold">MASAAR</span>
                        </div>
                        <div className="text-center font-serif text-[8px] text-[#d4af37] font-bold">
                          HAJJ / UMRAH
                        </div>
                        <div className="bg-black/50 p-0.5 text-[6px] text-center text-neutral-300">
                          Prepared for Client
                        </div>
                      </div>
                    ) : sec.id === "accommodation" ? (
                      <div className="h-full w-full flex flex-col gap-1 p-1">
                        <div className="h-2 border-b border-black/10 text-[6px] font-bold">Accommodations</div>
                        <div className="flex-1 rounded bg-neutral-100 flex items-center justify-center text-[8px]">
                          🏨 Swissôtel
                        </div>
                        <div className="flex-1 rounded bg-neutral-100 flex items-center justify-center text-[8px]">
                          🏨 Mövenpick
                        </div>
                      </div>
                    ) : sec.id === "transportation" ? (
                      <div className="h-full w-full flex flex-col justify-between p-1 text-center">
                        <span className="text-[6px] font-bold">Transfers</span>
                        <span className="text-base">🚗</span>
                        <span className="text-[6px] text-black/60">GMC Yukon</span>
                      </div>
                    ) : sec.id === "flights" ? (
                      <div className="h-full w-full flex flex-col justify-between p-1 text-center">
                        <span className="text-[6px] font-bold">Flights</span>
                        <span className="text-base">✈️</span>
                        <span className="text-[6px] text-black/60">Emirates</span>
                      </div>
                    ) : sec.id === "itinerary" ? (
                      <div className="h-full w-full flex flex-col gap-0.5 p-1 text-[6px]">
                        <span className="font-bold border-b pb-0.5">Itinerary</span>
                        <div className="space-y-0.5 text-[5px]">
                          <div>• Day 1 Arrival</div>
                          <div>• Days 2-5 Makkah</div>
                          <div>• Day 6 Train</div>
                          <div>• Days 7-9 Madinah</div>
                        </div>
                      </div>
                    ) : sec.id === "pricing" ? (
                      <div className="h-full w-full flex flex-col justify-between p-1">
                        <span className="text-[6px] font-bold">Pricing Table</span>
                        <div className="border border-black/10 rounded p-0.5 text-[5px] space-y-0.5">
                          <div className="flex justify-between"><span>Total:</span><span className="font-bold text-[#b37e28]">AED</span></div>
                        </div>
                      </div>
                    ) : sec.id === "thankyou" ? (
                      <div className="h-full w-full bg-[#0e0d0c] rounded flex flex-col justify-between p-1 text-[7px] text-white text-center">
                        <span className="text-[6px] text-[#d4af37]">MASAAR</span>
                        <span className="font-bold text-[7px]">Thank You</span>
                        <span className="text-[5px] text-neutral-400">Concierge</span>
                      </div>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-center p-1">
                        <span className="text-sm">📄</span>
                        <span className="text-[7px] font-semibold text-black/70 mt-1 line-clamp-1">
                          {sec.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-masaar-black">{pageNum}</span>
                    <span className="text-masaar-black/70 truncate text-[10px]">{sec.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share Modal Popup */}
      {shareToken && (
        <ShareQuotationModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          document={document}
          shareToken={shareToken}
        />
      )}
    </div>
  );
}
