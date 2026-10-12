"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
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

  return (
    <div
      className={`relative flex flex-col justify-between rounded-[26px] border p-6 transition-all duration-300 sm:p-7 ${
        plan.featured
          ? "scale-[1.02] border-[#204195] bg-white shadow-[0_16px_40px_rgba(32,65,149,0.12)]"
          : "border-[#DCE4F3] bg-white shadow-[0_8px_30px_rgba(32,65,149,0.03)] hover:border-[#B5C9EE]"
      }`}
    >
      {plan.featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#204195] px-4 py-1 text-xs font-bold text-white shadow-md">
            <Sparkles className="size-3 text-[#FCB625]" />
            {t("pricing.recommended")}
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-[#14244B]">
            {t(plan.nameKey)}
          </h3>
          <span className="rounded-full bg-[#F7F9FD] px-3 py-1 text-xs font-semibold text-[#506085]">
            {t(plan.periodKey)}
          </span>
        </div>

        <p className="mt-3 text-xs font-medium leading-relaxed text-[#607096]">
          {t(plan.descKey)}
        </p>

        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-3xl font-black text-[#14244B] sm:text-4xl">
            {formattedPrice}
          </span>
          <span className="text-sm font-bold text-[#607096]">đ</span>
        </div>

        <hr className="my-6 border-[#EEF3FC]" />

        <ul className="space-y-3">
          {plan.featureKeys.map((featureKey, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#EEF3FC] text-[#204195]">
                <Check className="size-3 stroke-[3]" />
              </span>
              <span className="text-xs font-semibold text-[#304068]">
                {t(featureKey)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onSelect(plan.id)}
        className={`mt-8 flex h-11 w-full items-center justify-center rounded-[14px] font-bold text-sm transition-all active:scale-[0.98] ${
          plan.featured
            ? "bg-[#204195] text-white shadow-md hover:bg-[#183275]"
            : "border border-[#DCE4F3] bg-[#F7F9FD] text-[#14244B] hover:bg-[#EEF3FC]"
        }`}
      >
        {t("pricing.choose")} {t(plan.nameKey)}
      </button>
    </div>
  );
}
