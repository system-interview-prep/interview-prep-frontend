"use client";

import React from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { PRICING_COMPARISON_ROWS, PRICING_PLANS } from "../data/pricing.data";
import MarketingSectionHeader from "../components/shared/MarketingSectionHeader";

export default function PricingComparison() {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      <MarketingSectionHeader
        eyebrow={t("pricing.compareEyebrow")}
        title={t("pricing.compareTitle")}
        description={t("pricing.compareDescription")}
        align="center"
        className="mb-10"
      />

      <div className="overflow-x-auto rounded-[26px] border border-[#DCE4F3] bg-white p-2 shadow-sm sm:p-4">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EEF3FC]">
              <th className="py-4 px-4 font-mono text-xs font-bold uppercase tracking-wider text-[#607096]">
                {t("pricing.feature")}
              </th>
              {PRICING_PLANS.map((plan) => (
                <th
                  key={plan.id}
                  className="py-4 px-4 text-center font-bold text-sm text-[#14244B]"
                >
                  {t(plan.nameKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_COMPARISON_ROWS.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#F7F9FD] transition-colors hover:bg-[#F7F9FD]/50"
              >
                <td className="py-3.5 px-4 text-xs font-semibold text-[#14244B]">
                  {t(row.labelKey)}
                </td>

                {/* Starter */}
                <td className="py-3.5 px-4 text-center text-xs text-[#506085]">
                  {renderCellContent(t(row.starterValueKey), t)}
                </td>

                {/* Pro */}
                <td className="py-3.5 px-4 text-center text-xs font-bold text-[#204195]">
                  {renderCellContent(t(row.proValueKey), t)}
                </td>

                {/* Flex */}
                <td className="py-3.5 px-4 text-center text-xs text-[#506085]">
                  {renderCellContent(t(row.flexValueKey), t)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderCellContent(val: string, t: (key: string) => string) {
  if (val === t("pricing.included")) {
    return (
      <span className="inline-grid size-5 place-items-center rounded-full bg-[#EEF3FC] text-[#204195] mx-auto">
        <Check className="size-3.5 stroke-[3]" />
      </span>
    );
  }
  return val;
}
