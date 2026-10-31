"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/site/Container";

export function TabbyPromoBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden border-y border-black/5 bg-gradient-to-r from-[#F9F6F0] via-[#F4EDE2] to-[#F9F6F0] py-8 sm:py-10">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            {/* Left: Tabby badge & description */}
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Tabby Logo Badge */}
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3EEDB4] shadow-sm ring-4 ring-[#3EEDB4]/20 sm:size-14">
                <span className="font-[family-name:var(--font-display)] text-base font-black tracking-tight text-black sm:text-lg">
                  tabby
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-masaar-black uppercase">
                    Official Payment Partner
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                    <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Sharia-Compliant
                  </span>
                </div>

                <h3 className="mt-1 text-base font-bold text-masaar-black sm:text-lg">
                  Split your travel in 4 payments. No interest. No fees.
                </h3>
                <p className="mt-0.5 text-xs text-masaar-black/70 sm:text-sm">
                  Available on UAE and Saudi Tourist Visa applications with instant approval.
                </p>
              </div>
            </div>

            {/* Right: Informational action buttons */}
            <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-lg border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-masaar-black transition-colors hover:bg-black/5"
              >
                How It Works
              </button>
              <Link
                href="/visa"
                className="inline-flex items-center justify-center rounded-lg bg-masaar-black px-4 py-2 text-xs font-semibold text-pure-gold transition-all hover:bg-black active:scale-95"
              >
                Apply with Tabby →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Informational Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-masaar-black/50 hover:text-masaar-black"
              aria-label="Close modal"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#3EEDB4]">
                <span className="font-[family-name:var(--font-display)] text-sm font-black text-black">
                  tabby
                </span>
              </div>
              <div>
                <h4 className="font-bold text-masaar-black text-base">How Tabby Works</h4>
                <p className="text-xs text-masaar-black/60">Pay in 4 equal monthly installments</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 font-bold text-deep-gold text-xs">
                  1
                </div>
                <div>
                  <p className="text-xs font-semibold text-masaar-black">Choose Tabby at checkout</p>
                  <p className="mt-0.5 text-[11px] text-masaar-black/70">
                    Select Tabby as your payment method during UAE or Saudi Visa application checkout.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 font-bold text-deep-gold text-xs">
                  2
                </div>
                <div>
                  <p className="text-xs font-semibold text-masaar-black">Instant verification</p>
                  <p className="mt-0.5 text-[11px] text-masaar-black/70">
                    Link your debit or credit card and verify with your mobile number and Emirates ID / National ID.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 font-bold text-deep-gold text-xs">
                  3
                </div>
                <div>
                  <p className="text-xs font-semibold text-masaar-black">Pay 25% today</p>
                  <p className="mt-0.5 text-[11px] text-masaar-black/70">
                    Your first installment is charged immediately upon order confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 font-bold text-deep-gold text-xs">
                  4
                </div>
                <div>
                  <p className="text-xs font-semibold text-masaar-black">Remaining 3 monthly payments</p>
                  <p className="mt-0.5 text-[11px] text-masaar-black/70">
                    The rest is split over the next 3 months. No interest, no hidden costs when paid on schedule.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-warm-ivory p-3.5 text-center text-xs text-masaar-black/80">
              <span className="font-semibold text-emerald-800">100% Sharia-compliant:</span>{" "}
              Masaar Holidays charges no extra fee or surcharge for paying with Tabby.
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-lg bg-pure-gold py-2.5 text-xs font-semibold text-masaar-black shadow-sm hover:bg-light-gold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
