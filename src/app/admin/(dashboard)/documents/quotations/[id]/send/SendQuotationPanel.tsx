"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  GoldButton,
} from "@/components/admin/ui";
import { sendDocumentEmailAction } from "../../../actions";
import type { DocumentRow } from "@/lib/types/database";

export function SendQuotationPanel({
  document,
  shareToken,
  whatsappPhone,
}: {
  document: DocumentRow;
  shareToken: string;
  whatsappPhone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Email form fields
  const [toEmail, setToEmail] = useState(document.client_email || "");
  const [ccEmail, setCcEmail] = useState("");
  const [subject, setSubject] = useState(
    `Your Masaar Holidays Quotation — ${document.journey_type ? document.journey_type.toUpperCase() : "UMRAH"} (${document.document_number})`
  );
  const [includePdf, setIncludePdf] = useState(true);

  const secureLink = typeof window !== "undefined"
    ? `${window.location.origin}/quote/${shareToken}`
    : `https://masaarholidays.com/quote/${shareToken}`;

  const defaultMessage = `Dear ${document.client_name},

We are pleased to share your customised ${document.journey_type ?? "pilgrimage"} quotation with you.
Please review the details, hotel choices and inclusions using your secure link below:

${secureLink}

If you have any questions or would like to make changes, you can request modifications directly through the link or contact us anytime.

Warm regards,
Masaar Holidays Team`;

  const [message, setMessage] = useState(defaultMessage);

  // WhatsApp formatted message
  const whatsappText = `Assalamu Alaikum ${document.client_name},

Your customised Masaar Holidays quotation (${document.document_number}) is ready! 

Please review your travel plan, hotels and inclusions here:
${secureLink}

Total: AED ${Number(document.total_aed ?? 0).toLocaleString()}

Let us know if you would like any revisions or wish to proceed with your booking.`;

  const clientPhoneDigits = (document.client_phone ?? "").replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${clientPhoneDigits || whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`;

  function handleSendEmail() {
    if (!toEmail.trim()) {
      alert("Please provide a recipient email address.");
      return;
    }

    startTransition(async () => {
      try {
        await sendDocumentEmailAction(document.id, "quotation", {
          to: toEmail.trim(),
          cc: ccEmail.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          includePdfAttachment: includePdf,
        });

        setStatusMessage("Quotation email sent successfully!");
        router.refresh();
      } catch (err: any) {
        alert(err instanceof Error ? err.message : "Failed to send email.");
      }
    });
  }

  function handleCopyLink() {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(secureLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  }

  function handleCopyWhatsapp() {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(whatsappText);
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 3000);
    }
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
            <span className="font-semibold text-masaar-black">Send Quotation</span>
          </nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-masaar-black sm:text-3xl">
            Send Quotation
          </h1>
          <p className="mt-0.5 text-xs text-masaar-black/60">
            Share this quotation with your client via Email, WhatsApp or secure link.
          </p>
        </div>

        <Link href={`/admin/documents/quotations/${document.id}`}>
          <SecondaryButton type="button">
            ← Back to Quotation
          </SecondaryButton>
        </Link>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          ✓ {statusMessage}
        </div>
      )}

      {/* Main Grid: Email Form Left (2 Cols), Preview Right (1 Col) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Email Dispatch Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 border-b border-black/10 pb-3">
              <span className="text-base text-admin-primary">✉️</span>
              <h3 className="font-serif text-base font-bold text-masaar-black">
                Email Details
              </h3>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="To (Client Email)" required>
                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="client@example.com"
                    className={inputClass}
                  />
                </Field>
                <Field label="CC (Optional)">
                  <input
                    type="email"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="manager@masaarholidays.com"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Subject Line" required>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-masaar-black">Message Content</label>
                  <span className="text-[11px] text-masaar-black/50">Click variable to insert:</span>
                </div>
                {/* Variable Chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: "{{client_name}}", val: document.client_name || "Client" },
                    { label: "{{quotation_number}}", val: document.document_number },
                    { label: "{{package_name}}", val: document.journey_type ? `${document.journey_type.toUpperCase()} Package` : "Umrah Package" },
                    { label: "{{travel_dates}}", val: document.travel_date ? `${document.travel_date} - ${document.return_date || ""}` : "Dates pending" },
                    { label: "{{total_amount}}", val: `AED ${Number(document.total_aed ?? 0).toLocaleString()}` },
                    { label: "{{secure_link}}", val: secureLink },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setMessage((prev) => `${prev} ${chip.val}`)}
                      className="rounded-full border border-light-gold/60 bg-warm-ivory px-2.5 py-1 text-[10px] font-medium text-masaar-black shadow-2xs hover:bg-light-gold/20 hover:border-admin-primary transition-colors"
                      title={`Insert ${chip.val}`}
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputClass} leading-relaxed`}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-masaar-black">
                <input
                  type="checkbox"
                  checked={includePdf}
                  onChange={(e) => setIncludePdf(e.target.checked)}
                  className="rounded border-black/20 text-admin-primary focus:ring-admin-primary"
                />
                <span>Include PDF attachment ({document.document_number}.pdf)</span>
              </label>

              <div className="flex items-center justify-between border-t border-black/10 pt-4">
                <div className="flex gap-2">
                  <GoldButton
                    type="button"
                    onClick={handleSendEmail}
                    disabled={isPending}
                    className="py-2.5 px-6 font-semibold"
                  >
                    {isPending ? "Sending Email…" : "✉️ Send Email"}
                  </GoldButton>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Email Preview Card */}
        <div>
          <Card className="sticky top-6">
            <h3 className="font-serif text-base font-bold text-masaar-black border-b border-black/10 pb-2">
              Email Preview
            </h3>
            <p className="mt-1 text-[11px] text-masaar-black/50">
              Subject: <span className="font-semibold text-masaar-black">{subject}</span>
            </p>

            <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm text-xs space-y-3">
              <div className="rounded-lg bg-masaar-black p-3 text-white flex items-center justify-between">
                <span className="font-serif font-bold text-pure-gold">Masaar Holidays</span>
                <span className="text-[9px] tracking-widest text-pure-gold">FAITH • CLARITY</span>
              </div>

              <div className="whitespace-pre-line text-masaar-black/80 text-[11px] leading-relaxed">
                {message}
              </div>

              <div className="text-center pt-2">
                <a
                  href={secureLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-md bg-light-gold px-4 py-2 font-semibold text-masaar-black shadow-sm"
                >
                  View Quotation →
                </a>
              </div>

              <div className="border-t border-black/10 pt-2 text-center text-[10px] text-masaar-black/50">
                +971 55 227 6299 • care@masaarholidays.com • masaarholidays.com
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Row Cards: WhatsApp & Secure Link (matching EMAIL + WHATSAPP.png) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* WhatsApp Preview Card */}
        <Card>
          <div className="flex items-center gap-2 border-b border-black/10 pb-2">
            <span className="text-base text-green-600">💬</span>
            <h4 className="font-serif text-sm font-bold text-masaar-black">
              WhatsApp Message
            </h4>
          </div>

          <div className="mt-3 rounded-lg bg-emerald-50/70 border border-emerald-100 p-3 text-xs text-masaar-black/80 whitespace-pre-line font-sans">
            {whatsappText}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsapp}
              className="flex-1 rounded-md border border-black/15 bg-white py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
            >
              {copiedWhatsapp ? "✓ Copied" : "Copy Message"}
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-md bg-emerald-600 py-1.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Open WhatsApp →
            </a>
          </div>
        </Card>

        {/* Secure Link Card */}
        <Card>
          <div className="flex items-center gap-2 border-b border-black/10 pb-2">
            <span className="text-base text-admin-primary">🔗</span>
            <h4 className="font-serif text-sm font-bold text-masaar-black">
              Secure Quotation Link
            </h4>
          </div>

          <p className="mt-2 text-xs text-masaar-black/60">
            Send this encrypted link directly to the client. No login required.
          </p>

          <div className="mt-3 flex items-center rounded-lg border border-black/15 bg-warm-ivory/50 px-2 py-1.5 text-xs">
            <input
              readOnly
              value={secureLink}
              className="w-full bg-transparent text-masaar-black/80 font-mono text-[11px] outline-none"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 rounded-md bg-light-gold py-1.5 text-xs font-semibold text-masaar-black hover:bg-light-gold/80"
            >
              {copiedLink ? "✓ Link Copied!" : "Copy Link"}
            </button>

            <a
              href={secureLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-md border border-black/15 py-1.5 text-center text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
            >
              Open Link ↗
            </a>
          </div>
        </Card>

        {/* Other Quick Actions */}
        <Card>
          <div className="flex items-center gap-2 border-b border-black/10 pb-2">
            <span className="text-base text-admin-primary">⚡</span>
            <h4 className="font-serif text-sm font-bold text-masaar-black">
              Other Actions
            </h4>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <a
              href={`/quote/${shareToken}/pdf`}
              download
              className="flex w-full items-center justify-between rounded-md border border-black/10 p-2 text-masaar-black hover:bg-black/[0.02]"
            >
              <span>📥 Download PDF</span>
              <span>↓</span>
            </a>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex w-full items-center justify-between rounded-md border border-black/10 p-2 text-masaar-black hover:bg-black/[0.02]"
            >
              <span>🖨️ Print Quotation</span>
              <span>↗</span>
            </button>

            <Link
              href={`/admin/documents/quotations/${document.id}`}
              className="flex w-full items-center justify-between rounded-md border border-black/10 p-2 text-masaar-black hover:bg-black/[0.02]"
            >
              <span>✏️ Edit Sections &amp; Pricing</span>
              <span>→</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
