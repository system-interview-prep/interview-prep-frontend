"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuthProfile } from "@/features/auth/hooks/useAuthProfile";
import MarketingPageIntro from "@features/marketing/components/shared/MarketingPageIntro";
import { SolutionsPersonaTabs } from "./SolutionsPersonaTabs";
import CoachCallout from "../shared/CoachCallout";
import MarketingCTA from "../shared/MarketingCTA";

export function SolutionsPageClient() {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const isAuthenticated = !!profile;

  const coachCtaHref = isAuthenticated ? "/dashboard/cvs" : "/signup";
  const tryModesHref = isAuthenticated ? "/interview/select" : "/signup";

  const exampleBadge = (
    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#607096] ring-1 ring-[#DCE4F3]">
      {t("fixm.common.example")}
    </span>
  );

  const sectionTitle = "font-display text-[28px] font-semibold leading-tight tracking-tight text-[#14244B] sm:text-[34px] lg:text-[40px]";
  const sectionSubtitle = "mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[#607096]";

  const workflowSteps = [
    { title: t("solutions.workflow.step1Title"), desc: t("solutions.workflow.step1Desc") },
    { title: t("solutions.workflow.step2Title"), desc: t("solutions.workflow.step2Desc") },
    { title: t("solutions.workflow.step3Title"), desc: t("solutions.workflow.step3Desc") },
    { title: t("solutions.workflow.step4Title"), desc: t("solutions.workflow.step4Desc") },
  ];

  const modalities = (["chat", "voice", "video"] as const).map((key) => ({
    key,
    title: t(`solutions.modalities.${key}.title`),
    desc: t(`solutions.modalities.${key}.desc`),
    features: [1, 2, 3].map((n) => t(`solutions.modalities.${key}.feature${n}`)),
  }));

  return (
    <div className="w-full bg-[#F7F9FD] text-[#14244B] antialiased">
      {/* ============================================================ */}
      {/* SECTION 01: HERO                                              */}
      {/* ============================================================ */}
      <section className="px-4 pb-12 pt-6 sm:px-8 sm:pb-14 sm:pt-10 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingPageIntro
            title={`${t("solutions.hero.titlePlain")} ${t("solutions.hero.titleGradient")}`}
            body={t("solutions.hero.subtitle")}
            aside={
              <div className="rounded-3xl bg-white/90 p-5 sm:p-6">
                <p className="text-sm font-semibold text-[#14244B]">{t("uxm.solutions.asideTitle")}</p>
                <ol className="mt-3 divide-y divide-[#DCE4F3]">
                  {[t("solutions.hero.badgeCv"), t("solutions.hero.badgeTarget"), t("solutions.hero.badgePractice")].map((label, idx) => (
                    <li key={idx} className="flex items-center gap-3 py-3">
                      <span className="font-display text-lg font-semibold text-[#204195]">{idx + 1}</span>
                      <span className="text-sm font-semibold text-[#14244B]">{label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            }
          >
            <a
              href="#persona-section"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
            >
              {t("solutions.hero.primaryCta")}
            </a>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#F7F9FD] px-5 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#EEF3FC]"
            >
              {t("solutions.hero.secondaryCta")}
            </Link>
          </MarketingPageIntro>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 02: PERSONA SOLUTION FIT                              */}
      {/* ============================================================ */}
      <section id="persona-section" className="scroll-mt-20 bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className={sectionTitle}>{t("solutions.persona.title")}</h2>
            <p className={sectionSubtitle}>{t("solutions.persona.subtitle")}</p>
          </div>

          <SolutionsPersonaTabs />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 03: CV → ROLE → EVIDENCE WORKFLOW                     */}
      {/* ============================================================ */}
      <section className="px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className={sectionTitle}>{t("solutions.workflow.title")}</h2>
            <p className={sectionSubtitle}>{t("solutions.workflow.subtitle")}</p>
          </div>

          <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, idx) => (
              <li key={idx} className="rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3]">
                <span className="font-display text-2xl font-semibold text-[#204195]">0{idx + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-[#14244B]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#607096]">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 04: PRACTICE MODALITIES                               */}
      {/* ============================================================ */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className={sectionTitle}>{t("solutions.modalities.title")}</h2>
            <p className={sectionSubtitle}>{t("solutions.modalities.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {modalities.map((mode) => (
              <div key={mode.key} className="flex flex-col justify-between rounded-3xl bg-[#F7F9FD] p-7">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#14244B]">{mode.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#607096]">{mode.desc}</p>
                </div>

                <ul className="mt-6 space-y-2.5 border-t border-[#DCE4F3] pt-5">
                  {mode.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-[#14244B]">
                      <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#204195]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm">
            <Link href={tryModesHref} className="font-semibold text-[#204195] underline-offset-4 hover:underline">
              {t("uxm.solutions.tryModes")} →
            </Link>
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 05: STRUCTURED FEEDBACK & PROGRESS                    */}
      {/* ============================================================ */}
      <section className="px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className={sectionTitle}>{t("solutions.feedback.title")}</h2>
            <p className={sectionSubtitle}>{t("solutions.feedback.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Per-question rubric scoring */}
            <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3]">
              <h3 className="text-lg font-semibold text-[#14244B]">{t("solutions.feedback.scoringTitle")}</h3>
              <p className="text-sm leading-relaxed text-[#607096]">{t("solutions.feedback.scoringDesc")}</p>

              <div className="space-y-2 rounded-2xl bg-[#F7F9FD] p-4 text-[13px]">
                {exampleBadge}
                <div className="flex items-center justify-between gap-3 font-semibold text-[#14244B]">
                  <span>{t("uxm.solutions.fb.relevance")}</span>
                  <span className="shrink-0 text-[#204195]">85%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full w-[85%] rounded-full bg-[#204195]"></div>
                </div>
              </div>
            </div>

            {/* Strengths & gaps */}
            <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3]">
              <h3 className="text-lg font-semibold text-[#14244B]">{t("solutions.feedback.strengthsTitle")}</h3>
              <p className="text-sm leading-relaxed text-[#607096]">{t("solutions.feedback.strengthsDesc")}</p>

              <div className="space-y-2 text-[13px]">
                {exampleBadge}
                <p className="rounded-2xl bg-[#287A4B]/10 p-3 font-medium text-[#14244B]">
                  {t("uxm.solutions.fb.strength")}
                </p>
                <p className="rounded-2xl bg-[#FCB625]/15 p-3 font-medium text-[#14244B]">
                  {t("uxm.solutions.fb.gap")}
                </p>
              </div>
            </div>

            {/* Readiness & progress */}
            <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3]">
              <h3 className="text-lg font-semibold text-[#14244B]">{t("solutions.feedback.progressTitle")}</h3>
              <p className="text-sm leading-relaxed text-[#607096]">{t("solutions.feedback.progressDesc")}</p>

              <div className="space-y-2 rounded-2xl bg-[#F7F9FD] p-4 text-[13px]">
                {exampleBadge}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[#14244B]">{t("uxm.solutions.fb.growth")}</span>
                  <span className="shrink-0 font-semibold text-[#287A4B]">+8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 06: INTERVIA COACH CALLOUT                           */}
      {/* ============================================================ */}
      <section className="px-4 pb-12 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <CoachCallout
            eyebrow={t("solutions.coach.eyebrow")}
            title={t("solutions.coach.title")}
            description={t("solutions.coach.subtitle")}
            ctaText={t("solutions.coach.primaryCta")}
            ctaHref={coachCtaHref}
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 07: FINAL CTA                                         */}
      {/* ============================================================ */}
      <section className="px-4 pb-16 pt-4 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingCTA
            eyebrow={t("solutions.cta.eyebrow")}
            title={t("solutions.cta.title")}
            description={t("solutions.cta.subtitle")}
            primaryCtaText={t("solutions.cta.primary")}
            primaryCtaHref="/signup"
            secondaryCtaText={t("solutions.cta.secondary")}
            secondaryCtaHref="/pricing"
          />
        </div>
      </section>
    </div>
  );
}
