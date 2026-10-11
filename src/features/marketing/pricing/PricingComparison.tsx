"use client";

import React from "react";
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

      <div className="overflow-x-auto rounded-3xl bg-white p-2 ring-1 ring-[#DCE4F3] sm:p-4">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#DCE4F3]">
              <th className="py-4 px-4 text-[13px] font-semibold text-[#607096]">
                {t("pricing.feature")}
              </th>
              {PRICING_PLANS.map((plan) => (
                <th
                  key={plan.id}
                  className="py-4 px-4 text-center text-sm font-semibold text-[#14244B]"
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
                className="border-b border-[#EEF3FC] transition-colors last:border-0 hover:bg-[#F7F9FD]"
              >
                <td className="py-3.5 px-4 text-[13px] font-medium text-[#14244B]">
                  {t(row.labelKey)}
                </td>

                {/* Starter */}
                <td className="py-3.5 px-4 text-center text-[13px] text-[#607096]">
                  {renderCellContent(t(row.starterValueKey), t)}
                </td>

                {/* Pro */}
                <td className="bg-[#F0F4FC]/40 py-3.5 px-4 text-center text-[13px] font-semibold text-[#14244B]">
                  {renderCellContent(t(row.proValueKey), t)}
                </td>

                {/* Flex */}
                <td className="py-3.5 px-4 text-center text-[13px] text-[#607096]">
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
      <span className="font-semibold text-[#287A4B]">
        <span aria-hidden="true">✓</span>
        <span className="sr-only">{val}</span>
      </span>
    );
  }
  return val;
}
