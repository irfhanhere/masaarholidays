import React from "react";
import { Container } from "./Container";
import { TamaraLogo, TamaraBadge } from "./TamaraLogo";
import { CheckIcon } from "./icons";

export function TamaraHighlight() {
  return (
    <section className="bg-warm-ivory/60 border-y border-black/5 py-12">
      <Container>
        <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-6 sm:p-8 md:p-10 shadow-xs">
          {/* Subtle gold accent corner bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pure-gold via-deep-gold to-pure-gold opacity-90" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
            {/* Left Content */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-3">
                <TamaraBadge />
                <span className="text-xs font-semibold uppercase tracking-wider text-deep-gold">
                  Flexible Payment Option
                </span>
              </div>

              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-masaar-black tracking-tight">
                Flexible Payments with Tamara
              </h2>

              <p className="text-sm leading-relaxed text-masaar-black/75 max-w-2xl">
                Enjoy a convenient payment experience with Tamara. Choose Tamara at checkout when available and complete your booking securely.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-masaar-black/70">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckIcon className="size-4 text-emerald-600 shrink-0" />
                  <span>Secure &amp; Encrypted Checkout</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckIcon className="size-4 text-emerald-600 shrink-0" />
                  <span>Shariah-Compliant Process</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckIcon className="size-4 text-emerald-600 shrink-0" />
                  <span>Zero Hidden Fees</span>
                </span>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="md:col-span-4 flex flex-col items-center sm:items-end justify-center">
              <div className="w-full max-w-xs rounded-xl border border-black/10 bg-warm-ivory/80 p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-masaar-black">Accepted at Checkout</span>
                  <TamaraLogo className="h-6 w-auto" />
                </div>
                <p className="text-[11px] text-masaar-black/60 leading-normal">
                  Select Tamara at checkout on supported travel services and complete your booking with ease.
                </p>
                <div className="pt-2 border-t border-black/5 text-[10px] font-medium text-masaar-black/50">
                  Masaar Holidays • Official Partner Gateway
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
