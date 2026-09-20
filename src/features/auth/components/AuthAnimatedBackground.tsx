import React from "react";
import { FileText, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

export function AuthAnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0" aria-hidden="true">
      {/* BASE FIXED BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-[#F7F9FD] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-login.png')" }}
      />

      {/* LAYER 1: AMBIENT GLOW BLOBS (Static) */}
      <div className="absolute inset-0">
        {/* Top-Left Ambient Yellow/Blue Blob */}
        <div className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-[#FCB625]/20 via-[#204195]/12 to-transparent blur-3xl pointer-events-none opacity-80" />

        {/* Bottom-Right Soft Blue Aura */}
        <div className="absolute -bottom-36 -right-36 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-[#204195]/18 via-[#FCB625]/10 to-transparent blur-3xl pointer-events-none opacity-80" />

        {/* Mid-Left Subtle Gold Accent Glow */}
        <div className="absolute top-1/3 left-10 h-[280px] w-[280px] rounded-full bg-[#FCB625]/10 blur-2xl pointer-events-none" />
      </div>

      {/* LAYER 2: ORBIT & CURVE LINES SVG (Static) */}
      <div className="absolute inset-0">
        <svg className="h-full w-full opacity-40" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="orbit-grad-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#204195" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#FCB625" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#204195" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="orbit-grad-right" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCB625" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#204195" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Left Orbit Curve */}
          <path
            d="M -100 220 Q 220 180 340 520 T 120 950"
            stroke="url(#orbit-grad-left)"
            strokeWidth="1.75"
            fill="none"
            strokeDasharray="8 8"
          />

          {/* Right Orbit Curve */}
          <path
            d="M 1540 180 Q 1200 320 1120 620 T 1400 980"
            stroke="url(#orbit-grad-right)"
            strokeWidth="1.75"
            fill="none"
            strokeDasharray="6 8"
          />

          {/* Subtle Accent Circles along curves */}
          <circle cx="280" cy="360" r="3" fill="#FCB625" opacity="0.6" />
          <circle cx="1180" cy="450" r="2.5" fill="#204195" opacity="0.6" />
        </svg>
      </div>

      {/* LAYER 3: HANDWRITTEN ACCENT TEXT (Top-Left & Bottom-Right - Static) */}
      <div className="absolute inset-0 hidden xl:block">
        {/* Top-Left Accent Text */}
        <div className="absolute top-16 left-16 max-w-[220px] opacity-75">
          <p className="font-serif italic text-sm font-semibold tracking-wide text-[#204195]/80">
            “Better Interview, <span className="text-[#FCB625] not-italic font-bold">Brighter You</span>”
          </p>
          <svg className="w-32 h-2 mt-1 opacity-70" viewBox="0 0 120 8" fill="none">
            <path d="M 2 5 Q 60 1 118 5" stroke="#FCB625" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Bottom-Right Accent Text */}
        <div className="absolute bottom-16 right-16 max-w-[240px] text-right opacity-75">
          <p className="font-serif italic text-sm font-semibold tracking-wide text-[#204195]/80">
            “Small Steps, <span className="text-[#204195] not-italic font-bold">Big Opportunities</span>”
          </p>
          <svg className="w-36 h-2 mt-1 ml-auto opacity-70" viewBox="0 0 140 8" fill="none">
            <path d="M 2 4 Q 70 7 138 3" stroke="#204195" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* LAYER 5: FLOATING CARDS (Right Side - Static) */}
      <div className="absolute inset-0 hidden lg:block z-1">
        {/* CARD 1: Top-Right */}
        <div className="absolute top-[18%] right-[5%] xl:right-[8%] flex items-center gap-2.5 rounded-2xl border border-[#DCE4F3] bg-white/92 backdrop-blur-md px-4 py-2.5 shadow-[0_10px_30px_rgba(32,65,149,0.08)]">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#204195]/10 text-[#204195]">
            <FileText size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#14244B]">Your CV, Your Story</p>
            <p className="text-[10px] font-medium text-[#10B981] flex items-center gap-1">
              <CheckCircle2 size={11} /> High Match Score
            </p>
          </div>
        </div>

        {/* CARD 2: Mid-Right */}
        <div className="absolute top-[48%] right-[3%] xl:right-[6%] flex items-center gap-2.5 rounded-2xl border border-[#DCE4F3] bg-white/92 backdrop-blur-md px-4 py-2.5 shadow-[0_10px_30px_rgba(32,65,149,0.08)]">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#FCB625]/20 text-[#204195]">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#14244B]">AI Feedback &amp; Growth</p>
            <p className="text-[10px] font-medium text-[#607096]">Real-time STAR Analysis</p>
          </div>
        </div>

        {/* CARD 3: Bottom-Right */}
        <div className="absolute bottom-[18%] right-[6%] xl:right-[9%] flex items-center gap-2.5 rounded-2xl border border-[#DCE4F3] bg-white/92 backdrop-blur-md px-4 py-2.5 shadow-[0_10px_30px_rgba(32,65,149,0.08)]">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#204195] text-[#FCB625]">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#14244B]">Practice With Confidence</p>
            <p className="text-[10px] font-medium text-[#204195]">Voice &amp; Video Mocking</p>
          </div>
        </div>
      </div>

      {/* LAYER 6: SMALL PARTICLES (Static) */}
      <div className="absolute inset-0">
        <span className="absolute top-[25%] left-[22%] h-2 w-2 rounded-full bg-[#FCB625]/60 blur-[0.5px]" />
        <span className="absolute top-[65%] left-[18%] h-1.5 w-1.5 rounded-full bg-[#204195]/50 blur-[0.5px]" />
        <span className="absolute top-[30%] right-[25%] h-2 w-2 rounded-full bg-[#204195]/40 blur-[0.5px]" />
        <span className="absolute bottom-[25%] right-[22%] h-1.5 w-1.5 rounded-full bg-[#FCB625]/60 blur-[0.5px]" />
      </div>
    </div>
  );
}
