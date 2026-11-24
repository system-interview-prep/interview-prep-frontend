"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, UserCheck, Target, Award, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuthProfile } from "@/features/auth/hooks/useAuthProfile";
import { SOLUTIONS_PERSONAS, PersonaId } from "@/features/marketing/data/solutions.data";

export function SolutionsPersonaTabs() {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const [selectedId, setSelectedId] = useState<PersonaId>("student");
  const tabRefs = useRef<Record<PersonaId, HTMLButtonElement | null>>({
    student: null,
    seeker: null,
    professional: null,
  });

  const isAuthenticated = !!profile;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentId: PersonaId) => {
      const keys = SOLUTIONS_PERSONAS.map((p) => p.id);
      const currentIndex = keys.indexOf(currentId);
      let nextIndex = currentIndex;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % keys.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + keys.length) % keys.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = keys.length - 1;
      } else {
        return;
      }

      const nextId = keys[nextIndex];
      setSelectedId(nextId);
      tabRefs.current[nextId]?.focus();
    },
    []
  );

  const activeConfig = SOLUTIONS_PERSONAS.find((p) => p.id === selectedId) || SOLUTIONS_PERSONAS[0];

  const getCtaHref = (action: "cv" | "jobs" | "interview"): string => {
    if (!isAuthenticated) return "/signup";
    switch (action) {
      case "cv":
        return "/dashboard/cvs";
      case "jobs":
        return "/dashboard/jobs";
      case "interview":
        return "/interview/select";
      default:
        return "/signup";
    }
  };

  const getPersonaIcon = (id: PersonaId) => {
    switch (id) {
      case "student":
        return <UserCheck className="w-5 h-5 text-[#204195]" />;
      case "seeker":
        return <Target className="w-5 h-5 text-[#204195]" />;
      case "professional":
        return <Award className="w-5 h-5 text-[#204195]" />;
    }
  };

  return (
    <div className="w-full">
      {/* Accessible Tab Navigation Header */}
      <div
        role="tablist"
        aria-label={t("solutions.persona.title")}
        className="flex flex-wrap justify-center gap-2 md:gap-3 p-1.5 bg-[#F7F9FD] border border-[#DCE4F3] rounded-[20px] max-w-2xl mx-auto mb-10"
      >
        {SOLUTIONS_PERSONAS.map((persona) => {
          const isSelected = selectedId === persona.id;
          return (
            <button
              key={persona.id}
              ref={(el) => {
                tabRefs.current[persona.id] = el;
              }}
              role="tab"
              id={`persona-tab-${persona.id}`}
              aria-selected={isSelected}
              aria-controls={`persona-panel-${persona.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedId(persona.id)}
              onKeyDown={(e) => handleKeyDown(e, persona.id)}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-[14px] text-sm md:text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#204195] focus-visible:outline-offset-2 ${
                isSelected
                  ? "bg-white text-[#14244B] shadow-sm border border-[#DCE4F3]"
                  : "text-[#607096] hover:text-[#14244B] hover:bg-white/50"
              }`}
            >
              {getPersonaIcon(persona.id)}
              <span>{t(persona.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeConfig.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          role="tabpanel"
          id={`persona-panel-${activeConfig.id}`}
          aria-labelledby={`persona-tab-${activeConfig.id}`}
          tabIndex={0}
          className="focus-visible:outline-none"
        >
          <div className="bg-white border border-[#DCE4F3] rounded-[26px] p-6 md:p-10 shadow-[0_10px_34px_rgba(32,65,149,0.045)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Situation & Workflow */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#EEF3FC] text-[#204195] text-xs font-bold rounded-full uppercase tracking-wider">
                  {t(activeConfig.badgeKey)}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-[#14244B] tracking-tight">
                {t(activeConfig.titleKey)}
              </h3>

              <div className="space-y-3 bg-[#F7F9FD] p-5 rounded-[18px] border border-[#DCE4F3]">
                <p className="text-sm md:text-base text-[#14244B] font-medium">
                  {t(activeConfig.situationKey)}
                </p>
                <p className="text-sm md:text-base text-[#506085]">
                  {t(activeConfig.problemKey)}
                </p>
              </div>

              {/* Recommended 3-Step Workflow */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#607096] uppercase tracking-wider">
                  Recommended Workflow
                </h4>
                <div className="space-y-3">
                  {activeConfig.stepKeys.map((stepKey, idx) => (
                    <div
                      key={stepKey}
                      className="flex items-start gap-3 bg-white p-3.5 rounded-[14px] border border-[#DCE4F3] shadow-xs"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#204195] text-white text-xs font-bold flex items-center justify-center">
                        0{idx + 1}
                      </span>
                      <p className="text-sm text-[#14244B] pt-0.5 font-medium leading-snug">
                        {t(stepKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Capabilities & CTA */}
            <div className="lg:col-span-5 bg-[#F7F9FD] border border-[#DCE4F3] rounded-[22px] p-6 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#204195] font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-[#FCB625]" />
                  <span>Key Verified Capabilities</span>
                </div>

                <div className="space-y-3">
                  {activeConfig.capabilityKeys.map((capKey) => (
                    <div key={capKey} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#204195] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[#14244B] font-medium">
                        {t(capKey)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[#DCE4F3]">
                <Link
                  href={getCtaHref(activeConfig.action)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#204195] hover:bg-[#14244B] text-white font-semibold px-6 py-3.5 rounded-[14px] transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-[#204195] focus-visible:outline-offset-2"
                >
                  <span>{t(activeConfig.ctaKey)}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
