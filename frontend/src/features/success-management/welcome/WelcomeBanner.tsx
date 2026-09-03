import React from "react";
import { Sparkles } from "lucide-react";

export const WelcomeBanner: React.FC = () => {
  return (
    <div className="relative rounded-[2rem] bg-gradient-to-r from-[#1e58e6] via-[#1746c8] to-[#0a1848] text-white p-8 sm:p-10 md:p-12 mb-8 overflow-hidden shadow-xl select-none">
      {/* Subtle Dotted Grid Overlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.4) 1.2px, transparent 1.2px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 space-y-4">
        {/* Soft rounded pill badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Citizen Services Portal</span>
        </div>

        {/* Large bold header with Inter/Manrope premium typography */}
        <h1 className="font-['Inter','Manrope',sans-serif] text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] leading-[1.1] text-white flex items-center flex-wrap gap-2.5 sm:gap-3.5">
          <span className="inline-flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl md:text-5xl select-none drop-shadow-sm" role="img" aria-label="Namaste">
              🙏
            </span>
            <span>Namaste,</span>
          </span>
          <span className="text-[#38bdf8] font-extrabold">Citizen</span>
        </h1>

        {/* Supporting paragraph text */}
        <p className="text-white/85 text-sm sm:text-base max-w-3xl leading-relaxed font-normal">
          Choose a service below to start a new application. Your applications are processed securely and you'll receive a digital receipt instantly after payment.
        </p>
      </div>
    </div>
  );
};

export default WelcomeBanner;
