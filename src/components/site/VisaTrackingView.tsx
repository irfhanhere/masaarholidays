"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/site/Container";
import { CONTACT } from "@/lib/contact";
import type {
  VisaApplicationRow,
  VisaApplicantRow,
  VisaApplicationDocumentRow,
  VisaPaymentRow,
} from "@/lib/types/database";

interface VisaTrackingViewProps {
  application: VisaApplicationRow;
  applicants: VisaApplicantRow[];
  documents: VisaApplicationDocumentRow[];
  payments: VisaPaymentRow[];
}

export function VisaTrackingView({
  application,
  applicants,
  documents,
  payments,
}: VisaTrackingViewProps) {
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  const tabbyParam = searchParams.get("tabby");
  const paymentIdParam = searchParams.get("payment_id");

  const [paymentStatus, setPaymentStatus] = useState<string>(application.payment_status);
  const [verifyingTabby, setVerifyingTabby] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const formatDocTypeName = (type: string): string => {
    const t = (type || "").toLowerCase();
    if (t.includes("passport") && !t.includes("photo")) return "Passport Copy";
    if (t.includes("photo")) return "Passport Photograph";
    if (t.includes("emirates_id") || t.includes("eid")) return "Emirates ID";
    if (t.includes("residence")) return "UAE Residence Visa";
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleCustomerDocDownload = async (documentId: string, fileName: string) => {
    try {
      setDownloadingDocId(documentId);
      const res = await fetch(
        `/api/visa/customer-document?token=${encodeURIComponent(application.tracking_token)}&documentId=${encodeURIComponent(documentId)}`
      );
      const data = await res.json();
      if (!res.ok || !data.url) {
        alert(data.error || "Failed to retrieve secure document link.");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      alert("Failed to access document. Please try again or contact support.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  useEffect(() => {
    if (tabbyParam === "1" && paymentIdParam && paymentStatus !== "paid") {
      setVerifyingTabby(true);
      fetch("/api/tabby/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentIdParam,
          trackingToken: application.tracking_token,
          token: application.tracking_token,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "paid") {
            setPaymentStatus("paid");
          } else if (data.status) {
            setPaymentStatus(data.status);
          }
          if (data.error && data.status !== "paid") {
            setVerificationError(data.error);
          }
        })
        .catch((err) => {
          setVerificationError(err instanceof Error ? err.message : "Tabby verification error");
        })
        .finally(() => {
          setVerifyingTabby(false);
        });
    }
  }, [tabbyParam, paymentIdParam, paymentStatus, application.tracking_token]);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(application.reference_no);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPaid = paymentStatus === "paid";
  const dateFormatted = new Date(application.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Timeline steps
  const timelineSteps = [
    {
      key: "payment_received",
      title: "Payment Received",
      desc: isPaid ? "Your payment has been successfully verified." : "Payment pending verification.",
      status: isPaid ? "completed" : "pending",
    },
    {
      key: "application_under_review",
      title: "Application Under Review",
      desc: "Our team is reviewing your details and uploaded documents.",
      status: isPaid ? "in_progress" : "pending",
    },
    {
      key: "submitted_to_authorities",
      title: "Submitted to Authorities",
      desc: "Your application will be submitted to the destination immigration department.",
      status: "pending",
    },
    {
      key: "visa_approval",
      title: "Visa Decision & Approval",
      desc: "Once decided by the authorities, you will be notified immediately.",
      status: "pending",
    },
    {
      key: "visa_delivered",
      title: "Visa Delivered",
      desc: "You will receive your official electronic visa and travel instructions via email and WhatsApp.",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-warm-ivory/30 pb-24 text-masaar-black">
      {/* Top Breadcrumb */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
        <Container>
          <div className="flex items-center gap-2 text-xs text-masaar-black/60">
            <Link href="/" className="hover:text-masaar-black">Home</Link>
            <span>›</span>
            <Link href="/visa" className="hover:text-masaar-black">Visa</Link>
            <span>›</span>
            <span className="font-medium text-masaar-black">Confirmation & Tracking</span>
          </div>
        </Container>
      </div>

      {/* Header Banner */}
      <section className="relative overflow-hidden bg-masaar-black py-12 text-white sm:py-16">
        <Container className="relative z-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
            — {application.visa_type_slug.toUpperCase()} VISA APPLICATION —
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl lg:text-5xl">
            Application Submitted Successfully
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs text-white/70 sm:text-sm">
            Thank you for choosing Masaar Holidays. Your visa application has been received and is now being processed by our team.
          </p>
        </Container>
      </section>

      {/* Main Container */}
      <Container className="mt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Tabby Verification Feedback */}
            {verifyingTabby && (
              <div className="flex items-center gap-3 rounded-xl border border-[#3EEDB4]/50 bg-[#3EEDB4]/10 p-4 text-xs text-masaar-black">
                <div className="size-4 animate-spin rounded-full border-2 border-masaar-black border-t-transparent" />
                <span className="font-medium">
                  Verifying your Tabby payment with the bank... Please wait a moment.
                </span>
              </div>
            )}

            {verificationError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <p className="font-semibold">Payment Verification Alert:</p>
                <p className="mt-0.5">{verificationError}</p>
              </div>
            )}

            {/* 1. Status Callout Header Card */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {isPaid ? "Payment Verified" : "Payment Pending"}
                    </span>
                    <h2 className="mt-1 font-semibold text-masaar-black text-base sm:text-lg">
                      Your Application Has Been Submitted
                    </h2>
                    <p className="mt-1 text-xs text-masaar-black/60">
                      Your details and documents are now under review by our visa specialists.
                    </p>
                  </div>
                </div>

                {/* Reference Number Box */}
                <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-4 text-center sm:text-right">
                  <p className="text-[11px] font-medium text-masaar-black/60">Application Reference</p>
                  <div className="mt-1 flex items-center justify-center gap-2 sm:justify-end">
                    <span className="font-mono text-sm font-bold tracking-wider text-masaar-black sm:text-base">
                      {application.reference_no}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      title="Copy Reference Number"
                      className="rounded p-1 text-masaar-black/60 hover:bg-black/5 hover:text-masaar-black"
                    >
                      {copied ? (
                        <span className="text-[10px] font-semibold text-emerald-600">Copied!</span>
                      ) : (
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-masaar-black/50">
                    Keep this reference for your records.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Vertical Timeline: Application Progress */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="border-b border-black/5 pb-4">
                <h3 className="font-semibold text-masaar-black text-sm sm:text-base">Application Progress</h3>
                <p className="text-xs text-masaar-black/60">
                  Track the progress of your visa in real time. We will notify you at each milestone.
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {timelineSteps.map((step, idx) => (
                  <div key={step.key} className="relative flex items-start gap-4">
                    {/* Connecting line */}
                    {idx < timelineSteps.length - 1 && (
                      <span
                        className={`absolute left-4 top-8 -bottom-6 w-0.5 ${
                          step.status === "completed" ? "bg-emerald-500" : "bg-black/10"
                        }`}
                      />
                    )}

                    {/* Step Icon */}
                    <span
                      className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.status === "completed"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : step.status === "in_progress"
                          ? "bg-pure-gold text-masaar-black ring-4 ring-pure-gold/20"
                          : "bg-black/10 text-masaar-black/40"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </span>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold text-masaar-black text-xs sm:text-sm">{step.title}</h4>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            step.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : step.status === "in_progress"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-black/5 text-masaar-black/50"
                          }`}
                        >
                          {step.status === "completed"
                            ? "Completed"
                            : step.status === "in_progress"
                            ? "In Progress"
                            : "Pending"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-masaar-black/60">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Customer Uploaded Documents Section */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="border-b border-black/5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-masaar-black text-sm sm:text-base">
                      Uploaded Documents & Verification
                    </h3>
                    <p className="text-xs text-masaar-black/60">
                      View the verification status of your uploaded identity documents and files.
                    </p>
                  </div>
                  <span className="rounded bg-warm-ivory px-2.5 py-1 text-xs font-semibold text-deep-gold">
                    {documents.length} File{documents.length === 1 ? "" : "s"} Attached
                  </span>
                </div>
              </div>

              {application.application_status === "documents_required" && (
                <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base">⚠️</span>
                    <div>
                      <p className="font-bold">Additional Documents Required</p>
                      <p className="mt-1 text-amber-800">
                        Our visa verification team requires additional or updated documents to proceed with immigration submission.
                        Please check the notes below or send high-resolution copies via WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {documents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-black/15 bg-warm-ivory/20 p-6 text-center text-xs text-masaar-black/60">
                    <p className="font-medium text-masaar-black">No uploaded documents on record</p>
                    <p className="mt-1 text-[11px]">
                      If you applied through an enquiry or need to submit documents, please share them with our team on WhatsApp.
                    </p>
                  </div>
                ) : (
                  documents.map((doc) => {
                    const applicant = applicants.find((a) => a.id === doc.applicant_id);
                    const isVerified = doc.verification_status === "verified";
                    const isRejected = doc.verification_status === "rejected";

                    return (
                      <div
                        key={doc.id}
                        className={`rounded-lg border p-4 transition-all ${
                          isRejected
                            ? "border-red-200 bg-red-50/30"
                            : isVerified
                            ? "border-emerald-200 bg-emerald-50/20"
                            : "border-black/10 bg-warm-ivory/20"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                                isVerified
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isRejected
                                  ? "bg-red-100 text-red-700"
                                  : "bg-pure-gold/20 text-deep-gold"
                              }`}
                            >
                              📄
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-masaar-black text-xs sm:text-sm">
                                  {formatDocTypeName(doc.document_type)}
                                </h4>
                                {applicant && (
                                  <span className="rounded bg-black/5 px-2 py-0.5 text-[10px] font-medium text-masaar-black/70">
                                    {applicant.full_name}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-[11px] text-masaar-black/60 font-mono">
                                {doc.file_name} {doc.file_size ? `· ${(doc.file_size / 1024).toFixed(0)} KB` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span
                              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                isVerified
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isRejected
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isVerified ? "✓ Verified" : isRejected ? "⚠️ Action Required" : "⏳ Under Review"}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCustomerDocDownload(doc.id, doc.file_name)}
                              disabled={downloadingDocId === doc.id}
                              className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-masaar-black shadow-sm transition hover:bg-black/5 disabled:opacity-50"
                            >
                              {downloadingDocId === doc.id ? (
                                <>
                                  <span className="size-3 animate-spin rounded-full border border-masaar-black border-t-transparent" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {isRejected && doc.rejection_reason && (
                          <div className="mt-3 rounded border border-red-200 bg-red-100/60 p-2.5 text-xs text-red-800">
                            <span className="font-semibold">Reviewer Note: </span>
                            {doc.rejection_reason}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. What Happens Next? (4 cards) */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="font-semibold text-masaar-black text-sm sm:text-base">What Happens Next?</h3>
              <p className="text-xs text-masaar-black/60">Here is the procedure following your submission.</p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-black/5 bg-warm-ivory/30 p-4">
                  <span className="flex size-8 items-center justify-center rounded-md bg-pure-gold/20 text-xs font-bold text-deep-gold">
                    1
                  </span>
                  <h4 className="mt-3 font-semibold text-masaar-black text-xs">Review & Verification</h4>
                  <p className="mt-1 text-[11px] text-masaar-black/60">Our specialists verify all submitted documents and passport validity.</p>
                </div>

                <div className="rounded-lg border border-black/5 bg-warm-ivory/30 p-4">
                  <span className="flex size-8 items-center justify-center rounded-md bg-pure-gold/20 text-xs font-bold text-deep-gold">
                    2
                  </span>
                  <h4 className="mt-3 font-semibold text-masaar-black text-xs">Authority Submission</h4>
                  <p className="mt-1 text-[11px] text-masaar-black/60">The application is submitted to destination immigration authorities.</p>
                </div>

                <div className="rounded-lg border border-black/5 bg-warm-ivory/30 p-4">
                  <span className="flex size-8 items-center justify-center rounded-md bg-pure-gold/20 text-xs font-bold text-deep-gold">
                    3
                  </span>
                  <h4 className="mt-3 font-semibold text-masaar-black text-xs">Decision & Issue</h4>
                  <p className="mt-1 text-[11px] text-masaar-black/60">Government processing and approval decision is confirmed.</p>
                </div>

                <div className="rounded-lg border border-black/5 bg-warm-ivory/30 p-4">
                  <span className="flex size-8 items-center justify-center rounded-md bg-pure-gold/20 text-xs font-bold text-deep-gold">
                    4
                  </span>
                  <h4 className="mt-3 font-semibold text-masaar-black text-xs">Electronic Delivery</h4>
                  <p className="mt-1 text-[11px] text-masaar-black/60">Your e-visa and instructions are sent directly to your email & WhatsApp.</p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <Link
                href="/visa"
                className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-5 py-3 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                ← Back to Visa Services
              </Link>
              <a
                href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                  `Hello Masaar Holidays, I am following up on my visa application reference ${application.reference_no}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-3 text-xs font-semibold text-masaar-black shadow hover:bg-light-gold"
              >
                Ask a Question on WhatsApp
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: APPLICATION DETAILS & HELP */}
          <div className="space-y-6">
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="border-b border-black/5 pb-3 font-semibold text-masaar-black text-sm">
                Application Details
              </h3>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <p className="text-[11px] text-masaar-black/60">Service & Package</p>
                  <p className="font-semibold text-masaar-black">{application.product_title}</p>
                </div>

                <div>
                  <p className="text-[11px] text-masaar-black/60">Travellers</p>
                  <p className="font-semibold text-masaar-black">
                    {application.applicant_count} Traveller{application.applicant_count > 1 ? "s" : ""}: {application.primary_contact_name}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-masaar-black/60">Payment Status</p>
                  <span className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {paymentStatus}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] text-masaar-black/60">Payment Gateway</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {application.payment_gateway === "tabby" ? (
                      <span className="inline-flex items-center gap-1.5 rounded bg-[#3EEDB4]/20 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                        <span className="rounded bg-[#3EEDB4] px-1.5 py-0.2 text-[9px] font-black text-black">tabby</span>
                        Tabby (Split in 4)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        Card (Stripe Checkout)
                      </span>
                    )}
                  </div>
                </div>

                {application.payment_gateway === "tabby" && application.charged_currency && application.charged_amount && (
                  <div>
                    <p className="text-[11px] text-masaar-black/60">Tabby Charged Amount</p>
                    <p className="font-semibold text-masaar-black">
                      {application.charged_currency} {application.charged_amount}
                    </p>
                  </div>
                )}

                {(application.tabby_payment_id || application.stripe_payment_intent_id) && (
                  <div>
                    <p className="text-[11px] text-masaar-black/60">Transaction Reference</p>
                    <p className="font-mono text-[11px] text-masaar-black break-all">
                      {application.tabby_payment_id || application.stripe_payment_intent_id}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] text-masaar-black/60">Submitted Date</p>
                  <p className="font-medium text-masaar-black">{dateFormatted}</p>
                </div>

                <div className="border-t border-black/5 pt-3">
                  <p className="text-[11px] text-masaar-black/60">Total Amount</p>
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-deep-gold">
                    {application.currency} {application.total_amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Need Help Assistance Card */}
            <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-warm-ivory text-deep-gold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              <h4 className="mt-3 font-semibold text-masaar-black text-sm">Need Help?</h4>
              <p className="mt-1 text-xs text-masaar-black/60">
                Our visa team is available to assist you with any questions about your application.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                    `Hello Masaar Holidays, I have a question regarding application ${application.reference_no}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-pure-gold py-2.5 text-xs font-semibold text-masaar-black hover:bg-light-gold"
                >
                  Chat on WhatsApp
                </a>
                <a
                  href={`tel:+${CONTACT.whatsappPhoneIntl}`}
                  className="rounded-md border border-black/15 bg-white py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5"
                >
                  Call {CONTACT.phoneDisplay}
                </a>
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-4 text-xs text-masaar-black/75">
              <p className="font-semibold text-deep-gold">Important Information:</p>
              <ul className="mt-2 space-y-1 text-[11px] text-masaar-black/70">
                <li>• Processing times may vary depending on national holidays and immigration loads.</li>
                <li>• We will notify you if any additional documents are requested.</li>
                <li>• Final approval rests solely with destination immigration authorities.</li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
