import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "./Container";

/**
 * Standard site hero — shared visual language with UmrahHero and HajjHero:
 * Warm ivory background (#FAF7F2), right-aligned photography smoothly faded
 * into the cream background, gold-accented typography, and optional top-right
 * caption.
 */
export function Hero({
  eyebrow,
  h1,
  h1Gold,
  image,
  breadcrumb: _breadcrumb,
  children,
}: {
  eyebrow: string;
  h1: string;
  h1Gold?: string;
  image: string;
  /** @deprecated — breadcrumbs rendered separately via <Breadcrumbs /> */
  breadcrumb?: { label: string; href: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="relative w-full overflow-hidden bg-[#FAF7F2] border-b border-black/10">
      {/* Background Graphic & Photography on the right */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-7/12 pointer-events-none">
        <div className="relative h-full w-full">
          <Image
            src={image}
            alt={h1}
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
            <span>{eyebrow}</span>
            <span>—</span>
          </div>

          {/* Headline */}
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-masaar-black sm:text-6xl sm:leading-[1.15]">
            {h1}
            {h1Gold && (
              <>
                <br />
                <span className="italic text-[#A87F12]">{h1Gold}</span>
              </>
            )}
          </h1>

          {/* Content / Subtext / Actions */}
          {children}
        </div>
      </Container>
    </div>
  );
}
