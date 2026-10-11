"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";
import MarketingPageIntro from "@features/marketing/components/shared/MarketingPageIntro";
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
  formatVnd,
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
    <div className="w-full bg-[#F7F9FD] text-[#14244B] antialiased">
      {/* ============================================================ */}
      {/* SECTION 01: HERO                                              */}
      {/* ============================================================ */}
      <section className="px-4 pb-12 pt-6 sm:px-8 sm:pb-14 sm:pt-10 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingPageIntro
            title={`${t("pricing.heroTitleA")} ${t("pricing.heroTitleB")}`}
            body={t("pricing.heroDescription")}
            aside={
              <div className="rounded-3xl bg-white/90 p-5 sm:p-6">
                <p className="text-sm font-semibold text-[#14244B]">{t("uxm.pricing.asideTitle")}</p>
                <ul className="mt-3 divide-y divide-[#DCE4F3]">
                  {PRICING_PLANS.map((plan) => (
                    <li key={plan.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#14244B]">{t(plan.nameKey)}</span>
                        {plan.featured && (
                          <span className="block text-[12px] font-semibold text-[#204195]">{t("pricing.recommended")}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[#14244B]">
                        {formatVnd(plan.price)} đ
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            }
          >
            <a
              href="#plans"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
            >
              {t("pricing.heroPrimary")}
            </a>
            <a
              href="#compare"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#EEF3FC]"
            >
              {t("pricing.heroSecondary")}
            </a>
          </MarketingPageIntro>

          <p className="mt-5 text-center text-[13px] text-[#607096]">
            {t("pricing.noCard")}
            <span aria-hidden="true" className="mx-2">·</span>
            {t("pricing.noRenew")}
            <span aria-hidden="true" className="mx-2">·</span>
            {t("pricing.activate")}
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 02: PLANS LIST                                        */}
      {/* ============================================================ */}
      <section id="plans" className="scroll-mt-20 bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <p
            role="note"
            className="mx-auto mb-8 max-w-3xl rounded-2xl border border-[#FCB625]/50 bg-[#FCB625]/10 px-4 py-3 text-center text-sm font-medium text-[#14244B]"
          >
            {t("pricing.demoBanner")}
          </p>
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="font-display text-[28px] font-semibold tracking-tight text-[#14244B] sm:text-[34px] lg:text-[40px]">
              {t("fixm.pricing.plansTitle")}
            </h2>
          </div>

          <div className="mb-8 flex justify-center">
            <PricingBillingToggle />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
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
      <section id="compare" className="scroll-mt-20 bg-[#F7F9FD] px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <PricingComparison />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 04: PAYMENT GUARANTEE CARDS                         */}
      {/* ============================================================ */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("pricing.paymentEyebrow")}
            title={t("pricing.paymentTitle")}
            description={t("pricing.paymentDescription")}
            align="center"
            className="mb-10"
          />

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { title: t("pricing.paymentCard1"), desc: t("pricing.paymentCard1Desc") },
              { title: t("pricing.paymentCard2"), desc: t("pricing.paymentCard2Desc") },
              { title: t("pricing.paymentCard3"), desc: t("pricing.paymentCard3Desc") },
            ].map((card, idx) => (
              <div key={card.title} className="rounded-3xl bg-[#F7F9FD] p-7">
                <span className="font-display text-lg font-semibold text-[#204195]">0{idx + 1}</span>
                <h3 className="mt-2 text-[17px] font-semibold leading-6 text-[#14244B]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#607096]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 05: COACH CALLOUT                                    */}
      {/* ============================================================ */}
      <section className="px-4 py-12 sm:px-8 lg:px-10 xl:px-12">
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
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("pricing.faqEyebrow")}
            title={t("pricing.faqTitle")}
            align="center"
            className="mb-10"
          />

          <div className="mx-auto max-w-3xl space-y-3">
            {PRICING_FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              const headerId = `pricing-faq-header-${faq.id}`;
              const panelId = `pricing-faq-panel-${faq.id}`;

              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-3xl bg-[#F7F9FD]"
                >
                  <button
                    id={headerId}
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold text-[#14244B] transition-colors hover:bg-[#EEF3FC]"
                  >
                    <span>{t(faq.qKey)}</span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-[#607096] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="px-5 pb-5 text-sm leading-6 text-[#607096]"
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
      <section className="px-4 py-12 sm:px-8 sm:py-16 lg:px-10 xl:px-12">
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