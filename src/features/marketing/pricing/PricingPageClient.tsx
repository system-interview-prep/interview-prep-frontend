"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
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
    <div className="relative min-h-screen bg-white text-[#14244B]">
      {/* Background radial highlight */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(32,65,149,0.06),transparent_70%)]" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* HERO SECTION */}
        <section className="mb-14 text-center">
          <MarketingSectionHeader
            as="h1"
            eyebrow={t("pricing.eyebrow")}
            title={`${t("pricing.heroTitleA")} ${t("pricing.heroTitleB")}`}
            description={t("pricing.heroDescription")}
            align="center"
          />

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#plans"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#204195] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#183275] active:scale-[0.98]"
            >
              {t("pricing.heroPrimary")}
              <ArrowRight className="size-4" />
            </a>

            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#DCE4F3] bg-white px-6 text-sm font-bold text-[#14244B] transition-colors hover:bg-[#F7F9FD]"
            >
              {t("pricing.heroSecondary")}
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#607096]">
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
        </section>

        {/* PLANS SECTION */}
        <section id="plans" className="mb-20 scroll-mt-20">
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
        </section>

        {/* COMPARISON MATRIX */}
        <section className="mb-20">
          <PricingComparison />
        </section>

        {/* PAYMENT GUARANTEE CARDS */}
        <section className="mb-20">
          <MarketingSectionHeader
            eyebrow={t("pricing.paymentEyebrow")}
            title={t("pricing.paymentTitle")}
            description={t("pricing.paymentDescription")}
            align="center"
            className="mb-10"
          />

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[#DCE4F3] bg-white p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-[14px] bg-[#EEF3FC] text-[#204195]">
                <CreditCard className="size-5" />
              </div>
              <h4 className="mt-4 font-bold text-[#14244B]">
                {t("pricing.paymentCard1")}
              </h4>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#506085]">
                {t("pricing.paymentCard1Desc")}
              </p>
            </div>

            <div className="rounded-[22px] border border-[#DCE4F3] bg-white p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-[14px] bg-[#EEF3FC] text-[#204195]">
                <RefreshCcw className="size-5" />
              </div>
              <h4 className="mt-4 font-bold text-[#14244B]">
                {t("pricing.paymentCard2")}
              </h4>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#506085]">
                {t("pricing.paymentCard2Desc")}
              </p>
            </div>

            <div className="rounded-[22px] border border-[#DCE4F3] bg-white p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-[14px] bg-[#EEF3FC] text-[#204195]">
                <ShieldCheck className="size-5 text-emerald-600" />
              </div>
              <h4 className="mt-4 font-bold text-[#14244B]">
                {t("pricing.paymentCard3")}
              </h4>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#506085]">
                {t("pricing.paymentCard3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* COACH CALLOUT */}
        <section className="mb-20">
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
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section className="mb-20">
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
                      className="border-t border-[#EEF3FC] px-5 py-4 text-xs font-medium leading-relaxed text-[#506085]"
                    >
                      {t(faq.aKey)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM FINAL CTA */}
        <section>
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
        </section>
      </div>

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