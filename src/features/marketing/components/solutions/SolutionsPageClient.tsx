"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Target,
  MessageSquare,
  Mic,
  Video,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GitCompare,
  Sparkles,
  BarChart3,
  Award,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuthProfile } from "@/features/auth/hooks/useAuthProfile";
import { SolutionsPersonaTabs } from "./SolutionsPersonaTabs";
import CoachCallout from "../shared/CoachCallout";
import MarketingCTA from "../shared/MarketingCTA";

export function SolutionsPageClient() {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const isAuthenticated = !!profile;

  const coachCtaHref = isAuthenticated ? "/dashboard/cvs" : "/signup";

  return (
    <div className="w-full bg-white text-[#14244B] antialiased">
      {/* ============================================================ */}
      {/* SECTION 01: HERO                                              */}
      {/* ============================================================ */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EEF3FC] border border-[#DCE4F3] text-xs font-mono font-bold uppercase tracking-wider text-[#204195]">
              <Sparkles className="w-3.5 h-3.5 fill-[#204195] text-[#204195]" />
              {t("solutions.hero.eyebrow")}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#14244B] leading-[1.1]">
              {t("solutions.hero.titlePlain")}
              <span className="bg-gradient-to-r from-[#204195] to-[#3B66D4] bg-clip-text text-transparent">
                {t("solutions.hero.titleGradient")}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#506085] leading-relaxed max-w-2xl font-normal">
              {t("solutions.hero.subtitle")}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#persona-section"
                className="inline-flex items-center justify-center gap-2 bg-[#204195] hover:bg-[#14244B] text-white font-bold px-7 py-3.5 rounded-[14px] transition-all shadow-sm active:scale-[0.98] text-center"
              >
                <span>{t("solutions.hero.primaryCta")}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F7F9FD] text-[#14244B] font-bold px-7 py-3.5 rounded-[14px] border border-[#DCE4F3] transition-colors text-center"
              >
                <span>{t("solutions.hero.secondaryCta")}</span>
              </Link>
            </div>
          </div>

          {/* Right Visual: CV -> Target Role -> Interview Practice Card Flow */}
          <div className="lg:col-span-5 relative">
            <div className="relative bg-[#F7F9FD] border border-[#DCE4F3] rounded-[26px] p-6 sm:p-8 shadow-[0_10px_34px_rgba(32,65,149,0.045)] space-y-4">
              {/* Step Card 1 */}
              <div className="bg-white border border-[#DCE4F3] p-4 rounded-[18px] shadow-xs flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEF3FC] text-[#204195] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-[#607096] uppercase">STEP 1</span>
                  <h4 className="text-sm font-bold text-[#14244B]">{t("solutions.hero.badgeCv")}</h4>
                  <p className="text-xs text-[#506085]">Parsed achievements & STAR evidence</p>
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center my-1">
                <div className="w-0.5 h-4 bg-[#DCE4F3]"></div>
              </div>

              {/* Step Card 2 */}
              <div className="bg-white border border-[#DCE4F3] p-4 rounded-[18px] shadow-xs flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEF3FC] text-[#204195] flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-[#607096] uppercase">STEP 2</span>
                  <h4 className="text-sm font-bold text-[#14244B]">{t("solutions.hero.badgeTarget")}</h4>
                  <p className="text-xs text-[#506085]">Job requirements & gap analysis</p>
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center my-1">
                <div className="w-0.5 h-4 bg-[#DCE4F3]"></div>
              </div>

              {/* Step Card 3 */}
              <div className="bg-white border-2 border-[#204195]/20 p-4 rounded-[18px] shadow-xs flex items-center gap-4 bg-gradient-to-r from-white to-[#EEF3FC]/50">
                <div className="w-10 h-10 rounded-xl bg-[#204195] text-white flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-[#204195] uppercase">STEP 3</span>
                  <h4 className="text-sm font-bold text-[#14244B]">{t("solutions.hero.badgePractice")}</h4>
                  <p className="text-xs text-[#506085]">Chat, Voice & Video simulations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 02: PERSONA SOLUTION FIT                              */}
      {/* ============================================================ */}
      <section id="persona-section" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-[#DCE4F3]">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#204195]">
            <Layers className="w-3.5 h-3.5" />
            {t("solutions.persona.eyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14244B] tracking-tight">
            {t("solutions.persona.title")}
          </h2>
          <p className="text-base text-[#506085] leading-relaxed">
            {t("solutions.persona.subtitle")}
          </p>
        </div>

        <SolutionsPersonaTabs />
      </section>

      {/* ============================================================ */}
      {/* SECTION 03: CV → ROLE → EVIDENCE WORKFLOW                     */}
      {/* ============================================================ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-[#DCE4F3] bg-[#F7F9FD] rounded-[30px] my-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#204195]">
            <GitCompare className="w-3.5 h-3.5" />
            {t("solutions.workflow.eyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14244B] tracking-tight">
            {t("solutions.workflow.title")}
          </h2>
          <p className="text-base text-[#506085] leading-relaxed">
            {t("solutions.workflow.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Workflow Card 1 */}
          <div className="bg-white border border-[#DCE4F3] p-6 rounded-[22px] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#14244B]">{t("solutions.workflow.step1Title")}</h3>
              <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.workflow.step1Desc")}</p>
            </div>
          </div>

          {/* Workflow Card 2 */}
          <div className="bg-white border border-[#DCE4F3] p-6 rounded-[22px] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#14244B]">{t("solutions.workflow.step2Title")}</h3>
              <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.workflow.step2Desc")}</p>
            </div>
          </div>

          {/* Workflow Card 3 */}
          <div className="bg-white border border-[#DCE4F3] p-6 rounded-[22px] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#14244B]">{t("solutions.workflow.step3Title")}</h3>
              <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.workflow.step3Desc")}</p>
            </div>
          </div>

          {/* Workflow Card 4 */}
          <div className="bg-white border border-[#DCE4F3] p-6 rounded-[22px] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#FCB625]" />
              </div>
              <h3 className="text-lg font-bold text-[#14244B]">{t("solutions.workflow.step4Title")}</h3>
              <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.workflow.step4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 04: PRACTICE MODALITIES                               */}
      {/* ============================================================ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-[#DCE4F3]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#204195]">
            <MessageSquare className="w-3.5 h-3.5" />
            {t("solutions.modalities.eyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14244B] tracking-tight">
            {t("solutions.modalities.title")}
          </h2>
          <p className="text-base text-[#506085] leading-relaxed">
            {t("solutions.modalities.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Modality 1: Chat */}
          <div className="bg-white border border-[#DCE4F3] rounded-[26px] p-7 shadow-[0_10px_34px_rgba(32,65,149,0.045)] space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#14244B]">{t("solutions.modalities.chat.title")}</h3>
              <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.modalities.chat.desc")}</p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-[#DCE4F3]">
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.chat.feature1")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.chat.feature2")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.chat.feature3")}</span>
              </div>
            </div>
          </div>

          {/* Modality 2: Voice */}
          <div className="bg-white border border-[#DCE4F3] rounded-[26px] p-7 shadow-[0_10px_34px_rgba(32,65,149,0.045)] space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#14244B]">{t("solutions.modalities.voice.title")}</h3>
              <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.modalities.voice.desc")}</p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-[#DCE4F3]">
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.voice.feature1")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.voice.feature2")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.voice.feature3")}</span>
              </div>
            </div>
          </div>

          {/* Modality 3: Video */}
          <div className="bg-white border border-[#DCE4F3] rounded-[26px] p-7 shadow-[0_10px_34px_rgba(32,65,149,0.045)] space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#14244B]">{t("solutions.modalities.video.title")}</h3>
              <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.modalities.video.desc")}</p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-[#DCE4F3]">
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.video.feature1")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.video.feature2")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#14244B] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#204195]" />
                <span>{t("solutions.modalities.video.feature3")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 05: STRUCTURED FEEDBACK & PROGRESS                    */}
      {/* ============================================================ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-[#DCE4F3]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#204195]">
            <Award className="w-3.5 h-3.5" />
            {t("solutions.feedback.eyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14244B] tracking-tight">
            {t("solutions.feedback.title")}
          </h2>
          <p className="text-base text-[#506085] leading-relaxed">
            {t("solutions.feedback.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Per-Question Rubric Scoring */}
          <div className="bg-[#F7F9FD] border border-[#DCE4F3] rounded-[26px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-3">
              <span className="font-mono text-xs font-bold text-[#204195]">RUBRIC EVALUATION</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Detailed
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#14244B]">{t("solutions.feedback.scoringTitle")}</h3>
            <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.feedback.scoringDesc")}</p>

            <div className="bg-white p-3.5 rounded-[14px] border border-[#DCE4F3] space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#14244B] font-semibold">
                <span>Relevance & STAR Structure</span>
                <span className="text-[#204195]">High Match</span>
              </div>
              <div className="w-full bg-[#EEF3FC] h-2 rounded-full overflow-hidden">
                <div className="bg-[#204195] h-full w-[85%] rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Card 2: Identified Strengths & Gaps */}
          <div className="bg-[#F7F9FD] border border-[#DCE4F3] rounded-[26px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-3">
              <span className="font-mono text-xs font-bold text-[#204195]">STRENGTHS & GAPS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                Actionable
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#14244B]">{t("solutions.feedback.strengthsTitle")}</h3>
            <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.feedback.strengthsDesc")}</p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-[12px] text-emerald-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Strong technical context and STAR situation framing.</span>
              </div>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-[12px] text-amber-900 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Add quantitative impact data to strengthen results.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Readiness & Progress Tracking */}
          <div className="bg-[#F7F9FD] border border-[#DCE4F3] rounded-[26px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-3">
              <span className="font-mono text-xs font-bold text-[#204195]">PROGRESS TRACKING</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EEF3FC] text-[#204195] text-[10px] font-bold">
                Continuous
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#14244B]">{t("solutions.feedback.progressTitle")}</h3>
            <p className="text-sm text-[#506085] leading-relaxed">{t("solutions.feedback.progressDesc")}</p>

            <div className="bg-white p-3.5 rounded-[14px] border border-[#DCE4F3] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#204195]" />
                <span className="font-bold text-[#14244B]">Session Competency Growth</span>
              </div>
              <span className="font-bold text-[#204195]">+STAR Refined</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 06: INTERVIA COACH CALLOUT                           */}
      {/* ============================================================ */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto">
        <CoachCallout
          eyebrow={t("solutions.coach.eyebrow")}
          title={t("solutions.coach.title")}
          description={t("solutions.coach.subtitle")}
          ctaText={t("solutions.coach.primaryCta")}
          ctaHref={coachCtaHref}
        />
      </section>

      {/* ============================================================ */}
      {/* SECTION 07: FINAL CTA                                         */}
      {/* ============================================================ */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto">
        <MarketingCTA
          eyebrow={t("solutions.cta.eyebrow")}
          title={t("solutions.cta.title")}
          description={t("solutions.cta.subtitle")}
          primaryCtaText={t("solutions.cta.primary")}
          primaryCtaHref="/signup"
          secondaryCtaText={t("solutions.cta.secondary")}
          secondaryCtaHref="/pricing"
        />
      </section>
    </div>
  );
}
