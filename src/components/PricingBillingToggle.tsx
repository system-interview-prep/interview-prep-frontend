"use client";

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";

export default function PricingBillingToggle() {
  const { t } = useLanguage();
  const [annual, setAnnual] = useState(true);

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
      <span
        className={`text-sm font-bold transition-colors ${!annual ? "text-on-surface" : "text-on-surface-variant"}`}
      >
        {t("pricing.billing.monthly")}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        aria-label={annual ? t("pricing.billing.annual") : t("pricing.billing.monthly")}
        onClick={() => setAnnual((v) => !v)}
        className="relative w-14 h-7 shrink-0 bg-surface-container-highest rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span
          className={`absolute top-1 block h-5 w-5 rounded-full bg-primary transition-all duration-200 ${
            annual ? "right-1" : "left-1"
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-bold transition-colors ${annual ? "text-on-surface" : "text-on-surface-variant"}`}
        >
          {t("pricing.billing.annual")}
        </span>
        <span className="bg-tertiary-container text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {t("pricing.billing.save")}
        </span>
      </div>
    </div>
  );
}
