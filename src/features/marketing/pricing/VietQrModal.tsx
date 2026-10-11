"use client";

import React from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { BankConfig, PricingPlan, formatVnd } from "../data/pricing.data";

interface VietQrModalProps {
  plan: PricingPlan | null;
  /** Kept for callers; bank details are not shown while payments are closed. */
  bankConfig: BankConfig;
  isOpen: boolean;
  onClose: () => void;
}

export default function VietQrModal({
  plan,
  isOpen,
  onClose,
}: VietQrModalProps) {
  const { t } = useLanguage();

  const modalRef = useDialogA11y<HTMLDivElement>(isOpen && !!plan, onClose);

  if (!isOpen || !plan) return null;

  const formattedPrice = formatVnd(plan.price);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/45 p-4 backdrop-blur-[2px]"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vietqr-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(20,36,75,0.45)] outline-none animate-in fade-in zoom-in-95 duration-200 sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("pricing.close")}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-[#F7F9FD] text-[#607096] transition-colors hover:bg-[#EEF3FC] hover:text-[#14244B]"
        >
          <X className="size-4" />
        </button>

        <p className="pr-10 text-[12px] font-semibold text-[#204195]">
          {t("pricing.modalBadge")}
        </p>

        <h3 id="vietqr-modal-title" className="mt-1.5 font-display text-2xl font-semibold text-[#14244B]">
          {t("pricing.modalTitle")} {t(plan.nameKey)}
        </h3>

        <p className="mt-1.5 text-sm text-[#607096]">
          {t("pricing.modalDescription")}
        </p>

        {/* Payments are not open: show the planned price only, never bank details. */}
        <div className="my-5 rounded-2xl bg-[#F7F9FD] p-5 text-center">
          <p className="text-2xl font-bold text-[#14244B]">{formattedPrice} đ</p>
          <p className="mt-1 text-xs text-[#607096]">{t(plan.nameKey)}</p>
        </div>

        <div
          role="note"
          className="rounded-2xl border border-[#FCB625]/50 bg-[#FCB625]/10 p-4 text-[13px] leading-5 text-[#14244B]"
        >
          <span>
            <strong className="block">{t("pricing.demoComplete")}</strong>
            {t("pricing.demoNoticeText")}
          </span>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
          >
            {t("pricing.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
