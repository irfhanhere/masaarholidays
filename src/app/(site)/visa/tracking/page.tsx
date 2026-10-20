"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { CONTACT } from "@/lib/contact";

export default function VisaLookupPage() {
  const [referenceNo, setReferenceNo] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNo.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/visa/tracking?ref=${encodeURIComponent(referenceNo.trim())}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || "No matching application found. Please check your reference number.");
      }

      window.location.href = `/visa/application/${data.token}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lookup failed";
      setError(msg);
      setLoading(false);
    }
  };

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
            <span className="font-medium text-masaar-black">Track Application</span>
          </div>
        </Container>
      </div>

      <section className="relative overflow-hidden bg-masaar-black py-16 text-white text-center sm:py-20">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
            — VISA TRACKING PORTAL —
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            Track Your Visa Application
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-white/70 sm:text-sm">
            Enter your application reference number to view your real-time processing status and updates.
          </p>
        </Container>
      </section>

      <Container className="mt-12">
        <div className="mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-md sm:p-8">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-masaar-black">
                Application Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. MH-UV-2026-001248"
                className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3.5 py-2.5 text-xs uppercase tracking-wider text-masaar-black focus:border-pure-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">
                Primary Contact Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3.5 py-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-pure-gold py-3 text-xs font-semibold text-masaar-black shadow transition-all hover:bg-light-gold active:scale-95 disabled:opacity-50"
            >
              {loading ? "Locating Application..." : "Track Application →"}
            </button>
          </form>

          <div className="mt-6 border-t border-black/5 pt-4 text-center">
            <p className="text-xs text-masaar-black/60">
              Need assistance finding your reference number?
            </p>
            <a
              href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                "Hello Masaar Holidays, I need help locating my visa application reference."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-deep-gold hover:underline"
            >
              Contact Support on WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
