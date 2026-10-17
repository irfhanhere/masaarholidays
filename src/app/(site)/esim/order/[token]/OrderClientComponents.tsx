"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function OrderPoller({
  shouldPoll,
  whatsAppUrl,
  createdAt,
}: {
  shouldPoll: boolean;
  whatsAppUrl?: string;
  createdAt?: string;
}) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(() => {
    if (!createdAt) return false;
    const elapsed = Date.now() - new Date(createdAt).getTime();
    return elapsed >= 10 * 60 * 1000;
  });

  useEffect(() => {
    if (!shouldPoll || timedOut) return;

    // Check if initial time already exceeded
    const startTime = Date.now();
    const existingElapsed = createdAt ? Date.now() - new Date(createdAt).getTime() : 0;
    const remainingTime = Math.max(0, 10 * 60 * 1000 - existingElapsed);

    if (remainingTime <= 0) {
      setTimedOut(true);
      return;
    }

    const timeoutTimer = setTimeout(() => {
      setTimedOut(true);
    }, remainingTime);

    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutTimer);
    };
  }, [shouldPoll, timedOut, createdAt, router]);

  if (timedOut && shouldPoll) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 text-center shadow-xs space-y-3">
        <div className="inline-flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-800 mx-auto">
          <span className="text-lg">⏳</span>
        </div>
        <h3 className="text-sm font-bold text-amber-950">
          Still preparing, we&apos;ve alerted our team
        </h3>
        <p className="mx-auto max-w-md text-xs text-amber-900/80 leading-relaxed">
          Your eSIM provisioning is taking a few extra minutes. Our concierge team in Dubai has been notified to ensure your digital profile is generated without further delay.
        </p>
        {whatsAppUrl && (
          <div className="pt-1">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#20bd5a]"
            >
              <span>💬</span> Message Concierge on WhatsApp
            </a>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function CopyButton({
  text,
  label = "Copy Code",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Failed to copy to clipboard:", e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#0A0A08] shadow-2xs hover:bg-[#FAF7F2] active:scale-95 transition"
      }
    >
      {copied ? (
        <>
          <svg className="size-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-emerald-700">Copied!</span>
        </>
      ) : (
        <>
          <svg className="size-3.5 text-[#0A0A08]/60" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
            <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
