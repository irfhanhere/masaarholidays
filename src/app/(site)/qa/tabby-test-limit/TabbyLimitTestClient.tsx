"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TabbyBadge, TabbyProductSnippet } from "@/components/site/TabbyLogo";

function TabbyLimitTestContent() {
  const searchParams = useSearchParams();
  const isCancelled = searchParams.get("cancelled") === "1";
  const isFailed = searchParams.get("failed") === "1";
  const isSuccess = searchParams.get("success") === "1";

  const [name, setName] = useState("Tabby QA Tester");
  const [email, setEmail] = useState("qa-limit-test@tabby.ai");
  const [phone, setPhone] = useState("+971500000001");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    status?: string;
    rejectionCode?: string;
    approvedMessage?: string;
    isTabbyRejection?: boolean;
    webUrl?: string;
    error?: string;
    raw?: any;
  } | null>(null);

  const handleTestCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/qa/tabby-test-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
        }),
      });

      const data = await res.json();
      setResult({
        ...data,
        raw: data,
      });
    } catch (err) {
      setResult({
        success: false,
        status: "error",
        error: err instanceof Error ? err.message : "Network error",
        approvedMessage:
          "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method.",
        isTabbyRejection: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Environment Alert Header */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                Tabby Sandbox Pre-Scoring &amp; Limit QA Verification
              </h3>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                This endpoint is exclusively restricted to the Tabby Sandbox environment. It creates a controlled test order of <strong>AED 25,000.00</strong> to verify Tabby pre-scoring credit rejection handling, error categorization, and approved fallback customer messaging without affecting production customer orders.
              </p>
            </div>
          </div>
        </div>

        {/* Redirect Notice Banners */}
        {isCancelled && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <div>
              <strong>Payment Cancelled:</strong> Your Tabby payment was cancelled. No charges were made.
            </div>
          </div>
        )}
        {isFailed && (
          <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <div>
              <strong>Payment Failed:</strong> Your Tabby payment could not be processed. Please choose an alternative payment method.
            </div>
          </div>
        )}
        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <div>
              <strong>Test Payment Completed:</strong> Tabby session completed in sandbox.
            </div>
          </div>
        )}

        {/* Product Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  QA Sandbox Stress Test Item
                </span>
                <h1 className="mt-2 text-2xl font-bold text-masaar-black">
                  High-Value Limit Test (AED 25,000.00)
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                  Target amount designed to test Tabby pre-scoring credit limit rejection response.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-masaar-black">
                  AED 25,000.00
                </div>
                <div className="mt-1">
                  <TabbyProductSnippet installmentAed="6,250.00" />
                </div>
              </div>
            </div>
          </div>

          {/* Test Form */}
          <form onSubmit={handleTestCreation} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Buyer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Buyer Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  UAE Phone (+971)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+971500000001"
                  className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TabbyBadge className="h-6 w-auto" />
                <div className="text-xs text-stone-600">
                  <div className="font-semibold text-masaar-black">Payment Gateway: Tabby Pay in 4</div>
                  <div>4 interest-free payments of AED 6,250.00 • No interest. No fees. Shariah-compliant.</div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? "Testing..." : "Test Tabby Session Creation (AED 25,000)"}
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Response Output */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-masaar-black flex items-center gap-2">
              <span>Diagnostic Result:</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                  result.status === "rejected"
                    ? "bg-amber-100 text-amber-800"
                    : result.status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {result.status}
              </span>
            </h2>

            {/* Approved Rejection Message Display */}
            {result.approvedMessage && (
              <div
                className={`p-4 rounded-lg border text-sm ${
                  result.status === "rejected"
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-stone-50 border-stone-300 text-stone-800"
                }`}
              >
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <span>Customer-Facing Message Displayed:</span>
                </div>
                <div className="italic text-base font-medium">
                  &ldquo;{result.approvedMessage}&rdquo;
                </div>
                {result.rejectionCode && (
                  <div className="mt-2 text-xs text-stone-600 font-mono">
                    Tabby Internal Code: <strong>{result.rejectionCode}</strong>
                  </div>
                )}
              </div>
            )}

            {/* If approved/webUrl provided */}
            {result.webUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
                <div className="font-semibold mb-1">Session Created:</div>
                <a
                  href={result.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline font-mono text-xs break-all"
                >
                  {result.webUrl}
                </a>
              </div>
            )}

            {/* Error detail */}
            {result.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-mono">
                {result.error}
              </div>
            )}

            {/* Raw JSON */}
            <div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Raw Diagnostic Payload:
              </div>
              <pre className="p-3 bg-stone-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
                {JSON.stringify(result.raw || result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tabby Integration Verification Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-3 text-xs text-stone-600">
          <h3 className="font-semibold text-masaar-black text-sm uppercase tracking-wide">
            Tabby QA Integration Checklist Reference
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
            <li>
              <strong>Pre-scoring limit verification:</strong> Tabby evaluates buyer eligibility and order amount limits server-side upon session creation.
            </li>
            <li>
              <strong>Approved rejection response:</strong> When Tabby returns rejection codes (`order_amount_too_high`, `order_amount_too_low`, or `not_available`), Masaar Holidays displays the exact official approved copy without exposing internal system details.
            </li>
            <li>
              <strong>Graceful checkout fallback:</strong> On rejection, Tabby is disabled for the session and the customer is seamlessly prompted to pay via Credit / Debit Card (Stripe). Form inputs and selections are preserved.
            </li>
            <li>
              <strong>UAE eligibility:</strong> Tabby is restricted to UAE (+971) phone numbers and AED currency.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TabbyLimitTestClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="text-sm text-stone-500">Loading QA Sandbox test...</div>
        </div>
      }
    >
      <TabbyLimitTestContent />
    </Suspense>
  );
}
