"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PageHeader, Card, PrimaryButton, SecondaryButton, Field, inputClass } from "@/components/admin/ui";
import { sendDocumentEmailAction } from "@/app/admin/(dashboard)/documents/actions";
import type { DocumentType } from "@/lib/types/database";

const VARIABLES = ["{{client_name}}", "{{document_number}}", "{{total_amount}}", "{{secure_link}}", "{{company_phone}}", "{{company_email}}"];

const TYPE_LABEL: Record<DocumentType, string> = {
  quotation: "Quotation",
  invoice: "Invoice",
  receipt: "Receipt",
  booking_voucher: "Booking Voucher",
};

function buildDefaultMessage(clientName: string, typeLabel: string, secureLink: string): string {
  return `Dear ${clientName},\n\nPlease find your ${typeLabel.toLowerCase()} details using the secure link below.\n\n${secureLink}\n\nIf you have any questions, please feel free to contact us. We are here to assist you.\n\nWarm regards,\nMasaar Holidays`;
}

function buildWhatsAppMessage(typeLabel: string, secureLink: string): string {
  return `Assalamu Alaikum, Your Masaar Holidays ${typeLabel.toLowerCase()} is ready. Please review it here: ${secureLink}. If you have any questions, please let us know. Masaar Holidays`;
}

/** Shared Send screen (Email / WhatsApp / Download PDF tabs) used by every document type's /[id]/send route. */
export function SendDocumentPanel({
  documentId,
  documentType,
  documentNumber,
  basePath,
  moduleLabel,
  clientName,
  clientEmail,
  totalAed,
  secureLink,
  whatsappPhone,
}: {
  documentId: string;
  documentType: DocumentType;
  documentNumber: string;
  basePath: string;
  moduleLabel: string;
  clientName: string;
  clientEmail: string | null;
  totalAed: number;
  secureLink: string;
  whatsappPhone: string;
}) {
  const typeLabel = TYPE_LABEL[documentType];
  const [tab, setTab] = useState<"email" | "whatsapp" | "download">("email");
  const [to, setTo] = useState(clientEmail ?? "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(`Your Masaar Holidays ${typeLabel} – ${documentNumber}`);
  const [message, setMessage] = useState(buildDefaultMessage(clientName, typeLabel, secureLink));
  const [includePdf, setIncludePdf] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSend() {
    setStatus(null);
    startTransition(async () => {
      try {
        await sendDocumentEmailAction(documentId, documentType, { to, cc, subject, message, includePdfAttachment: includePdf });
        setStatus({ type: "success", text: "Email sent successfully." });
      } catch (e) {
        setStatus({ type: "error", text: e instanceof Error ? e.message : "Failed to send email." });
      }
    });
  }

  function copyLink(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsappMessage = buildWhatsAppMessage(typeLabel, secureLink);
  const whatsappHref = `https://wa.me/${whatsappPhone.replace(/^\+/, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div>
      <PageHeader
        title={`Send ${typeLabel}`}
        description={`Share this ${typeLabel.toLowerCase()} with your client via email or WhatsApp.`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Documents", href: "/admin/documents" },
          { label: moduleLabel, href: basePath },
          { label: documentNumber, href: `${basePath}/${documentId}` },
          { label: "Send" },
        ]}
        actions={
          <Link href={`${basePath}/${documentId}`}>
            <SecondaryButton>← Back to {typeLabel}</SecondaryButton>
          </Link>
        }
      />

      <div className="mb-6 flex gap-2 border-b border-black/10">
        {(["email", "whatsapp", "download"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "border-admin-primary text-admin-primary" : "border-transparent text-masaar-black/50"
            }`}
          >
            {t === "download" ? "Download PDF" : t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {tab === "email" && (
            <Card>
              <h2 className="mb-4 font-semibold text-masaar-black">Email Details</h2>
              <div className="space-y-4">
                <Field label="To" required>
                  <input className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
                </Field>
                <Field label="CC (Optional)">
                  <input className={inputClass} value={cc} onChange={(e) => setCc(e.target.value)} />
                </Field>
                <Field label="Subject" required>
                  <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
                </Field>
                <Field label="Message" required>
                  <textarea rows={10} className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={includePdf} onChange={(e) => setIncludePdf(e.target.checked)} className="accent-admin-primary" />
                  Include PDF attachment
                </label>
                {status && <p className={`text-sm ${status.type === "success" ? "text-green-700" : "text-red-600"}`}>{status.text}</p>}
                <div className="flex gap-2">
                  <PrimaryButton onClick={handleSend} disabled={isPending || !to}>
                    {isPending ? "Sending…" : "Send Email"}
                  </PrimaryButton>
                </div>
              </div>
            </Card>
          )}

          {tab === "whatsapp" && (
            <Card>
              <h2 className="mb-4 font-semibold text-masaar-black">WhatsApp Message (Preview)</h2>
              <div className="rounded-lg bg-green-50 p-4 text-sm text-masaar-black/80">{whatsappMessage}</div>
              <div className="mt-4 flex gap-2">
                <SecondaryButton onClick={() => copyLink(whatsappMessage)}>{copied ? "Copied!" : "Copy Message"}</SecondaryButton>
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <PrimaryButton>Open in WhatsApp</PrimaryButton>
                </a>
              </div>
            </Card>
          )}

          {tab === "download" && (
            <Card>
              <h2 className="mb-4 font-semibold text-masaar-black">Download PDF</h2>
              <p className="mb-4 text-sm text-masaar-black/60">Download a branded PDF copy of this {typeLabel.toLowerCase()} to share manually.</p>
              <a href={`${basePath}/${documentId}/pdf/download`}>
                <PrimaryButton>Download PDF</PrimaryButton>
              </a>
            </Card>
          )}

          <Card>
            <h2 className="mb-2 font-semibold text-masaar-black">Secure {typeLabel} Link</h2>
            <div className="flex items-center gap-2">
              <input readOnly className={inputClass} value={secureLink} />
              <SecondaryButton onClick={() => copyLink(secureLink)}>{copied ? "Copied!" : "Copy"}</SecondaryButton>
            </div>
            <p className="mt-2 text-xs text-masaar-black/50">This is a secure link. Only the recipient can access this {typeLabel.toLowerCase()}.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-masaar-black">Available Variables</h2>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <code key={v} className="rounded bg-admin-surface px-2 py-1 text-xs">
                  {v}
                </code>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-masaar-black">Other Actions</h2>
            <div className="flex flex-col gap-2">
              <a href={`${basePath}/${documentId}/pdf/download`}>
                <SecondaryButton>Download PDF</SecondaryButton>
              </a>
              <Link href={`/admin/documents-preview/${documentId}`} target="_blank">
                <SecondaryButton>Print</SecondaryButton>
              </Link>
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <SecondaryButton>Share via WhatsApp</SecondaryButton>
              </a>
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-masaar-black/60">{typeLabel} Total</h2>
            <p className="text-2xl font-bold text-masaar-black">AED {totalAed.toLocaleString()}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
