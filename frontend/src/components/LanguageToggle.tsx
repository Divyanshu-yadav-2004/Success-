import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export type LanguageToggleSize = "sm" | "md" | "lg" | "responsive";

export interface LanguageToggleProps {
  /** Optional language state if used controlled */
  language?: "en" | "hi";
  /** Optional change handler if used controlled */
  onChange?: (lang: "en" | "hi") => void;
  /** Size preset: sm (mobile navbar), md (desktop navbar), lg (full 230px match), or custom scale */
  size?: LanguageToggleSize;
  /** Custom scale factor (0.4 to 1.5) if needed */
  scale?: number;
  /** Additional CSS classes */
  className?: string;
}

const SIZE_CONFIGS = {
  // Mobile / compact header
  sm: {
    totalWidth: 98,
    totalHeight: 28,
    trackWidth: 54,
    trackHeight: 26,
    knobSize: 22,
    travel: 28,
    textSize: 11,
    gap: 5,
    strokeWidth: 1.2,
    spokeWidth: 0.8,
  },
  // Desktop header / default compact
  md: {
    totalWidth: 136,
    totalHeight: 38,
    trackWidth: 74,
    trackHeight: 36,
    knobSize: 32,
    travel: 38,
    textSize: 15,
    gap: 8,
    strokeWidth: 1.4,
    spokeWidth: 0.85,
  },
  // Full 1:1 match with reference specifications (230px x 60px)
  lg: {
    totalWidth: 230,
    totalHeight: 60,
    trackWidth: 125,
    trackHeight: 58,
    knobSize: 54,
    travel: 67,
    textSize: 28,
    gap: 14,
    strokeWidth: 1.6,
    spokeWidth: 0.9,
  },
};

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language: controlledLanguage,
  onChange,
  size = "md",
  scale,
  className = "",
}) => {
  const context = useLanguage();
  const currentLanguage = controlledLanguage || context?.language || "hi";

  const handleToggle = () => {
    const nextLang = currentLanguage === "en" ? "hi" : "en";
    if (onChange) {
      onChange(nextLang);
    } else if (context?.setLanguage) {
      context.setLanguage(nextLang);
    }
  };

  const setLang = (lang: "en" | "hi") => {
    if (onChange) {
      onChange(lang);
    } else if (context?.setLanguage) {
      context.setLanguage(lang);
    }
  };

  const isHindi = currentLanguage === "hi";

  // Compute dimensions based on size preset or scale factor
  let cfg = SIZE_CONFIGS[size === "responsive" ? "md" : size] || SIZE_CONFIGS.md;
  
  if (scale && scale !== 1) {
    const base = SIZE_CONFIGS.lg;
    cfg = {
      totalWidth: Math.round(base.totalWidth * scale),
      totalHeight: Math.round(base.totalHeight * scale),
      trackWidth: Math.round(base.trackWidth * scale),
      trackHeight: Math.round(base.trackHeight * scale),
      knobSize: Math.round(base.knobSize * scale),
      travel: Math.round(base.travel * scale),
      textSize: Math.max(10, Math.round(base.textSize * scale)),
      gap: Math.max(4, Math.round(base.gap * scale)),
      strokeWidth: base.strokeWidth * Math.max(0.7, scale),
      spokeWidth: base.spokeWidth * Math.max(0.7, scale),
    };
  }

  const {
    totalWidth,
    totalHeight,
    trackWidth,
    trackHeight,
    knobSize,
    travel,
    textSize,
    strokeWidth,
    spokeWidth,
  } = cfg;

  return (
    <div
      className={`inline-flex items-center select-none font-sans shrink-0 ${className}`}
      style={{
        width: totalWidth,
        height: totalHeight,
        justifyContent: "space-between",
      }}
      role="group"
      aria-label="Language selection"
    >
      {/* EN Label */}
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={!isHindi}
        className="font-extrabold tracking-wider transition-colors duration-300 focus:outline-none cursor-pointer leading-none shrink-0"
        style={{
          fontSize: textSize,
          letterSpacing: "0.03em",
          color: !isHindi ? "#334155" : "#94a3b8",
          background: "transparent",
          border: "none",
          padding: 0,
        }}
      >
        EN
      </button>

      {/* Center Rounded Pill Track */}
      <div
        onClick={handleToggle}
        className="relative cursor-pointer transition-all duration-300 flex items-center shrink-0"
        style={{
          width: trackWidth,
          height: trackHeight,
          backgroundColor: "#e8edf2",
          borderRadius: trackHeight / 2,
          padding: 1,
          boxShadow:
            "inset 0 3px 6px rgba(0, 0, 0, 0.16), inset 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 -1.5px 3px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(255, 255, 255, 0.8)",
          border: "1px solid rgba(210, 218, 226, 0.7)",
        }}
        title={`Switch to ${isHindi ? "English" : "Hindi"}`}
      >
        {/* Sliding Circular Knob */}
        <div
          className="absolute rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 ease-in-out"
          style={{
            width: knobSize,
            height: knobSize,
            top: "50%",
            left: (trackHeight - knobSize) / 2,
            marginTop: -knobSize / 2,
            transform: isHindi ? `translateX(${travel}px)` : "translateX(0px)",
            boxShadow:
              "0 3px 7px rgba(0, 0, 0, 0.22), 0 1px 3px rgba(0, 0, 0, 0.14)",
            border: "1.5px solid rgba(255, 255, 255, 0.95)",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Indian Flag Clean Circular Graphic */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full block"
            style={{ borderRadius: "50%" }}
          >
            {/* Top Saffron Stripe */}
            <rect x="0" y="0" width="100" height="33.33" fill="#FF9933" />
            {/* Middle White Stripe */}
            <rect x="0" y="33.33" width="100" height="33.34" fill="#FFFFFF" />
            {/* Bottom Green Stripe */}
            <rect x="0" y="66.67" width="100" height="33.33" fill="#138808" />

            {/* Ashoka Chakra */}
            <g transform="translate(50, 50)">
              {/* Outer Navy Ring */}
              <circle
                cx="0"
                cy="0"
                r="13"
                fill="none"
                stroke="#000088"
                strokeWidth={strokeWidth}
              />
              {/* Inner Center Hub */}
              <circle cx="0" cy="0" r="2.8" fill="#000088" />
              {/* 24 Spokes */}
              {Array.from({ length: 24 }).map((_, index) => {
                const angle = (index * 360) / 24;
                return (
                  <line
                    key={index}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="-12.8"
                    stroke="#000088"
                    strokeWidth={spokeWidth}
                    transform={`rotate(${angle})`}
                  />
                );
              })}
            </g>
          </svg>

          {/* 3D Glass Dome Gloss Overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-full"
            style={{
              background:
                "linear-gradient(175deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.08) 100%)",
              boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.7)",
            }}
          />
        </div>
      </div>

      {/* HI Label */}
      <button
        type="button"
        onClick={() => setLang("hi")}
        aria-pressed={isHindi}
        className="font-extrabold tracking-wider transition-colors duration-300 focus:outline-none cursor-pointer leading-none shrink-0"
        style={{
          fontSize: textSize,
          letterSpacing: "0.03em",
          color: isHindi ? "#334155" : "#94a3b8",
          background: "transparent",
          border: "none",
          padding: 0,
        }}
      >
        HI
      </button>
    </div>
  );
};

export default LanguageToggle;
