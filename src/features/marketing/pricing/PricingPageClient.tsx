"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  Layers,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";
import PricingBillingToggle from "@/features/marketing/components/PricingBillingToggle";
import MarketingSectionHeader from "../components/shared/MarketingSectionHeader";
import MarketingCTA from "../components/shared/MarketingCTA";
import CoachCallout from "../components/shared/CoachCallout";
import PricingPlanCard from "./PricingPlanCard";
import PricingComparison from "./PricingComparison";
import VietQrModal from "./VietQrModal";
import {
  PAYMENT_BANK_CONFIG,
  PRICING_FAQS,
  PRICING_PLANS,
  PricingPlan,
} from "../data/pricing.data";

export default function PricingPageClient() {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  const handleSelectPlan = (planId: PricingPlan["id"]) => {
    const plan = PRICING_PLANS.find((p) => p.id === planId) || null;
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full bg-white text-[#14244B] antialiased">
      {/* ============================================================ */}
      {/* SECTION 01: HERO                                              */}
      {/* ============================================================ */}
      <section
        className="
          relative overflow-hidden
          px-5 pb-12 pt-8
          sm:px-8 sm:pb-14 sm:pt-10
          lg:px-10 lg:py-14
          xl:px-12 xl:py-16
        "
      >
        <div className="mx-auto w-full max-w-[1320px]">
          <div
            className="
              grid w-full items-center
              gap-10
              lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]
              lg:gap-4
              xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
              xl:gap-5
            "
          >
            {/* Left Column Copy */}
            <div className="relative z-20 max-w-[560px] text-left lg:pr-2">
              <span
                className="
                  inline-flex items-center gap-2
                  rounded-full
                  border border-[#C9D7F1]
                  bg-[#F7F9FD]/90
                  px-3.5 py-1.5
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.12em]
                  text-[#204195]
                  sm:text-[11px]
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#FCB625]" />
                {t("pricing.eyebrow")}
              </span>

              <h1
                className="
                  mt-5
                  max-w-[540px]
                  font-sans
                  text-[clamp(2.6rem,3.85vw,4.25rem)]
                  font-extrabold
                  leading-[0.99]
                  tracking-[-0.045em]
                  text-[#14244B]
                "
              >
                <span className="block">
                  {t("pricing.heroTitleA")}
                </span>

                <span className="relative mt-1.5 inline-block text-[#204195]">
                  {t("pricing.heroTitleB")}

                  <span
                    aria-hidden="true"
                    className="
                      absolute -bottom-1 left-0 -z-10
                      h-[0.12em] w-full
                      rounded-full
                      bg-[#FCB625]/30
                    "
                  />
                </span>
              </h1>

              <p
                className="
                  mt-5
                  max-w-[600px]
                  text-base
                  leading-7
                  text-[#607096]
                  sm:text-lg
                  sm:leading-8
                "
              >
                {t("pricing.heroDescription")}
              </p>

              <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="#plans"
                  className="inline-flex h-[52px] items-center justify-center gap-2 bg-[#204195] hover:bg-[#14244B] text-white font-extrabold px-7 rounded-[14px] transition-all shadow-md active:scale-[0.98] text-center"
                >
                  <span>{t("pricing.heroPrimary")}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  href="/signup"
                  className="inline-flex h-[52px] items-center justify-center gap-2 bg-white hover:bg-[#F7F9FD] text-[#14244B] font-extrabold px-7 rounded-[14px] border border-[#DCE4F3] transition-colors text-center"
                >
                  <span>{t("pricing.heroSecondary")}</span>
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-[#607096]">
                <span className="inline-flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-[#204195]" />
                  {t("pricing.noCard")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCcw className="size-3.5 text-[#204195]" />
                  {t("pricing.noRenew")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  {t("pricing.activate")}
                </span>
              </div>
            </div>

            {/* Right Visual: Pricing Tiers Card Flow */}
            <div className="relative">
              <div className="relative bg-[#F7F9FD] border border-[#DCE4F3] rounded-[26px] p-6 sm:p-8 shadow-[0_10px_34px_rgba(32,65,149,0.045)] space-y-4">
                {/* Starter Plan Highlights */}
                <div className="bg-white border border-[#DCE4F3] p-4.5 rounded-[18px] shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF3FC] text-[#204195] flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#607096] uppercase tracking-wider">STARTER PASS</span>
                      <h4 className="text-sm font-bold text-[#14244B]">Trải nghiệm phỏng vấn AI ngay</h4>
                      <p className="text-xs text-[#607096]">10 Lượt phỏng vấn • Phân tích CV cơ bản</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#EEF3FC] px-3 py-1 font-mono text-xs font-extrabold text-[#204195]">99.000đ</span>
                </div>

                {/* Arrow Connector */}
                <div className="flex justify-center my-0.5">
                  <div className="w-0.5 h-3 bg-[#DCE4F3]"></div>
                </div>

                {/* Pro Plan Highlights (Featured) */}
                <div className="bg-white border-2 border-[#204195]/30 p-4.5 rounded-[18px] shadow-sm flex items-center justify-between gap-4 bg-gradient-to-r from-white via-[#F7F9FD] to-[#FEF9EE]/60">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FCB625] text-[#14244B] flex items-center justify-center flex-shrink-0 shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#204195] uppercase tracking-wider">
                        <span>PRO PASS</span>
                        <span className="rounded bg-[#FCB625] px-1.5 py-0.5 text-[9px] text-[#14244B] font-extrabold">PHỔ BIẾN NHẤT</span>
                      </span>
                      <h4 className="text-sm font-bold text-[#14244B]">Luyện tập phỏng vấn không giới hạn</h4>
                      <p className="text-xs text-[#607096]">Full AI Sessions • Báo cáo STAR chuyên sâu</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#FCB625] px-3 py-1 font-mono text-xs font-extrabold text-[#14244B]">249.000đ</span>
                </div>

                {/* Arrow Connector */}
                <div className="flex justify-center my-0.5">
                  <div className="w-0.5 h-3 bg-[#DCE4F3]"></div>
                </div>

                {/* Flex Pass */}
                <div className="bg-white border border-[#DCE4F3] p-4.5 rounded-[18px] shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF3FC] text-[#204195] flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#607096] uppercase tracking-wider">FLEX PASS</span>
                      <h4 className="text-sm font-bold text-[#14244B]">Linh hoạt theo nhu cầu</h4>
                      <p className="text-xs text-[#607096]">Nạp thêm lượt theo từng đợt phỏng vấn</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#EEF3FC] px-3 py-1 font-mono text-xs font-extrabold text-[#204195]">149.000đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 02: PLANS LIST                                        */}
      {/* ============================================================ */}
      <section id="plans" className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3] scroll-mt-20">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#204195]">
              <Zap className="w-3.5 h-3.5" />
              {t("pricing.eyebrow")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#14244B] tracking-tight">
              {t("pricing.heroTitleA")} {t("pricing.heroTitleB")}
            </h2>
            <p className="text-base text-[#607096] leading-relaxed">
              {t("pricing.heroDescription")}
            </p>
          </div>

          <div className="mb-8 flex justify-center">
            <PricingBillingToggle />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <PricingPlanCard
                key={plan.id}
                plan={plan}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 03: COMPARISON MATRIX                                */}
      {/* ============================================================ */}
      <section className="bg-[#F7F9FD] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3]">
        <div className="mx-auto w-full max-w-[1320px]">
          <PricingComparison />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 04: PAYMENT GUARANTEE CARDS                         */}
      {/* ============================================================ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3]">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("pricing.paymentEyebrow")}
            title={t("pricing.paymentTitle")}
            description={t("pricing.paymentDescription")}
            align="center"
            className="mb-10"
          />

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-[26px] border border-[#DCE4F3] bg-white p-7 shadow-xs">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="mt-4 text-[17px] font-bold leading-6 text-[#14244B]">
                {t("pricing.paymentCard1")}
              </h4>
              <p className="mt-2 text-sm font-medium leading-6 text-[#607096]">
                {t("pricing.paymentCard1Desc")}
              </p>
            </div>

            <div className="rounded-[26px] border border-[#DCE4F3] bg-white p-7 shadow-xs">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <h4 className="mt-4 text-[17px] font-bold leading-6 text-[#14244B]">
                {t("pricing.paymentCard2")}
              </h4>
              <p className="mt-2 text-sm font-medium leading-6 text-[#607096]">
                {t("pricing.paymentCard2Desc")}
              </p>
            </div>

            <div className="rounded-[26px] border border-[#DCE4F3] bg-white p-7 shadow-xs">
              <div className="w-12 h-12 rounded-[16px] bg-[#EEF3FC] text-[#204195] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="mt-4 text-[17px] font-bold leading-6 text-[#14244B]">
                {t("pricing.paymentCard3")}
              </h4>
              <p className="mt-2 text-sm font-medium leading-6 text-[#607096]">
                {t("pricing.paymentCard3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 05: COACH CALLOUT                                    */}
      {/* ============================================================ */}
      <section className="px-5 py-10 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <CoachCallout
            eyebrow={t("pricing.coachEyebrow")}
            title={t("pricing.coachTitle")}
            description={t("pricing.coachDescription")}
            steps={[
              { num: "1", text: t("pricing.coachStarter") },
              { num: "2", text: t("pricing.coachPro") },
              { num: "3", text: t("pricing.coachFlex") },
            ]}
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 06: FAQ ACCORDION SECTION                            */}
      {/* ============================================================ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3]">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("pricing.faqEyebrow")}
            title={t("pricing.faqTitle")}
            align="center"
            className="mb-10"
          />

          <div className="mx-auto max-w-3xl space-y-4">
            {PRICING_FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              const headerId = `pricing-faq-header-${faq.id}`;
              const panelId = `pricing-faq-panel-${faq.id}`;

              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-[20px] border border-[#DCE4F3] bg-white shadow-sm transition-all"
                >
                  <button
                    id={headerId}
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between p-5 text-left font-bold text-[#14244B] transition-colors hover:bg-[#F7F9FD]"
                  >
                    <span>{t(faq.qKey)}</span>
                    <ChevronDown
                      className={`size-5 text-[#204195] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="border-t border-[#EEF3FC] px-5 py-4 text-sm font-medium leading-6 text-[#607096]"
                    >
                      {t(faq.aKey)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 07: BOTTOM FINAL CTA                                 */}
      {/* ============================================================ */}
      <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingCTA
            eyebrow={t("pricing.finalEyebrow")}
            title={t("pricing.finalTitle")}
            titleAccent={t("pricing.finalTitleAccent")}
            description={t("pricing.finalDescription")}
            primaryCtaText={t("pricing.finalPrimary")}
            primaryCtaHref="/signup"
            secondaryCtaText={t("pricing.finalSecondary")}
            secondaryCtaHref="/resources"
          />
        </div>
      </section>

      {/* VIETQR PAYMENT MODAL */}
      <VietQrModal
        plan={selectedPlan}
        bankConfig={PAYMENT_BANK_CONFIG}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}