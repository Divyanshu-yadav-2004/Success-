/**
 * BrandLogo — centralized brand identity component
 *
 * Uses the official Success MP Online circular logo image (/logo.png).
 * All branding across the application comes from this single component.
 *
 * Rules enforced here:
 *  - The image is never stretched or distorted (aspect-ratio: 1/1, object-fit: contain).
 *  - "MP" appears exactly once — inside the image itself.
 *  - The text "SUCCESS MP ONLINE" (exact casing below) is the canonical brand name.
 *  - The logo is responsive: sizes are driven by Tailwind size classes or inline style.
 */

import React from "react";

interface BrandLogoProps {
  /**
   * light  — white background contexts (navbar, login card body)
   * dark   — dark/navy background contexts (admin sidebar, email header)
   * compact — smallest footprint, icon-only, no text label
   */
  variant?: "light" | "dark" | "compact";
  /** Show "Government Services Portal" tagline beneath the brand name. Default true. */
  showTagline?: boolean;
  /** Append the "ADMIN" badge next to the brand name. Default false. */
  isAdmin?: boolean;
  /** Additional className passed to the outer wrapper. */
  className?: string;
  /** Logo image diameter in pixels. Defaults vary by variant (see below). */
  size?: number;
}

/** Canonical brand name — "MP" appears once, here only. */
const BRAND_NAME = "SUCCESS MP ONLINE";
const TAGLINE = "Government Services Portal";

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "light",
  showTagline = true,
  isAdmin = false,
  className = "",
  size,
}) => {
  const isDark = variant === "dark";
  const isCompact = variant === "compact";

  // Default logo diameters per variant
  const logoSize = size ?? (isCompact ? 32 : 36);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* ── Official circular logo image ─────────────────────────── */}
      <img
        src="/logo.png"
        alt="Success MP Online"
        width={logoSize}
        height={logoSize}
        style={{
          width: logoSize,
          height: logoSize,
          borderRadius: "50%",
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
        draggable={false}
      />

      {/* ── Text labels (hidden in compact variant) ───────────────── */}
      {!isCompact && (
        <div className="leading-tight min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-extrabold tracking-tight whitespace-nowrap text-sm sm:text-base ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {BRAND_NAME}
            </span>

            {isAdmin && (
              <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 uppercase tracking-wide">
                {/* ShieldAlert inline SVG — no import needed */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                ADMIN
              </span>
            )}
          </div>

          {showTagline && (
            <p
              className={`text-[10px] font-medium tracking-wide whitespace-nowrap mt-0.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {TAGLINE}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
