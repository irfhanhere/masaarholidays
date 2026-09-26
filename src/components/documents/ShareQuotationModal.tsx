"use client";

import { useState } from "react";
import Link from "next/link";
import type { DocumentRow } from "@/lib/types/database";

export function ShareQuotationModal({
  isOpen,
  onClose,
  document,
  shareToken,
}: {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRow;
  shareToken: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [customPhone, setCustomPhone] = useState(document.client_phone || "");
  const [useProductionUrl, setUseProductionUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1");
    }
    return true;
  });

  if (!isOpen) return null;

  const prodOrigin = "https://masaarholidays.com";
  const localOrigin = typeof window !== "undefined" ? window.location.origin : prodOrigin;
  const activeOrigin = useProductionUrl ? prodOrigin : localOrigin;
  const publicUrl = `${activeOrigin}/quote/${shareToken}`;

  const defaultWhatsappMessage = `Assalamu Alaikum ${document.client_name},

Your personalised Masaar Holidays quotation (${document.document_number}) is ready!

Please review your travel plan, hotel accommodations, and inclusions here:
${publicUrl}

Total: AED ${Number(document.total_aed ?? 0).toLocaleString()}

If you would like any revisions or wish to proceed with your booking, feel free to let us know.

Warm regards,
Masaar Holidays`;

  const [whatsappText, setWhatsappText] = useState(defaultWhatsappMessage);

  async function handleCopyLink() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        throw new Error("fallback");
      }
    } catch {
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
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  }

  async function handleCopyMessage() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(whatsappText);
      } else {
        throw new Error("fallback");
      }
    } catch {
      const textarea = window.document.createElement("textarea");
      textarea.value = whatsappText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      window.document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      window.document.execCommand("copy");
      window.document.body.removeChild(textarea);
    }
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  }

  let cleanDigits = customPhone.replace(/\D/g, "");
  if (cleanDigits.startsWith("05") && cleanDigits.length === 10) {
    cleanDigits = "971" + cleanDigits.slice(1);
  }
  const whatsappHref = cleanDigits
    ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(whatsappText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-light-gold/30 text-admin-primary text-sm font-bold">
                🔗
              </span>
              <h3 className="font-serif text-lg font-bold text-masaar-black">
                Share Quotation with Passenger
              </h3>
            </div>
            <p className="mt-1 text-xs text-masaar-black/60">
              Send this quotation link directly to {document.client_name} ({document.document_number}).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Pax summary strip */}
        <div className="mt-4 rounded-xl bg-warm-ivory/80 border border-light-gold/40 p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-masaar-black/50">Passenger</span>
            <p className="font-semibold text-masaar-black">{document.client_name}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-masaar-black/50">Journey</span>
            <p className="font-semibold capitalize text-masaar-black">{document.journey_type ?? "Umrah"}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-masaar-black/50">Total Amount</span>
            <p className="font-bold text-admin-primary">AED {Number(document.total_aed ?? 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Domain Toggle for local vs production link */}
        <div className="mt-3 flex items-center justify-between text-[11px] bg-neutral-50 px-3 py-1.5 rounded-lg border border-black/5">
          <span className="text-black/60">Link Destination:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUseProductionUrl(true);
                setWhatsappText((prev) => prev.replace(localOrigin, prodOrigin));
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                useProductionUrl
                  ? "bg-[#b37e28] text-white shadow-2xs"
                  : "bg-white text-black/70 border border-black/10 hover:bg-black/5"
              }`}
            >
              Production (masaarholidays.com)
            </button>
            <button
              type="button"
              onClick={() => {
                setUseProductionUrl(false);
                setWhatsappText((prev) => prev.replace(prodOrigin, localOrigin));
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                !useProductionUrl
                  ? "bg-[#b37e28] text-white shadow-2xs"
                  : "bg-white text-black/70 border border-black/10 hover:bg-black/5"
              }`}
            >
              Current ({localOrigin.replace(/^https?:\/\//, "")})
            </button>
          </div>
        </div>

        {/* Section 1: Copy Link */}
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            Secure Client Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 rounded-lg border border-black/15 bg-neutral-50 px-3 py-2 text-xs font-mono text-masaar-black select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap shadow-xs cursor-pointer ${
                copiedLink
                  ? "bg-green-600 text-white"
                  : "bg-[#b37e28] text-white hover:bg-[#96681f]"
              }`}
            >
              {copiedLink ? "✓ Copied!" : "📋 Copy Link"}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.02] transition-colors"
              title="Open Client Portal in New Tab"
            >
              ↗
            </a>
          </div>
        </div>

        {/* Section 2: WhatsApp to Passenger */}
        <div className="mt-5 border-t border-black/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-masaar-black/60 flex items-center gap-1.5">
              <span className="text-green-600">💬</span> Send via WhatsApp
            </label>
            <span className="text-[11px] text-masaar-black/50">Instant dispatch to pax</span>
          </div>

          <div>
            <span className="text-[11px] text-masaar-black/60">Passenger Phone / WhatsApp:</span>
            <input
              type="tel"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="e.g. +971 55 227 6299"
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs text-masaar-black"
            />
          </div>

          <div>
            <span className="text-[11px] text-masaar-black/60">Personalised Message:</span>
            <textarea
              rows={4}
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-xs text-masaar-black font-sans leading-relaxed"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg bg-[#25D366] px-4 py-2.5 text-center text-xs font-bold text-white shadow-xs hover:bg-[#20ba59] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>💬</span> Send via WhatsApp
            </a>
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`rounded-lg border px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                copiedMessage
                  ? "border-green-600 bg-green-50 text-green-700 font-bold"
                  : "border-black/15 bg-white text-masaar-black hover:bg-black/[0.02]"
              }`}
            >
              {copiedMessage ? "✓ Copied Message!" : "📋 Copy Message"}
            </button>
          </div>
        </div>

        {/* Section 3: Extra actions */}
        <div className="mt-5 border-t border-black/10 pt-4 flex items-center justify-between">
          <Link
            href={`/admin/documents/quotations/${document.id}/send`}
            className="text-xs font-semibold text-admin-primary hover:underline"
            onClick={onClose}
          >
            ✉️ Advanced Email Dispatch →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-masaar-black hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
