"use client";

import React, { useEffect, useState } from "react";
import { FileText, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

export function AuthAnimatedBackground() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionHandler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", motionHandler);

    // 2. Mouse Parallax effect (Desktop only)
    const handleMouseMove = (e: MouseEvent) => {
      if (mediaQuery.matches) return;
      const { innerWidth, innerHeight } = window;
      if (innerWidth < 1024) return; // Desktop only
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1
      setParallax({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      mediaQuery.removeEventListener("change", motionHandler);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const parallaxTransform = (factor: number) => {
    if (isReducedMotion) return "none";
    const tx = Math.round(parallax.x * factor);
    const ty = Math.round(parallax.y * factor);
    return `translate3d(${tx}px, ${ty}px, 0)`;
  };

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0" aria-hidden="true">
      {/* SCOPED CSS KEYFRAMES */}
      <style jsx global>{`
        @keyframes interviaFoxEyeBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          93%, 97% { transform: scaleY(0.08); }
        }
        @keyframes interviaFoxHeadTilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1.2deg); }
          65% { transform: rotate(-1deg); }
        }
        @keyframes interviaFoxTailSway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2.5deg); }
        }
        @keyframes interviaFoxEarTwitch {
          0%, 88%, 100% { transform: rotate(0deg); }
          90% { transform: rotate(3deg); }
          94% { transform: rotate(-1deg); }
        }
        @keyframes interviaBlobBreathe {
          0%, 100% { transform: scale(1); opacity: 0.22; }
          50% { transform: scale(1.03); opacity: 0.28; }
        }
        @keyframes interviaFloatCard1 {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-4px) rotate(0.8deg); }
        }
        @keyframes interviaFloatCard2 {
          0%, 100% { transform: translateY(0px) rotate(0.6deg); }
          50% { transform: translateY(3.5px) rotate(-0.6deg); }
        }
        @keyframes interviaFloatCard3 {
          0%, 100% { transform: translateY(0px) rotate(-0.8deg); }
          50% { transform: translateY(-3px) rotate(0.5deg); }
        }
        @keyframes interviaDashFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -40; }
        }
        @keyframes interviaParticleDrift1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.25; }
          50% { transform: translate(5px, -7px); opacity: 0.55; }
        }
        @keyframes interviaParticleDrift2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-6px, -5px); opacity: 0.6; }
        }
        @keyframes interviaTextBreathe {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        .anim-fox-eye {
          transform-origin: center;
          animation: interviaFoxEyeBlink 4s infinite ease-in-out;
        }
        .anim-fox-head {
          transform-origin: bottom center;
          animation: interviaFoxHeadTilt 6.5s infinite ease-in-out;
        }
        .anim-fox-tail {
          transform-origin: bottom right;
          animation: interviaFoxTailSway 5.2s infinite ease-in-out;
        }
        .anim-fox-ear {
          transform-origin: bottom center;
          animation: interviaFoxEarTwitch 7s infinite ease-in-out;
        }
        .anim-blob-breathe {
          animation: interviaBlobBreathe 7.5s infinite ease-in-out;
        }
        .anim-float-1 {
          animation: interviaFloatCard1 6.2s infinite ease-in-out;
        }
        .anim-float-2 {
          animation: interviaFloatCard2 5.8s infinite ease-in-out 1.5s;
        }
        .anim-float-3 {
          animation: interviaFloatCard3 6.8s infinite ease-in-out 3s;
        }
        .anim-dash-flow {
          animation: interviaDashFlow 12s linear infinite;
        }
        .anim-particle-1 {
          animation: interviaParticleDrift1 6s infinite ease-in-out;
        }
        .anim-particle-2 {
          animation: interviaParticleDrift2 7.2s infinite ease-in-out 2s;
        }
        .anim-text-breathe {
          animation: interviaTextBreathe 6.5s infinite ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-fox-eye,
          .anim-fox-head,
          .anim-fox-tail,
          .anim-fox-ear,
          .anim-blob-breathe,
          .anim-float-1,
          .anim-float-2,
          .anim-float-3,
          .anim-dash-flow,
          .anim-particle-1,
          .anim-particle-2,
          .anim-text-breathe {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* LAYER 1: AMBIENT GLOW BLOBS (Parallax 1-2px) */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: parallaxTransform(1.5) }}
      >
        {/* Top-Left Ambient Yellow/Blue Blob */}
        <div className="anim-blob-breathe absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-[#FCB625]/25 via-[#204195]/15 to-transparent blur-3xl pointer-events-none" />

        {/* Bottom-Right Soft Blue Aura */}
        <div className="anim-blob-breathe absolute -bottom-36 -right-36 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-[#204195]/20 via-[#FCB625]/12 to-transparent blur-3xl pointer-events-none" style={{ animationDelay: "3.5s" }} />

        {/* Mid-Left Subtle Gold Accent Glow */}
        <div className="anim-blob-breathe absolute top-1/3 left-10 h-[280px] w-[280px] rounded-full bg-[#FCB625]/10 blur-2xl pointer-events-none" style={{ animationDelay: "1.8s" }} />
      </div>

      {/* LAYER 2: ORBIT & CURVE LINES SVG (Parallax 2px) */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: parallaxTransform(2) }}
      >
        <svg className="h-full w-full opacity-45" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            className="anim-dash-flow"
          />

          {/* Right Orbit Curve */}
          <path
            d="M 1540 180 Q 1200 320 1120 620 T 1400 980"
            stroke="url(#orbit-grad-right)"
            strokeWidth="1.75"
            fill="none"
            strokeDasharray="6 8"
            className="anim-dash-flow"
            style={{ animationDirection: "reverse" }}
          />

          {/* Subtle Accent Circles along curves */}
          <circle cx="280" cy="360" r="3" fill="#FCB625" className="anim-particle-1" />
          <circle cx="1180" cy="450" r="2.5" fill="#204195" className="anim-particle-2" />
        </svg>
      </div>

      {/* LAYER 3: HANDWRITTEN ACCENT TEXT (Top-Left & Bottom-Right) */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out hidden xl:block"
        style={{ transform: parallaxTransform(2.5) }}
      >
        {/* Top-Left Accent Text */}
        <div className="absolute top-16 left-16 max-w-[220px] opacity-75">
          <p className="anim-text-breathe font-serif italic text-sm font-semibold tracking-wide text-[#204195]/80">
            “Better Interview, <span className="text-[#FCB625] not-italic font-bold">Brighter You</span>”
          </p>
          <svg className="w-32 h-2 mt-1 opacity-70" viewBox="0 0 120 8" fill="none">
            <path d="M 2 5 Q 60 1 118 5" stroke="#FCB625" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Bottom-Right Accent Text */}
        <div className="absolute bottom-16 right-16 max-w-[240px] text-right opacity-75">
          <p className="anim-text-breathe font-serif italic text-sm font-semibold tracking-wide text-[#204195]/80">
            “Small Steps, <span className="text-[#204195] not-italic font-bold">Big Opportunities</span>”
          </p>
          <svg className="w-36 h-2 mt-1 ml-auto opacity-70" viewBox="0 0 140 8" fill="none">
            <path d="M 2 4 Q 70 7 138 3" stroke="#204195" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>



      {/* LAYER 5: FLOATING CARDS (Right Side) (Parallax 3px) */}
      <div
        className="absolute inset-0 hidden lg:block transition-transform duration-700 ease-out z-1"
        style={{ transform: parallaxTransform(3) }}
      >
        {/* CARD 1: Top-Right */}
        <div className="anim-float-1 absolute top-[18%] right-[5%] xl:right-[8%] flex items-center gap-2.5 rounded-2xl border border-[#DCE4F3] bg-white/92 backdrop-blur-md px-4 py-2.5 shadow-[0_10px_30px_rgba(32,65,149,0.08)]">
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
        <div className="anim-float-2 absolute top-[48%] right-[3%] xl:right-[6%] flex items-center gap-2.5 rounded-2xl border border-[#DCE4F3] bg-white/92 backdrop-blur-md px-4 py-2.5 shadow-[0_10px_30px_rgba(32,65,149,0.08)]">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#FCB625]/20 text-[#204195]">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#14244B]">AI Feedback &amp; Growth</p>
            <p className="text-[10px] font-medium text-[#607096]">Real-time STAR Analysis</p>
          </div>
        </div>

        {/* CARD 3: Bottom-Right */}
        <div className="anim-float-3 absolute bottom-[18%] right-[6%] xl:right-[9%] flex items-center gap-2.5 rounded-2xl border border-[#DCE4F3] bg-white/92 backdrop-blur-md px-4 py-2.5 shadow-[0_10px_30px_rgba(32,65,149,0.08)]">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#204195] text-[#FCB625]">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#14244B]">Practice With Confidence</p>
            <p className="text-[10px] font-medium text-[#204195]">Voice &amp; Video Mocking</p>
          </div>
        </div>
      </div>

      {/* LAYER 6: DRIFTING SMALL PARTICLES (3-5 particles) */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: parallaxTransform(1.2) }}
      >
        <span className="anim-particle-1 absolute top-[25%] left-[22%] h-2 w-2 rounded-full bg-[#FCB625]/60 blur-[0.5px]" />
        <span className="anim-particle-2 absolute top-[65%] left-[18%] h-1.5 w-1.5 rounded-full bg-[#204195]/50 blur-[0.5px]" />
        <span className="anim-particle-1 absolute top-[30%] right-[25%] h-2 w-2 rounded-full bg-[#204195]/40 blur-[0.5px]" style={{ animationDelay: "3s" }} />
        <span className="anim-particle-2 absolute bottom-[25%] right-[22%] h-1.5 w-1.5 rounded-full bg-[#FCB625]/60 blur-[0.5px]" style={{ animationDelay: "1s" }} />
      </div>
    </div>
  );
}
