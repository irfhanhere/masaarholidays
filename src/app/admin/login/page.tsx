import Image from "next/image";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Portal | Masaar Holidays",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-warm-ivory px-4">
      <p className="absolute right-10 top-8 hidden text-xs uppercase tracking-[0.3em] text-masaar-black/50 sm:block">
        Faith &nbsp;·&nbsp; Clarity &nbsp;·&nbsp; Care &nbsp;·&nbsp; Peace
      </p>

      <p className="absolute left-10 top-1/2 hidden max-w-[220px] -translate-y-1/2 font-[family-name:var(--font-display)] text-2xl italic text-masaar-black/40 lg:block">
        A simpler way to manage meaningful journeys.
      </p>

      <div className="w-full max-w-md rounded-xl border border-black/5 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <Image src="/brand/logo.png" alt="Masaar Holidays" width={140} height={42} className="h-12 w-auto" />
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black">
            Admin Portal
          </h1>
          <p className="mt-1 text-sm text-masaar-black/60">Manage your content. Keep journeys inspired.</p>
        </div>

        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
