import React from "react";

// ---------------------------------------------------------------------------
// Emblem: a coin-like medallion ring around two interlocking "C" arcs
// (Chrome Capital), crossed by a single ascending accent line in the
// "chrome" tone. The gold coin-edge + serif wordmark carry the old-money
// register; the one chrome stroke is the only literal nod to the brand name.
// ---------------------------------------------------------------------------
export function LogoMark({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="23" stroke="#D4A94F" strokeWidth="1" opacity="0.55" />
      <path
        d="M46.75,42.32 A18,18 0 1,1 46.75,21.68"
        stroke="#D4A94F"
        strokeWidth="2.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24.63,26.84 A9,9 0 1,1 24.63,37.16"
        stroke="#F0C868"
        strokeWidth="2.75"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="15" y1="47" x2="49" y2="15" stroke="#B8C4D0" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export default function Logo({ size = 40, showWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className="font-display text-lg tracking-wide"
            style={{ color: "#E9EDF2" }}
          >
            Chrome Capital
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.25em] mt-0.5"
            style={{ color: "#8A96A6" }}
          >
            Est. Financial Education
          </span>
        </span>
      )}
    </div>
  );
}
