"use client";

import React from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { PricingPlan, formatVnd } from "../data/pricing.data";

interface PricingPlanCardProps {
  plan: PricingPlan;
  onSelect: (planId: PricingPlan["id"]) => void;
}

export default function PricingPlanCard({
  plan,
  onSelect,
}: PricingPlanCardProps) {
  const { t } = useLanguage();

  const formattedPrice = formatVnd(plan.price);

  const featured = plan.featured;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl p-6 transition-shadow duration-300 sm:p-7 ${
        featured
          ? "bg-[#204195] text-white shadow-[0_28px_60px_-34px_rgba(20,36,75,0.95)]"
          : "bg-white ring-1 ring-[#DCE4F3] hover:shadow-[0_22px_44px_-28px_rgba(20,36,75,0.5)]"
      }`}
    >
      <div>
        {featured && (
          <p className="mb-4 inline-flex rounded-full bg-[#FCB625] px-3 py-1 text-[12px] font-semibold text-[#14244B]">
            {t("pricing.recommended")}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <h3 className={`font-display text-2xl font-semibold tracking-tight ${featured ? "text-white" : "text-[#14244B]"}`}>
            {t(plan.nameKey)}
          </h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              featured ? "bg-white/10 text-white/80" : "bg-[#F7F9FD] text-[#607096]"
            }`}
          >
            {t(plan.periodKey)}
          </span>
        </div>

        <p className={`mt-3 text-sm leading-relaxed ${featured ? "text-white/75" : "text-[#607096]"}`}>
          {t(plan.descKey)}
        </p>

        <div className="mt-5 flex items-baseline gap-1">
          <span className={`text-3xl font-bold sm:text-4xl ${featured ? "text-white" : "text-[#14244B]"}`}>
            {formattedPrice}
          </span>
          <span className={`text-sm font-semibold ${featured ? "text-white/60" : "text-[#607096]"}`}>đ</span>
        </div>

        <hr className={`my-6 ${featured ? "border-white/10" : "border-[#DCE4F3]"}`} />

        <ul className="space-y-3">
          {plan.featureKeys.map((featureKey, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${featured ? "bg-[#FCB625]" : "bg-[#204195]"}`}
              />
              <span className={`text-sm ${featured ? "text-white/85" : "text-[#14244B]"}`}>
                {t(featureKey)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        aria-haspopup="dialog"
        className={`mt-8 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition-colors ${
          featured
            ? "bg-[#FCB625] text-[#14244B] hover:bg-[#E5A21D]"
            : "bg-[#F7F9FD] text-[#14244B] hover:bg-[#EEF3FC]"
        }`}
      >
        {t("fixm.pricing.planCta")}
      </button>
    </div>
  );
}
