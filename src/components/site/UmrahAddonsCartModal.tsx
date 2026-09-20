"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AddonItem } from "./UmrahOptionalAddons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  addons: AddonItem[];
  /** The addon id whose "Add to Enquiry" button was clicked — pre-checked when the basket opens. */
  initialAddonId?: string;
}

const WHATSAPP_NUMBER = "971552276299";

export function UmrahAddonsCartModal({ isOpen, onClose, addons, initialAddonId }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [flightFrom, setFlightFrom] = useState("");
  const [flightTo, setFlightTo] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [notes, setNotes] = useState("");

  // Pre-check the addon that opened the basket — tracked as a render-time
  // adjustment (not an effect) since it only needs to react to isOpen's
  // false->true transition, comparing against its own previous value.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen && initialAddonId) {
      setSelectedIds((prev) => new Set(prev).add(initialAddonId));
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedAddons = addons.filter((a) => selectedIds.has(a.id));

  function buildMessage(): string {
    const lines = ["Assalamu Alaikum,", "", "I'd like to enquire about the following additional services:"];
    for (const addon of selectedAddons) {
      lines.push(`• ${addon.name}${addon.price_note ? ` (${addon.price_note})` : ""}`);
      if (addon.id === "flights" && (flightFrom || flightTo || flightDate)) {
        const parts: string[] = [];
        if (flightFrom) parts.push(`From: ${flightFrom}`);
        if (flightTo) parts.push(`To: ${flightTo}`);
        if (flightDate) parts.push(`Preferred date: ${flightDate}`);
        if (parts.length > 0) lines.push(`  (${parts.join(", ")})`);
      }
    }
    if (notes.trim()) {
      lines.push("", `Additional notes: ${notes.trim()}`);
    }
    lines.push("", "Please share more details.", "", "JazakAllah Khair.");
    return lines.join("\n");
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
  const hasSelection = selectedAddons.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="addons-cart-title"
        className="relative my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-black/5 text-masaar-black/70 transition-colors hover:bg-black/10 hover:text-masaar-black"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-black/10 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#A87F12]">— Your Enquiry Basket —</p>
            <h2 id="addons-cart-title" className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              Plan Your Additional Services
            </h2>
            <p className="mt-1 text-sm text-masaar-black/60">
              Select the services you&apos;re interested in and send your enquiry via WhatsApp.
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-warm-ivory p-4 sm:max-w-[220px]">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#A87F12]">
              <span aria-hidden="true">💼</span> Customise your journey
            </p>
            <p className="mt-1 text-xs leading-relaxed text-masaar-black/60">
              Add the services you need and get a personalised reply from our team.
            </p>
          </div>
        </div>

        {/* Service list */}
        <div className="max-h-[45vh] space-y-3 overflow-y-auto p-6 sm:p-8">
          {addons.map((addon) => {
            const isSelected = selectedIds.has(addon.id);
            return (
              <div
                key={addon.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isSelected ? "border-[#A87F12] bg-[#FAF5E8]" : "border-black/10 bg-white"
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(addon.id)}
                    className="mt-1 size-4 shrink-0 rounded border-black/20 text-[#A87F12] focus:ring-[#A87F12]"
                  />
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-warm-ivory">
                    <Image src={addon.image_url} alt={addon.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span aria-hidden="true">{addon.icon}</span>
                      <h4 className="text-sm font-bold text-masaar-black">{addon.name}</h4>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-masaar-black/60">{addon.short_description}</p>
                  </div>
                  {addon.id !== "flights" && (
                    <span className="shrink-0 whitespace-nowrap rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-masaar-black">
                      {addon.price_note}
                    </span>
                  )}
                </label>

                {addon.id === "flights" && isSelected && (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 pl-7 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-masaar-black/60">From</label>
                      <input
                        type="text"
                        value={flightFrom}
                        onChange={(e) => setFlightFrom(e.target.value)}
                        placeholder="Select city"
                        className="w-full rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-masaar-black focus:border-[#A87F12] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-masaar-black/60">To</label>
                      <input
                        type="text"
                        value={flightTo}
                        onChange={(e) => setFlightTo(e.target.value)}
                        placeholder="Select city"
                        className="w-full rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-masaar-black focus:border-[#A87F12] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-masaar-black/60">Preferred Date</label>
                      <input
                        type="date"
                        value={flightDate}
                        onChange={(e) => setFlightDate(e.target.value)}
                        className="w-full rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-masaar-black focus:border-[#A87F12] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes + Footer */}
        <div className="space-y-4 border-t border-black/10 p-6 sm:p-8">
          <div>
            <label className="mb-1 block text-xs font-semibold text-masaar-black">Additional Notes (Optional)</label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Let us know if you have any specific requests, preferred timings, or additional details…"
                className="w-full rounded-md border border-black/15 p-3 text-xs text-masaar-black focus:border-[#A87F12] focus:outline-none"
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-masaar-black/40">{notes.length}/500</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-xl bg-warm-ivory/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs text-masaar-black/70">
              <span aria-hidden="true">ℹ</span>
              <span>
                Availability and pricing are subject to confirmation. Our team will get in touch with you on
                WhatsApp with the best options based on your requirements.
              </span>
            </p>
            {hasSelection ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#A87F12] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#936e0f]"
              >
                <span aria-hidden="true">💬</span> Ask Now on WhatsApp →
              </a>
            ) : (
              <span className="shrink-0 whitespace-nowrap rounded-xl bg-black/10 px-6 py-3 text-sm font-bold text-masaar-black/40">
                Select a service first
              </span>
            )}
          </div>

          <p className="text-center text-[11px] text-masaar-black/50">🔒 No payment required. Just an enquiry.</p>
        </div>
      </div>
    </div>
  );
}
