"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, FileText, Users, CreditCard, MessageCircle, ArrowRight, ShieldCheck } from "./saudi-visa-icons";
import type { VisaApplicationRow, VisaApplicantRow, VisaPaymentRow } from "@/lib/types/database";
import { trackMetaPixel } from "@/lib/analytics/meta-pixel";
import { DEFAULT_SAUDI_VISA_SETTINGS } from "@/lib/data/saudi-visa-settings";

interface Props {
  application: VisaApplicationRow;
  applicants: VisaApplicantRow[];
  payments: VisaPaymentRow[];
}

export function SaudiVisaConfirmationClient({ application, applicants, payments }: Props) {
  const breakdown = application.fee_breakdown as Record<string, unknown> | null;
  const isFamily = breakdown?.application_type === "family" || application.product_title?.includes("Family");
  const latestPayment = payments[0];
  const paymentRef = latestPayment?.transaction_reference || application.stripe_payment_intent_id || application.tabby_payment_id || "Confirmed";

  useEffect(() => {
    // Only fire after verified successful payment
    if (application.payment_status !== "paid") return;

    // Prevent duplicate Purchase events on page refresh
    const storageKey = `meta_purchase_${application.reference_no}`;
    if (typeof window !== "undefined" && window.sessionStorage) {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    }

    trackMetaPixel("Purchase", {
      content_name: "Saudi 1-Year Multiple Entry Tourist Visa",
      content_category: "Saudi Visa",
      value: application.total_amount,
      currency: application.currency || "AED",
      applicant_count: application.applicant_count,
      application_type: isFamily ? "family" : "individual",
    });
  }, [application.total_amount, application.currency, application.applicant_count, application.payment_status, application.reference_no, isFamily]);

  const whatsappMessage = encodeURIComponent(
    `Hello Masaar Holidays, I have submitted my Saudi Visa application (Reference: ${application.reference_no}) for ${application.applicant_count} applicant(s). Please confirm the review status.`
  );
  const cleanPhone = DEFAULT_SAUDI_VISA_SETTINGS.whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-warm-ivory/30 text-masaar-black flex flex-col font-sans">
      {/* Breadcrumbs */}
      <div className="bg-warm-ivory/60 border-b border-black/5 py-2.5">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs text-masaar-black/60">
            <Link href="/" className="hover:text-deep-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/visa" className="hover:text-deep-gold">Visa</Link>
            <span className="mx-2">/</span>
            <span className="text-masaar-black font-medium">Application Received</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gold/20 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-masaar-black via-[#161612] to-masaar-black p-8 text-white text-center border-b border-gold/30">
            <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center mx-auto mb-4 text-gold">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white mb-2">
              Your application has been received successfully.
            </h1>
            <p className="text-sm text-warm-ivory/80 max-w-lg mx-auto">
              Thank you for trusting Masaar Holidays. Our visa specialist team is now reviewing your application and documents.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-warm-ivory/40 p-4 rounded-xl border border-masaar-black/5">
                <span className="text-xs text-masaar-black/60 uppercase font-medium block">Application Ref</span>
                <span className="text-base font-bold text-masaar-black font-mono mt-1 block">
                  {application.reference_no}
                </span>
              </div>

              <div className="bg-warm-ivory/40 p-4 rounded-xl border border-masaar-black/5">
                <span className="text-xs text-masaar-black/60 uppercase font-medium block">Application Type</span>
                <span className="text-base font-semibold text-masaar-black mt-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gold" />
                  {isFamily ? "Family Application" : "Individual"}
                </span>
              </div>

              <div className="bg-warm-ivory/40 p-4 rounded-xl border border-masaar-black/5">
                <span className="text-xs text-masaar-black/60 uppercase font-medium block">Applicants</span>
                <span className="text-base font-bold text-masaar-black mt-1 block">
                  {application.applicant_count} Traveller{application.applicant_count > 1 ? "s" : ""}
                </span>
              </div>

              <div className="bg-warm-ivory/40 p-4 rounded-xl border border-masaar-black/5">
                <span className="text-xs text-masaar-black/60 uppercase font-medium block">Total Paid</span>
                <span className="text-base font-bold text-gold mt-1 block">
                  AED {application.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-warm-ivory/40 p-4 rounded-xl border border-masaar-black/5">
                <span className="text-xs text-masaar-black/60 uppercase font-medium block">Payment Status</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payment Received
                </span>
              </div>

              <div className="bg-warm-ivory/40 p-4 rounded-xl border border-masaar-black/5">
                <span className="text-xs text-masaar-black/60 uppercase font-medium block">Payment Reference</span>
                <span className="text-xs font-mono text-masaar-black/80 truncate mt-1 block" title={paymentRef}>
                  {paymentRef}
                </span>
              </div>
            </div>

            {/* Applicant Names */}
            {applicants.length > 0 && (
              <div className="bg-warm-ivory/20 rounded-xl p-5 border border-masaar-black/5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-masaar-black/80 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  Registered Applicants
                </h3>
                <div className="divide-y divide-masaar-black/10">
                  {applicants.map((a, idx) => (
                    <div key={a.id || idx} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-masaar-black">{a.full_name}</span>
                      </div>
                      <span className="text-xs text-masaar-black/60 font-mono">
                        Passport: {a.passport_number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What Happens Next */}
            <div className="border border-gold/30 bg-gold/5 rounded-xl p-6">
              <h3 className="text-base font-bold text-masaar-black flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-gold" />
                Next Steps for Your Visa
              </h3>
              <ol className="space-y-3 text-sm text-masaar-black/80 list-decimal list-inside">
                <li>
                  <strong className="text-masaar-black">Document & Eligibility Verification:</strong> Our processing specialists verify your passport and UAE residence details against official requirements.
                </li>
                <li>
                  <strong className="text-masaar-black">Immigration Submission:</strong> Once verified, your application is officially submitted to the Saudi visa authority.
                </li>
                <li>
                  <strong className="text-masaar-black">Electronic Issuance:</strong> Upon issuance (approximately 2 working days), your 1-Year Multiple Entry e-Visa will be emailed and sent via WhatsApp.
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-masaar-black/10">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Visa Team on WhatsApp
              </a>

              <Link
                href={`/visa/application/${application.tracking_token}`}
                className="flex-1 bg-masaar-black hover:bg-masaar-black/90 text-gold border border-gold/40 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                Track Live Application Status
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
