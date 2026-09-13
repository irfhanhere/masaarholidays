"use client";

import Image from "next/image";
import { useEffect } from "react";

// System page (500) — no main nav, per brief. App Router requires error
// boundaries to be Client Components.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warm-ivory px-6 text-center">
      <Image src="/brand/logo.png" alt="Masaar Holidays" width={160} height={48} className="h-11 w-auto" />
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-masaar-black">
          Something went wrong.
        </h1>
        <p className="mt-2 text-masaar-black/60">
          Please try again, or reach us directly on WhatsApp if the problem continues.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-md bg-admin-primary px-5 py-3 text-sm font-semibold text-white"
      >
        Try Again
      </button>
    </div>
  );
}
