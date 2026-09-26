import Image from "next/image";
import { Container } from "./Container";
import { WhatsAppButton } from "./WhatsAppButton";

/**
 * Hajj landing hero — same visual language as UmrahHero.tsx (cream
 * background, photo bleeding in from the right with a gradient fade,
 * vertical corner caption) but with a single CTA only, per Irfhan's
 * request to drop the second "Explore Hajj Packages" button.
 */
export function HajjHero() {
  return (
    <div className="relative w-full overflow-hidden border-b border-black/10 bg-[#FAF7F2]">
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-full lg:w-7/12">
        <div className="relative h-full w-full">
          <Image
            src="/brand/banners/hajj.png"
            alt="Pilgrims at Mina during Hajj"
            fill
            priority
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent lg:via-[#FAF7F2]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent lg:hidden" />
        </div>
      </div>

      <Container className="relative z-10 py-14 lg:py-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A87F12]">
            <span>—</span>
            <span>Hajj Packages From UAE</span>
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-masaar-black sm:text-5xl sm:leading-[1.15]">
            Hajj Packages From UAE Planned With Care & Dignity
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-masaar-black/70">
            Official Hajj packages from UAE — direct flights, Category A Mina tents, dedicated Moallim, and your choice of shifting or non-shifting stay.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <WhatsAppButton templateKey="hajj">Register Interest on WhatsApp</WhatsAppButton>
          </div>
        </div>
      </Container>
    </div>
  );
}
