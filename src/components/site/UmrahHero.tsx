"use client";

import Image from "next/image";
import { Container } from "./Container";

interface Props {
  onOpenEnquiry?: () => void;
}

export function UmrahHero({ onOpenEnquiry }: Props) {
  const WHATSAPP_NUMBER = "971552276299";
  const defaultMessage = encodeURIComponent(
    "Assalamu Alaikum,\n\nI'm interested in planning an Umrah journey with Masaar Holidays.\n\nPlease share available packages and options.\n\nJazakAllah Khair."
  );

  return (
    <div className="relative w-full overflow-hidden bg-[#FAF7F2] border-b border-black/10">
      {/* Background Graphic & Kaaba Photography */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-7/12 pointer-events-none">
        <div className="relative h-full w-full">
          <Image
            src="/brand/banners/umrah.png"
            alt="The Holy Kaaba in Makkah"
            fill
            priority
            className="object-cover object-right"
          />
          {/* Subtle soft gradient fade into the cream background on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent lg:via-[#FAF7F2]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent lg:hidden" />
        </div>
      </div>

      <Container className="relative z-10 pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
            <span>—</span>
            <span>UMRAH PACKAGES</span>
            <span>—</span>
          </div>

          {/* Headline */}
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-masaar-black sm:text-6xl sm:leading-[1.15]">
            Your Umrah Journey,<br />Thoughtfully Planned
          </h1>

          {/* Subtext */}
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-masaar-black/75 max-w-xl">
            Comfortable stays, private transfers and dedicated support — so you can focus on what truly matters.
          </p>

          {/* Action CTA */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {onOpenEnquiry ? (
              <button
                type="button"
                onClick={onOpenEnquiry}
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#A87F12] px-7 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#936e0f] hover:shadow-lg"
              >
                <span>💬</span>
                <span>Enquire on WhatsApp →</span>
              </button>
            ) : (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${defaultMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#A87F12] px-7 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#936e0f] hover:shadow-lg"
              >
                <span>💬</span>
                <span>Enquire on WhatsApp →</span>
              </a>
            )}
          </div>
        </div>

        {/* 4-Item Trust Strip */}
        <div className="mt-16 pt-8 border-t border-black/10 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-3xl">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#A87F12] shadow-2xs border border-black/5 text-lg">
              🚗
            </span>
            <div>
              <p className="text-xs font-bold text-masaar-black">Private Transfers</p>
              <p className="text-[11px] text-masaar-black/60">Hassle-free travel</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#A87F12] shadow-2xs border border-black/5 text-lg">
              🏨
            </span>
            <div>
              <p className="text-xs font-bold text-masaar-black">Verified Hotels</p>
              <p className="text-[11px] text-masaar-black/60">Quality you can trust</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#A87F12] shadow-2xs border border-black/5 text-lg">
              🎧
            </span>
            <div>
              <p className="text-xs font-bold text-masaar-black">24/7 Guest Support</p>
              <p className="text-[11px] text-masaar-black/60">We&apos;re with you always</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#A87F12] shadow-2xs border border-black/5 text-lg">
              📄
            </span>
            <div>
              <p className="text-xs font-bold text-masaar-black">Visa Assistance</p>
              <p className="text-[11px] text-masaar-black/60">Guidance at every step</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
