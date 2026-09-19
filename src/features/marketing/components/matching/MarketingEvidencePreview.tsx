"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import MorphIcon from "../../graphics/MorphIcon";
import { MARKETING_EVIDENCE_MOCK, type EvidenceItem } from "../../data/landing.data";
import { EASE_CUSTOM } from "../../motion/variants";
import { useLanguage } from "@/i18n/LanguageProvider";

export function MarketingEvidencePreview() {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const shouldReduceMotion = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-cycle through evidence items for demo effect, pause on user interaction or reduced motion
  useEffect(() => {
    if (isUserInteracting || shouldReduceMotion) return;

    timerRef.current = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % MARKETING_EVIDENCE_MOCK.length);
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isUserInteracting, shouldReduceMotion]);

  const selectedItem = MARKETING_EVIDENCE_MOCK[selectedIndex];

  const handleSelect = (index: number) => {
    setIsUserInteracting(true);
    setSelectedIndex(index);
  };

  const matchedCount = MARKETING_EVIDENCE_MOCK.filter((i) => i.status === "matched").length;
  const totalCount = MARKETING_EVIDENCE_MOCK.length;

  return (
    <div className="w-full rounded-3xl border border-[#DCE4F3] bg-white p-5 sm:p-8 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#DCE4F3] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <MorphIcon currentKey="evidence" size={32} color="#204195" />
            <h3 className="font-sans text-lg font-bold text-[#14244B]">
              {t("evidence.title")}
            </h3>
          </div>
          <p className="mt-1 text-xs text-[#607096]">
            {t("evidence.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
            {t("evidence.matchedCount").replace("{matched}", String(matchedCount)).replace("{total}", String(totalCount))}
          </span>
          <span className="rounded-full bg-[#EEF3FC] border border-[#DCE4F3] px-3 py-1 font-mono text-xs font-bold text-[#204195]">
            DEMO MATCH
          </span>
        </div>
      </div>

      {/* Main Grid: Left CV Snippet Panel <-> Right Requirement List */}
      <div className="mt-6 grid gap-6 md:grid-cols-12 items-start text-left">
        {/* LEFT COLUMN: Simulated CV Document View with Highlighted Snippets */}
        <div className="md:col-span-6 rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-5 shadow-xs relative">
          <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <MorphIcon currentKey="document" size={20} color="#204195" />
              <span className="font-sans text-xs font-bold text-[#14244B]">Nguyen_Van_A_Resume.pdf</span>
            </div>
            <span className="font-mono text-[10px] text-[#607096]">Parsed Evidence Document</span>
          </div>

          <div className="space-y-4 text-xs font-sans text-[#14244B] leading-relaxed">
            <div className="p-3 bg-white rounded-xl border border-[#DCE4F3]">
              <p className="font-bold text-[#204195]">WORK EXPERIENCE & PROJECTS</p>
              <p className="mt-1 text-[#607096] text-[11px]">Senior Backend Developer · Fintech Enterprise (2022 - Present)</p>
            </div>

            {/* Render Snippet Highlights */}
            <div className="space-y-2.5">
              {MARKETING_EVIDENCE_MOCK.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const hasSnippets = item.snippets.length > 0;

                if (!hasSnippets) return null;

                return (
                  <div
                    key={item.requirement}
                    onClick={() => handleSelect(idx)}
                    className={`p-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#FCB625]/20 border-2 border-[#FCB625] shadow-xs"
                        : "bg-white border border-[#DCE4F3] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#607096] mb-1">
                      <span className="font-bold text-[#204195]">Snippet Evidence #{idx + 1}</span>
                      {isSelected && (
                        <span className="text-[#9E6C00] font-bold">★ Active Highlight</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#14244B]">
                      &quot;{item.snippets[0]}&quot;
                    </p>
                  </div>
                );
              })}

              {selectedItem.status === "missing" && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <MorphIcon currentKey="emptyDocument" size={24} color="#D97706" />
                    <span>{t("evidence.missingSnippet")}</span>
                  </div>
                  <p className="mt-1.5 font-semibold text-[#14244B] pl-8">
                    &quot;{selectedItem.requirement}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive JD Requirements List */}
        <div className="md:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#204195] px-1">
            <span>JD REQUIREMENT SPECIFICATIONS</span>
            <span className="font-mono text-[#607096]">Target Role: Senior Backend</span>
          </div>

          <div className="space-y-2.5">
            {MARKETING_EVIDENCE_MOCK.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isMatched = item.status === "matched";

              return (
                <div
                  key={item.requirement}
                  onClick={() => handleSelect(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(idx);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] cursor-pointer ${
                    isSelected
                      ? "border-[#204195] bg-[#F7F9FD] shadow-md ring-1 ring-[#204195]"
                      : "border-[#DCE4F3] bg-white hover:border-[#204195]/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded-md bg-[#EEF3FC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#204195]">
                          {item.categoryLabel}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-[#607096]">
                          #{idx + 1}
                        </span>
                      </div>
                      <h4 className="font-sans text-sm font-bold text-[#14244B] leading-snug">
                        {item.requirement}
                      </h4>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isMatched ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                          <MorphIcon currentKey="evidence" size={14} color="#065F46" /> {t("evidence.matched")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-800">
                          <MorphIcon currentKey="emptyDocument" size={14} color="#92400E" /> {t("evidence.missing")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketingEvidencePreview;
