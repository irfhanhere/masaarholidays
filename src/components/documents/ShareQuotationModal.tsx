"use client";

import { useState, useTransition } from "react";
import type { DocumentRow } from "@/lib/types/database";
import {
  calculateDateRangeMetrics,
  formatDisplayDate,
} from "@/lib/documents/calculations";

export function ShareQuotationModal({
  isOpen,
  onClose,
  document,
  shareToken,
}: {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRow;
  shareToken?: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [clientPhone, setClientPhone] = useState(document.client_phone || "");
  const [isPending, startTransition] = useTransition();

  const [useProductionUrl, setUseProductionUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        !window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("127.0.0.1")
      );
    }
    return true;
  });

  const effectiveToken = shareToken || document.id;
  const prodOrigin = "https://masaarholidays.com";
  const localOrigin = typeof window !== "undefined" ? window.location.origin : prodOrigin;
  const activeOrigin = useProductionUrl ? prodOrigin : localOrigin;
  const publicUrl = `${activeOrigin}/quote/${effectiveToken}`;

  // Date and duration calculations from saved data
  const dateMetrics = calculateDateRangeMetrics(
    document.travel_date,
    document.return_date,
    4
  );

  const travelDatesFormatted =
    document.travel_date && document.return_date
      ? `${formatDisplayDate(dateMetrics.startDate)} – ${formatDisplayDate(dateMetrics.endDate)}`
      : "To be confirmed";

  const travellerParts: string[] = [];
  if (document.adults) travellerParts.push(`${document.adults} Adults`);
  if (document.children) travellerParts.push(`${document.children} Children`);
  if (document.infants) travellerParts.push(`${document.infants} Infants`);
  const travellerSummary = travellerParts.length > 0 ? travellerParts.join(", ") : "2 Adults";

  const journeyLabel =
    document.journey_type === "hajj"
      ? "Hajj Pilgrimage"
      : document.journey_type === "hotel"
      ? "Hotel Booking"
      : document.journey_type === "transfer"
      ? "Private Transfer"
      : document.journey_type === "private_trip"
      ? "Private Trip / Ziyarat"
      : "Umrah Pilgrimage";

  // Check if unpriced
  const totalAmount = Number(document.total_aed || 0);
  const totalString = totalAmount > 0 ? `AED ${totalAmount.toLocaleString()}` : "Awaiting Supplier Confirmation";

  // Default WhatsApp message according to exact Q05 specification
  const defaultWhatsappMessage = `Assalamu Alaikum ${document.client_name || "Valued Guest"},

Please find your personalised Masaar Holidays quotation.

Quotation: ${document.document_number}
Journey: ${journeyLabel}
Travel dates: ${travelDatesFormatted}
Travellers: ${travellerSummary}
Total: ${totalString}

You can review your quotation and respond here:
${publicUrl}

For any changes or questions, please reply to this message.

JazakAllahu Khairan,
Masaar Holidays`;

  const [editableMessage, setEditableMessage] = useState(defaultWhatsappMessage);

  if (!isOpen) return null;

  async function handleCopyLink() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const textarea = window.document.createElement("textarea");
        textarea.value = publicUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        window.document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        window.document.execCommand("copy");
        window.document.body.removeChild(textarea);
      }
    } catch {
      // fallback
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  }

  async function handleCopyMessage() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(editableMessage);
      } else {
        const textarea = window.document.createElement("textarea");
        textarea.value = editableMessage;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        window.document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        window.document.execCommand("copy");
        window.document.body.removeChild(textarea);
      }
    } catch {
      // fallback
    }
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  }

  let cleanDigits = clientPhone.replace(/\D/g, "");
  if (cleanDigits.startsWith("05") && cleanDigits.length === 10) {
    cleanDigits = "971" + cleanDigits.slice(1);
  }
  const whatsappHref = cleanDigits
    ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(editableMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(editableMessage)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F5] border border-[#c9983e]/30 text-sm font-bold text-[#865d1d]">
                🔗
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1A1816]">
                Share Quotation with Client
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#1A1816]/60">
              Send personalised quotation {document.document_number} directly to {document.client_name}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-black/40 hover:bg-black/5 hover:text-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Client details summary strip */}
        <div className="rounded-xl bg-[#FAF8F5] border border-[#c9983e]/30 p-3.5 text-xs grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-black/50 block">Client</span>
            <p className="font-semibold text-black truncate">{document.client_name}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-black/50 block">Duration</span>
            <p className="font-semibold text-[#865d1d]">{dateMetrics.durationLabel}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-black/50 block">Agreed Total</span>
            <p className="font-bold text-[#1A1816]">
              {totalAmount > 0 ? `AED ${totalAmount.toLocaleString()}` : "Price on Request"}
            </p>
          </div>
        </div>

        {/* SECTION 1: Client Quotation Link */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-black/60">
              Client Quotation Link
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-black/40">URL:</span>
              <button
                type="button"
                onClick={() => {
                  setUseProductionUrl(true);
                  setEditableMessage((prev) => prev.replace(localOrigin, prodOrigin));
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  useProductionUrl ? "bg-[#b37e28] text-white" : "bg-black/5 text-black/60"
                }`}
              >
                Production
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseProductionUrl(false);
                  setEditableMessage((prev) => prev.replace(prodOrigin, localOrigin));
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  !useProductionUrl ? "bg-[#b37e28] text-white" : "bg-black/5 text-black/60"
                }`}
              >
                Current
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 rounded-lg border border-black/15 bg-neutral-50 px-3 py-2 text-xs font-mono text-[#1A1816] select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap shadow-xs cursor-pointer ${
                copiedLink ? "bg-emerald-600 text-white" : "bg-[#b37e28] text-white hover:bg-[#916d28]"
              }`}
            >
              {copiedLink ? "✓ Copied!" : "📋 Copy Link"}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-black/5 transition-colors"
              title="Open customer quote in new tab"
            >
              ↗
            </a>
          </div>
        </div>

        {/* SECTION 2: WhatsApp Dispatch */}
        <div className="border-t border-black/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-black/60 flex items-center gap-1.5">
              <span className="text-[#25D366]">💬</span> Send via WhatsApp
            </label>
            <span className="text-[11px] text-black/40">Instant customer dispatch</span>
          </div>

          <div>
            <span className="text-[11px] text-black/60 font-medium">Client Phone / WhatsApp:</span>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="e.g. +971 55 227 6299"
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs text-[#1A1816] focus:border-[#b37e28] focus:outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-black/60 font-medium">Personalised Message Preview:</span>
              <button
                type="button"
                onClick={() => setEditableMessage(defaultWhatsappMessage)}
                className="text-[10px] text-[#865d1d] hover:underline"
              >
                Reset to Default
              </button>
            </div>
            <textarea
              rows={8}
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/15 p-3 text-xs text-[#1A1816] font-mono leading-relaxed bg-[#FAF9F6] focus:bg-white focus:border-[#b37e28] focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#20ba59] px-4 py-2.5 text-center text-xs font-bold text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💬</span>
              <span>Open in WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                copiedMessage
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold"
                  : "border-black/15 bg-white text-black hover:bg-black/5"
              }`}
            >
              {copiedMessage ? "✓ Copied Message!" : "📋 Copy Message"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 pt-3 flex items-center justify-between text-xs text-black/50">
          <span>Quote Status: <strong className="text-black capitalize">{document.status}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-4 py-1.5 font-medium hover:bg-black/5 text-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
