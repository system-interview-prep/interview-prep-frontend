"use client";

import { useLanguage } from "@/i18n/LanguageProvider";

export default function PricingBillingToggle() {
  const { t } = useLanguage();

  return (
    <div className="flex w-full max-w-[860px] flex-col items-center justify-between gap-3 rounded-3xl bg-[#F7F9FD] px-5 py-4 text-center sm:flex-row sm:px-6 sm:text-left">
      <div>
        <p className="text-[12px] font-semibold text-[#204195]">
          {t("pricing.billingModel.eyebrow")}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#14244B]">
          {t("pricing.billingModel.title")}
        </p>
      </div>

      <p className="text-[13px] text-[#607096]">
        {t("pricing.noSubscription")}
        <span aria-hidden="true" className="mx-2">·</span>
        {t("pricing.noAutoRenew")}
        <span aria-hidden="true" className="mx-2">·</span>
        {t("pricing.renewAtWill")}
      </p>
    </div>
  );
}
