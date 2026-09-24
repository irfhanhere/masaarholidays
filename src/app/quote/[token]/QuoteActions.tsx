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
  const isQuotation = documentType === "quotation";

  function respond(action: "accept" | "request_changes") {
    startTransition(async () => {
      const next = await respondToQuotation(token, action);
      setCurrentStatus(next);
    });
  }

  const whatsappMessage = `Assalamu Alaikum, I'd like to ask about my ${isQuotation ? "quotation" : "invoice"} ${documentNumber}.`;
  const whatsappHref = `https://wa.me/${whatsappPhone.replace(/^\+/, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-masaar-black/50">Total Amount</p>
        <p className="text-xl font-bold text-masaar-black">AED {totalAed.toLocaleString()}</p>
        {isQuotation && <Badge tone={currentStatus === "accepted" ? "green" : "gold"}>{STATUS_LABEL[currentStatus] ?? currentStatus}</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        {isQuotation && currentStatus !== "accepted" && (
          <>
            <GoldButton onClick={() => respond("accept")} disabled={isPending}>
              Accept Quotation
            </GoldButton>
            <SecondaryButton onClick={() => respond("request_changes")} disabled={isPending}>
              Request Changes
            </SecondaryButton>
          </>
        )}
        <a href={`/quote/${token}/pdf`}>
          <SecondaryButton>Download PDF</SecondaryButton>
        </a>
        <a href={whatsappHref} target="_blank" rel="noreferrer">
          <PrimaryButton>Ask on WhatsApp</PrimaryButton>
        </a>
      </div>
    </div>
  );
}
