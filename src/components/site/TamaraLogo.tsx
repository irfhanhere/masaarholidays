import React from "react";

export function TamaraLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tamara"
    >
      {/* Tamara Official Brand Style Wordmark */}
      <text
        x="2"
        y="21"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="800"
        fill="#0A0A08"
        letterSpacing="-0.5px"
      >
        tamara
      </text>
      <circle cx="86" cy="18" r="3.5" fill="#F88D2A" />
    </svg>
  );
}

export function TamaraBadge({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFF5EB] border border-[#F88D2A]/30 text-[#C86400] font-bold text-xs ${className}`}>
      <span className="rounded bg-[#F88D2A] px-1 py-0.2 text-[9px] font-black text-white uppercase tracking-wider">
        tamara
      </span>
      <span>Pay in 4</span>
    </span>
  );
}
