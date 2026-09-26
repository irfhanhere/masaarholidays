"use client";

import { useState, useTransition } from "react";
import { PrimaryButton, SecondaryButton, GoldButton, Badge } from "@/components/admin/ui";
import { respondToQuotation } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Awaiting Your Review",
  viewed: "Awaiting Your Review",
  revision_requested: "Changes Requested",
  revised: "Revised",
  accepted: "Accepted",
  rejected: "Declined",
  expired: "Expired",
};

const CHANGE_OPTIONS = [
  "Hotel",
  "Room type",
  "Vehicle",
  "Flight",
  "Number of nights",
  "Add service",
  "Remove service",
  "Other",
];

export function QuoteActions({
  token,
  status,
  documentType,
  documentNumber,
  totalAed,
  whatsappPhone,
}: {
  token: string;
  status: string;
  documentType: string;
  documentNumber: string;
  totalAed: number;
  whatsappPhone: string;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [changeMessage, setChangeMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const isQuotation = documentType === "quotation";

  function handleAccept() {
    startTransition(async () => {
      const next = await respondToQuotation(token, "accept");
      setCurrentStatus(next);
    });
  }

  function toggleChangeOption(opt: string) {
    setSelectedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  function handleSubmitChangeRequest(e: React.FormEvent) {
    e.preventDefault();
    if (selectedChanges.size === 0 && !changeMessage.trim()) {
      alert("Please select at least one change category or enter a message.");
      return;
    }

    startTransition(async () => {
      const next = await respondToQuotation(token, "request_changes", {
        categories: Array.from(selectedChanges),
        message: changeMessage.trim(),
      });
      setCurrentStatus(next);
      setIsRequestModalOpen(false);
      setRequestSent(true);
    });
  }

  const whatsappMessage = `Assalamu Alaikum, I'd like to ask about my ${isQuotation ? "quotation" : "invoice"} ${documentNumber}.`;
  const whatsappHref = `https://wa.me/${whatsappPhone.replace(/^\+/, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-masaar-black/50">Total Amount</p>
          <p className="text-2xl font-serif font-bold text-masaar-black">
            AED {totalAed.toLocaleString()}
          </p>
          {isQuotation && (
            <div className="mt-1">
              <Badge tone={currentStatus === "accepted" ? "green" : currentStatus === "revision_requested" ? "amber" : "gold"}>
                {STATUS_LABEL[currentStatus] ?? currentStatus}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isQuotation && currentStatus !== "accepted" && (
            <>
              <GoldButton onClick={handleAccept} disabled={isPending} className="font-semibold shadow-sm">
                ✓ Accept Quotation
              </GoldButton>
              <SecondaryButton
                onClick={() => setIsRequestModalOpen(true)}
                disabled={isPending}
                className="font-medium"
              >
                ✏️ Request Changes
              </SecondaryButton>
            </>
          )}

          <a href={`/quote/${token}/pdf`} download>
            <SecondaryButton>📥 Download PDF</SecondaryButton>
          </a>

          <a href={whatsappHref} target="_blank" rel="noreferrer">
            <PrimaryButton>💬 Ask on WhatsApp</PrimaryButton>
          </a>
        </div>
      </div>

      {requestSent && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50/80 p-4 text-sm text-green-800 flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-green-600 text-white font-bold text-xs">
            ✓
          </span>
          <div>
            <p className="font-semibold">Your change request has been sent!</p>
            <p className="text-xs text-green-700">
              Our team will review your requested modifications and update your quotation shortly.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Request Changes Modal (matching EDITING QUOTATION.png Step 3) */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-masaar-black">
                  Request Changes
                </h3>
                <p className="text-xs text-masaar-black/50">{documentNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-masaar-black/40 hover:text-masaar-black text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 leading-relaxed">
              ℹ️ Let us know what you would like to change. Our team will review your request and send you a revised quotation.
            </div>

            <form onSubmit={handleSubmitChangeRequest} className="mt-4 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-masaar-black mb-2">
                  What would you like to change?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CHANGE_OPTIONS.map((opt) => {
                    const isChecked = selectedChanges.has(opt);
                    return (
                      <label
                        key={opt}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                          isChecked
                            ? "border-admin-primary bg-light-gold/15 font-semibold text-admin-primary"
                            : "border-black/10 hover:bg-black/[0.02] text-masaar-black/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChangeOption(opt)}
                          className="rounded border-black/20 text-admin-primary focus:ring-admin-primary"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-masaar-black">
                    Additional message (optional)
                  </span>
                  <span className="text-[10px] text-masaar-black/40">
                    {changeMessage.length}/500
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={changeMessage}
                  onChange={(e) => setChangeMessage(e.target.value)}
                  placeholder="e.g. I would prefer a hotel closer to Haram. Also, please check if a room with Kaaba view is available."
                  className="w-full rounded-lg border border-black/15 p-3 text-xs text-masaar-black focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-black/10 pt-4">
                <SecondaryButton
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Cancel
                </SecondaryButton>
                <GoldButton
                  type="submit"
                  disabled={isPending}
                  className="font-semibold"
                >
                  {isPending ? "Submitting…" : "Submit Change Request →"}
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
