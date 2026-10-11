"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <div className="w-full">
      {/* Accessible tab navigation */}
      <div
        role="tablist"
        aria-label={t("solutions.persona.title")}
        className="mx-auto mb-10 flex max-w-2xl flex-wrap justify-center gap-1.5 rounded-full bg-[#F7F9FD] p-1.5 max-sm:rounded-3xl"
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
              className={`min-w-[140px] flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204195] md:text-[15px] ${
                isSelected
                  ? "bg-white text-[#14244B] shadow-[0_4px_14px_-10px_rgba(20,36,75,0.5)]"
                  : "text-[#607096] hover:bg-white/60 hover:text-[#14244B]"
              }`}
            >
              {t(persona.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Tab panel */}
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
          <div className="grid grid-cols-1 items-start gap-8 rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3] md:p-10 lg:grid-cols-12">
            {/* Situation & workflow */}
            <div className="space-y-6 lg:col-span-7">
              <p className="text-[12px] font-semibold text-[#204195]">
                {t(activeConfig.badgeKey)}
              </p>

              <h3 className="-mt-3 font-display text-2xl font-semibold tracking-tight text-[#14244B] md:text-3xl">
                {t(activeConfig.titleKey)}
              </h3>

              <div className="space-y-2 rounded-2xl bg-[#F7F9FD] p-5">
                <p className="text-sm font-medium text-[#14244B] md:text-base">
                  {t(activeConfig.situationKey)}
                </p>
                <p className="text-sm text-[#607096] md:text-base">
                  {t(activeConfig.problemKey)}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <h4 className="text-sm font-semibold text-[#14244B]">
                  {t("uxm.solutions.workflowLabel")}
                </h4>
                <ol className="space-y-2.5">
                  {activeConfig.stepKeys.map((stepKey, idx) => (
                    <li
                      key={stepKey}
                      className="flex items-start gap-3 rounded-2xl p-3.5 ring-1 ring-[#DCE4F3]"
                    >
                      <span className="w-6 shrink-0 font-display text-lg font-semibold leading-6 text-[#204195]">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium leading-6 text-[#14244B]">
                        {t(stepKey)}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Capabilities & CTA */}
            <div className="flex h-full flex-col justify-between space-y-6 rounded-3xl bg-[#F7F9FD] p-6 lg:col-span-5">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#14244B]">
                  {t("uxm.solutions.capabilitiesLabel")}
                </h4>

                <ul className="space-y-3">
                  {activeConfig.capabilityKeys.map((capKey) => (
                    <li key={capKey} className="flex items-start gap-2.5">
                      <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#204195]" />
                      <span className="text-sm font-medium text-[#14244B]">
                        {t(capKey)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#DCE4F3] pt-5">
                <Link
                  href={getCtaHref(activeConfig.action)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204195]"
                >
                  {t(activeConfig.ctaKey)}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
