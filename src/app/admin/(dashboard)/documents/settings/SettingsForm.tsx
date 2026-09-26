"use client";

import { useState, useTransition } from "react";
import { Card, Field, inputClass, PrimaryButton } from "@/components/admin/ui";
import { updateDocumentPdfSettings } from "../actions";
import type { DocumentSettingsRow, DocumentTemplateRow } from "@/lib/types/database";

interface SettingsFormProps {
  settings: DocumentSettingsRow;
  templates: {
    quotation: DocumentTemplateRow | null;
    invoice: DocumentTemplateRow | null;
    receipt: DocumentTemplateRow | null;
    booking_voucher: DocumentTemplateRow | null;
  };
}

export function SettingsForm({ settings, templates }: SettingsFormProps) {
  // 1. Prefixes
  const [prefixes, setPrefixes] = useState({
    quotation_prefix: settings.quotation_prefix || "Q-",
    invoice_prefix: settings.invoice_prefix || "INV-",
    receipt_prefix: settings.receipt_prefix || "REC-",
    booking_voucher_prefix: settings.booking_voucher_prefix || "BV-",
  });

  // 2. Terms & Conditions
  const [terms, setTerms] = useState({
    quotation:
      templates.quotation?.terms_text ||
      "All package rates and hotel rooms are subject to real-time availability until confirmed with a deposit payment. Package prices include all taxes and local service charges. Visas issued are strictly non-refundable and subject to Kingdom of Saudi Arabia Ministry of Hajj & Umrah guidelines. Flight schedule adjustments or airline re-routings are beyond agency control and will follow airline carrier policies.",
    invoice:
      templates.invoice?.terms_text ||
      "Payment is strictly due by the stated due date. Non-payment by the due date may lead to automatic cancellation of unconfirmed hotel and transfer segments. All international bank transfers must cover intermediary bank charges. Receipts are generated automatically upon verification of funds in Masaar's UAE bank accounts.",
    booking_voucher:
      templates.booking_voucher?.terms_text ||
      "Please present this voucher along with valid original passports during hotel check-in and private vehicle pickup. Standard check-in time across Makkah & Madinah hotels is 16:00, and check-out is 12:00 noon. For any urgent on-ground concierge or chauffeur assistance, contact our 24/7 Operations Desk at +971 55 732 9320.",
    receipt:
      templates.receipt?.terms_text ||
      "This official electronic receipt confirms payment received by Masaar Holidays. All services booked against this payment are non-refundable and subject to individual provider cancellation rules.",
  });

  // 3. Company Details
  const defaultComp = templates.invoice || templates.quotation;
  const [company, setCompany] = useState({
    phone: defaultComp?.company_phone || "971557329320",
    email: defaultComp?.company_email || "care@masaarholidays.com",
    website: defaultComp?.company_website || "www.masaarholidays.com",
    address: defaultComp?.company_address || "Al Zahia, Sharjah, United Arab Emirates",
  });

  // 4. Bank Details
  const defaultBank = templates.invoice || templates.receipt;
  const [bank, setBank] = useState({
    name: defaultBank?.bank_name || "Emirates NBD",
    account_name: defaultBank?.bank_account_name || "Masaar Travel & Tourism L.L.C",
    account_number: defaultBank?.bank_account_number || "123 456 789 012",
    iban: defaultBank?.bank_iban || "AE12 0260 0012 3456 7890 123",
    swift_code: defaultBank?.bank_swift_code || "EBILAEAD",
  });

  // 5. Notes & Signatory
  const [notes, setNotes] = useState({
    blessing_note:
      defaultBank?.blessing_note ||
      "May your journey be accepted and filled with ease. JazakAllahu Khairan",
    signature_name: defaultComp?.signature_name || "Masaar Holidays Authority",
    signature_title: defaultComp?.signature_title || "Authorized Operations & Travel Director",
  });

  const [activeTab, setActiveTab] = useState<"terms" | "numbering" | "company" | "bank" | "notes">("terms");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSaveAll() {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateDocumentPdfSettings({
        prefixes,
        terms,
        company,
        bank,
        notes,
      });

      if (res && !res.success) {
        setErrorMessage(res.error || "Failed to update settings.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Tabs & Save */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/10 pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "terms", label: "📜 Terms & Conditions", badge: "PDF" },
            { id: "numbering", label: "🔢 Document Numbering" },
            { id: "company", label: "🏢 Company Info" },
            { id: "bank", label: "💳 Bank & Payment", badge: "Invoices" },
            { id: "notes", label: "✨ Notes & Signatures" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-pure-gold text-white shadow-xs"
                  : "bg-white text-masaar-black/70 border border-black/10 hover:bg-black/5"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-black/10 text-masaar-black/60"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3 shrink-0">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-bold text-green-700 animate-in fade-in duration-200">
              <span>✓</span> Saved successfully
            </span>
          )}
          {errorMessage && (
            <span className="text-xs font-semibold text-red-600">
              {errorMessage}
            </span>
          )}
          <PrimaryButton onClick={handleSaveAll} disabled={isPending}>
            {isPending ? "Saving Settings…" : "💾 Save All Settings"}
          </PrimaryButton>
        </div>
      </div>

      {/* ── TAB 1: TERMS & CONDITIONS (PDF) ── */}
      {activeTab === "terms" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quotation Terms */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-masaar-black flex items-center gap-2">
                  <span>📄</span> Quotation Terms &amp; Conditions
                </h3>
                <p className="text-xs text-masaar-black/50">
                  Appears on the Terms &amp; Conditions page of Quotation PDFs &amp; Client Portal.
                </p>
              </div>
              <span className="rounded bg-pure-gold/15 px-2 py-0.5 text-[10px] font-bold text-admin-primary uppercase">
                Quotation PDF
              </span>
            </div>
            <textarea
              rows={7}
              className={inputClass + " font-sans text-xs leading-relaxed"}
              value={terms.quotation}
              onChange={(e) => setTerms({ ...terms, quotation: e.target.value })}
              placeholder="Enter default quotation terms & conditions..."
            />
            <p className="mt-2 text-[11px] text-masaar-black/50">
              Covers package cancellation, flight policy, room availability, and visa conditions.
            </p>
          </Card>

          {/* Invoice Terms */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-masaar-black flex items-center gap-2">
                  <span>🧾</span> Invoice Terms &amp; Policies
                </h3>
                <p className="text-xs text-masaar-black/50">
                  Appears at the bottom of all Invoice PDFs and payment schedules.
                </p>
              </div>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
                Invoice PDF
              </span>
            </div>
            <textarea
              rows={7}
              className={inputClass + " font-sans text-xs leading-relaxed"}
              value={terms.invoice}
              onChange={(e) => setTerms({ ...terms, invoice: e.target.value })}
              placeholder="Enter default invoice payment terms..."
            />
            <p className="mt-2 text-[11px] text-masaar-black/50">
              Covers payment deadlines, bank charges, and consequences of late settlement.
            </p>
          </Card>

          {/* Booking Voucher Terms */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-masaar-black flex items-center gap-2">
                  <span>🎫</span> Booking Voucher Terms &amp; Instructions
                </h3>
                <p className="text-xs text-masaar-black/50">
                  Included on passenger booking vouchers, hotel check-in confirmations, and transfer vouchers.
                </p>
              </div>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                Voucher PDF
              </span>
            </div>
            <textarea
              rows={7}
              className={inputClass + " font-sans text-xs leading-relaxed"}
              value={terms.booking_voucher}
              onChange={(e) => setTerms({ ...terms, booking_voucher: e.target.value })}
              placeholder="Enter default booking voucher instructions & rules..."
            />
            <p className="mt-2 text-[11px] text-masaar-black/50">
              Covers check-in procedures, passport presentation, and emergency contact numbers.
            </p>
          </Card>

          {/* Receipt Terms */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-masaar-black flex items-center gap-2">
                  <span>💳</span> Payment Receipt Acknowledgement
                </h3>
                <p className="text-xs text-masaar-black/50">
                  Printed on the luxury payment receipt document given to passengers.
                </p>
              </div>
              <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 uppercase">
                Receipt PDF
              </span>
            </div>
            <textarea
              rows={7}
              className={inputClass + " font-sans text-xs leading-relaxed"}
              value={terms.receipt}
              onChange={(e) => setTerms({ ...terms, receipt: e.target.value })}
              placeholder="Enter default receipt acknowledgement text..."
            />
            <p className="mt-2 text-[11px] text-masaar-black/50">
              Confirms payment receipt and non-refundable deposit clauses.
            </p>
          </Card>
        </div>
      )}

      {/* ── TAB 2: DOCUMENT NUMBERING ── */}
      {activeTab === "numbering" && (
        <Card className="max-w-2xl">
          <div className="mb-4">
            <h2 className="font-semibold text-masaar-black flex items-center gap-2">
              <span>🔢</span> Document Numbering Prefixes
            </h2>
            <p className="text-xs text-masaar-black/60">
              Configure standard numbering prefixes for all newly generated commercial documents.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quotation Prefix" hint='e.g. "Q-" → Q-2026-0042'>
              <input
                className={inputClass}
                value={prefixes.quotation_prefix}
                onChange={(e) => setPrefixes({ ...prefixes, quotation_prefix: e.target.value })}
              />
            </Field>
            <Field label="Invoice Prefix" hint='e.g. "INV-" → INV-2026-0018'>
              <input
                className={inputClass}
                value={prefixes.invoice_prefix}
                onChange={(e) => setPrefixes({ ...prefixes, invoice_prefix: e.target.value })}
              />
            </Field>
            <Field label="Receipt Prefix" hint='e.g. "REC-" → REC-2026-0012'>
              <input
                className={inputClass}
                value={prefixes.receipt_prefix}
                onChange={(e) => setPrefixes({ ...prefixes, receipt_prefix: e.target.value })}
              />
            </Field>
            <Field label="Booking Voucher Prefix" hint='e.g. "BV-" → BV-2026-0007'>
              <input
                className={inputClass}
                value={prefixes.booking_voucher_prefix}
                onChange={(e) => setPrefixes({ ...prefixes, booking_voucher_prefix: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50/70 p-3 border border-amber-200/60 text-xs text-amber-900">
            <p className="font-semibold">Format Structure:</p>
            <p className="mt-0.5 text-amber-800">
              Format is always <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{"<prefix><year>-<sequence>"}</code>. Changing a prefix only affects documents created after the update. Existing document records are never altered.
            </p>
          </div>
        </Card>
      )}

      {/* ── TAB 3: COMPANY & CONTACT (PDF) ── */}
      {activeTab === "company" && (
        <Card className="max-w-2xl">
          <div className="mb-4">
            <h2 className="font-semibold text-masaar-black flex items-center gap-2">
              <span>🏢</span> Official Company Information
            </h2>
            <p className="text-xs text-masaar-black/60">
              Displayed on headers and footers across all PDF exports, invoices, quotations, and vouchers.
            </p>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company Phone / WhatsApp" hint="e.g. +971 55 732 9320">
                <input
                  className={inputClass}
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                />
              </Field>
              <Field label="Support Email" hint="e.g. care@masaarholidays.com">
                <input
                  type="email"
                  className={inputClass}
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Official Website" hint="e.g. www.masaarholidays.com">
                <input
                  className={inputClass}
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                />
              </Field>
              <Field label="Physical Address" hint="e.g. Al Zahia, Sharjah, United Arab Emirates">
                <input
                  className={inputClass}
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* ── TAB 4: BANK & PAYMENT DETAILS ── */}
      {activeTab === "bank" && (
        <Card className="max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-masaar-black flex items-center gap-2">
                <span>💳</span> Official Bank &amp; Wire Payment Details
              </h2>
              <p className="text-xs text-masaar-black/60">
                Appears on the payment instructions block in Invoice &amp; Receipt PDFs.
              </p>
            </div>
            <span className="rounded bg-pure-gold/15 px-2.5 py-1 text-[11px] font-bold text-admin-primary">
              AED Currency
            </span>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bank Name" hint="e.g. Emirates NBD">
                <input
                  className={inputClass}
                  value={bank.name}
                  onChange={(e) => setBank({ ...bank, name: e.target.value })}
                />
              </Field>
              <Field label="Beneficiary Account Name" hint="e.g. Masaar Travel & Tourism L.L.C">
                <input
                  className={inputClass}
                  value={bank.account_name}
                  onChange={(e) => setBank({ ...bank, account_name: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account Number" hint="e.g. 123 456 789 012">
                <input
                  className={inputClass}
                  value={bank.account_number}
                  onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
                />
              </Field>
              <Field label="SWIFT / BIC Code" hint="e.g. EBILAEAD">
                <input
                  className={inputClass}
                  value={bank.swift_code}
                  onChange={(e) => setBank({ ...bank, swift_code: e.target.value })}
                />
              </Field>
            </div>
            <Field label="IBAN (International Bank Account Number)" hint="e.g. AE12 0260 0012 3456 7890 123">
              <input
                className={inputClass + " font-mono uppercase"}
                value={bank.iban}
                onChange={(e) => setBank({ ...bank, iban: e.target.value })}
              />
            </Field>
          </div>
        </Card>
      )}

      {/* ── TAB 5: NOTES & SIGNATURES ── */}
      {activeTab === "notes" && (
        <Card className="max-w-2xl">
          <div className="mb-4">
            <h2 className="font-semibold text-masaar-black flex items-center gap-2">
              <span>✨</span> Spiritual Blessings &amp; Authorized Signatures
            </h2>
            <p className="text-xs text-masaar-black/60">
              Adds signature sign-off and Islamic pilgrimage blessing notes on generated documents.
            </p>
          </div>
          <div className="space-y-4">
            <Field
              label="Spiritual Blessing Note"
              hint="Printed with gold dome icon on invoices and quotations"
            >
              <textarea
                rows={3}
                className={inputClass + " font-serif italic text-xs"}
                value={notes.blessing_note}
                onChange={(e) => setNotes({ ...notes, blessing_note: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Authorized Signatory Name" hint="e.g. Masaar Holidays Authority">
                <input
                  className={inputClass}
                  value={notes.signature_name}
                  onChange={(e) => setNotes({ ...notes, signature_name: e.target.value })}
                />
              </Field>
              <Field label="Signatory Title / Designation" hint="e.g. Authorized Operations Director">
                <input
                  className={inputClass}
                  value={notes.signature_title}
                  onChange={(e) => setNotes({ ...notes, signature_title: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Save Button Bar */}
      <div className="flex items-center justify-between border-t border-black/10 pt-4">
        <p className="text-xs text-masaar-black/50">
          Changes will apply to all newly generated PDFs, quotations, vouchers, and invoices.
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-bold text-green-700">
              ✓ All changes saved successfully!
            </span>
          )}
          <PrimaryButton onClick={handleSaveAll} disabled={isPending}>
            {isPending ? "Saving Settings…" : "Save All Settings"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
