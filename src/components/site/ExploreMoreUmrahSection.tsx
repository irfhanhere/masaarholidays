import React from "react";
import Link from "next/link";
import { Container } from "./Container";
import { CompassIcon } from "./icons";

export function ExploreMoreUmrahSection() {
  return (
    <section className="bg-warm-ivory py-16 border-t border-black/5">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-masaar-black text-white p-8 sm:p-12 md:p-16 shadow-lg text-center">
          {/* Subtle background decorative ornament */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pure-gold/15 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-pure-gold/40 bg-pure-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-pure-gold">
              <CompassIcon className="size-3.5 text-pure-gold" />
              <span>Full Umrah Collection</span>
            </div>

            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              Explore More Umrah Packages
            </h2>

            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Discover thoughtfully planned Umrah journeys designed around your comfort, accommodation preferences and travel needs.
            </p>

            <div className="pt-4">
              <Link
                href="/umrah"
                className="inline-flex items-center justify-center rounded-lg bg-pure-gold hover:bg-deep-gold px-8 py-3.5 text-sm font-bold text-masaar-black hover:text-white transition-all shadow-md group"
              >
                <span>Explore All Umrah Packages</span>
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
