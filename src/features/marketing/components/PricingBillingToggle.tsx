"use client";

import {
  BadgeCheck,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";

export default function PricingBillingToggle() {
  const { t } = useLanguage();

  return (
    <div
      className="
        flex w-full max-w-[860px]
        flex-col
        items-center
        justify-between
        gap-5

        rounded-[22px]
        border border-[#DCE4F3]
        bg-white
        px-5 py-4

        shadow-[0_10px_34px_rgba(32,65,149,0.045)]

        sm:flex-row
        sm:px-6
      "
    >
      <div className="flex items-center gap-3">
        <span
          className="
            grid h-11 w-11
            shrink-0
            place-items-center
            rounded-[14px]

            bg-[#EEF3FC]
            text-[#204195]
          "
        >
          <BadgeCheck className="size-[18px]" />
        </span>

        <div>
          <p
            className="
              font-mono
              text-[9px]
              font-extrabold
              uppercase
              tracking-[0.1em]
              text-[#204195]
            "
          >
            {t("pricing.billingModel.eyebrow")}
          </p>

          <p
            className="
              mt-1
              text-sm
              font-extrabold
              text-[#14244B]
            "
          >
            {t("pricing.billingModel.title")}
          </p>
        </div>
      </div>

      <div
        className="
          flex flex-wrap
          items-center
          justify-center
          gap-x-5
          gap-y-2

          text-[10px]
          font-semibold
          text-[#607096]

          sm:justify-end
        "
      >
        <span className="inline-flex items-center gap-1.5">
          <CreditCard className="size-3.5 text-[#204195]" />
          {t("pricing.noSubscription")}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <RefreshCcw className="size-3.5 text-[#204195]" />
          {t("pricing.noAutoRenew")}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-[#287A4B]" />
          {t("pricing.renewAtWill")}
        </span>
      </div>
    </div>
  );
}