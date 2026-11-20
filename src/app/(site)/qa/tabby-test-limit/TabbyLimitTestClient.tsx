"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TabbyBadge, TabbyProductSnippet } from "@/components/site/TabbyLogo";

function TabbyLimitTestContent() {
  const searchParams = useSearchParams();
  const isCancelled = searchParams.get("cancelled") === "1";
  const isFailed = searchParams.get("failed") === "1";
  const isSuccess = searchParams.get("success") === "1";
  const queryKey = searchParams.get("key") || searchParams.get("qa_key") || "";

  // QA Authentication State (Secrets are NEVER stored or hardcoded in frontend code)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [passkeyInput, setPasskeyInput] = useState<string>(queryKey);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Form State
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

  // Check initial authorization status on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuthStatus() {
      try {
        // If URL has query key, attempt verification immediately
        if (queryKey) {
          const verifyRes = await fetch("/api/qa/tabby-test-limit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "verify", qaKey: queryKey }),
          });
          if (verifyRes.ok) {
            if (isMounted) {
              setIsAuthenticated(true);
              setCheckingAuth(false);
            }
            return;
          }
        }

        // Otherwise check cookie/session status
        const res = await fetch("/api/qa/tabby-test-limit", { method: "GET" });
        if (isMounted) {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAuthStatus();
    return () => {
      isMounted = false;
    };
  }, [queryKey]);

  // Handle Passkey Submission
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) {
      setAuthError("Please enter the QA access passkey.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/qa/tabby-test-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-qa-key": passkeyInput.trim(),
        },
        body: JSON.stringify({
          action: "verify",
          qaKey: passkeyInput.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setAuthError(data.error || "Invalid QA access passkey. Access denied.");
        setIsAuthenticated(false);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication request failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Lock / Logout
  const handleLock = async () => {
    try {
      await fetch("/api/qa/tabby-test-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lock" }),
      });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setPasskeyInput("");
    setResult(null);
  };

  // Handle Limit Test Session Creation
  const handleTestCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/qa/tabby-test-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(passkeyInput ? { "x-qa-key": passkeyInput.trim() } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          ...(passkeyInput ? { qaKey: passkeyInput.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthError("QA authorization session expired. Please re-enter your passkey.");
        return;
      }

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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 py-24 flex items-center justify-center">
        <div className="text-stone-500 text-sm flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying QA environment access...</span>
        </div>
      </div>
    );
  }

  // ACCESS GATE: Unauthenticated public visitors see ONLY this screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-xl">
              🔒
            </div>
            <h1 className="text-xl font-bold text-masaar-black">
              Tabby QA Console Authorization
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed">
              This diagnostic stress-testing tool is restricted to authorized Tabby QA and Masaar engineering staff. Please enter your QA access passkey to unlock the sandbox testing console.
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-start space-x-2">
              <span className="font-bold">⚠️</span>
              <div>{authError}</div>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                QA Access Passkey
              </label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter QA Passkey"
                required
                className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 bg-masaar-black hover:bg-stone-800 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center space-x-2"
            >
              {authLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Unlock QA Console</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-400">
              Masaar Holidays • Tabby Sandbox QA Environment • No live orders
            </p>
          </div>
        </div>
      </div>
    );
  }

  // AUTHORIZED QA CONSOLE
  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Environment Alert Header */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start justify-between">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                  Tabby Sandbox Pre-Scoring &amp; Limit QA Verification
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  QA Authenticated
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                This endpoint is exclusively restricted to the Tabby Sandbox environment. It creates a controlled test order of <strong>AED 25,000.00</strong> to verify Tabby pre-scoring credit rejection handling, error categorization, and approved fallback customer messaging without affecting production customer orders.
              </p>
            </div>
          </div>
          <button
            onClick={handleLock}
            className="text-xs text-stone-500 hover:text-stone-800 underline ml-4 flex-shrink-0"
            title="Lock Console"
          >
            Lock Console
          </button>
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

            {/* Raw JSON Debugging */}
            <div>
              <details className="text-xs text-stone-500 cursor-pointer">
                <summary className="font-mono hover:text-stone-700">
                  Inspect Raw Server &amp; Gateway Response
                </summary>
                <pre className="mt-2 p-3 bg-stone-900 text-emerald-400 rounded-lg overflow-x-auto font-mono text-xs">
                  {JSON.stringify(result.raw || result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TabbyLimitTestClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 py-12 flex items-center justify-center text-sm text-stone-500">
          Loading QA Limit Test...
        </div>
      }
    >
      <TabbyLimitTestContent />
    </Suspense>
  );
}
