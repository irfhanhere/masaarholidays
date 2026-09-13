import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "./Container";

export function Hero({
  eyebrow,
  h1,
  image,
  breadcrumb,
  children,
}: {
  eyebrow: string;
  h1: string;
  image: string;
  breadcrumb?: { label: string; href: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src={image} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-masaar-black/85 via-masaar-black/55 to-masaar-black/20" />
      </div>

      <Container className="relative flex min-h-[420px] items-center py-16">
        <div className="max-w-2xl text-white">
          {breadcrumb && (
            <p className="mb-3 text-xs uppercase tracking-widest text-white/70">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.href}>
                  {i > 0 && " / "}
                  {crumb.label}
                </span>
              ))}
            </p>
          )}
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-light-gold">
            {eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight sm:text-5xl">
            {h1}
          </h1>
          {children}
        </div>

        <p className="absolute right-0 top-1/2 hidden -translate-y-1/2 border-l border-white/30 pl-4 text-xs uppercase tracking-[0.3em] text-white/80 lg:block">
          Faith
          <br />
          Clarity
          <br />
          Care
          <br />
          Peace
        </p>
      </Container>
    </section>
  );
}
