"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Copy, QrCode, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { BankConfig, PricingPlan, formatVnd } from "../data/pricing.data";

interface VietQrModalProps {
  plan: PricingPlan | null;
  bankConfig: BankConfig;
  isOpen: boolean;
  onClose: () => void;
}

export default function VietQrModal({
  plan,
  bankConfig,
  isOpen,
  onClose,
}: VietQrModalProps) {
  const { t } = useLanguage();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "demo-complete">("idle");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset modal state on open or plan change
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setStatus("idle");
      setCopiedField(null);

      // Focus modal container after render
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, [isOpen, plan?.id]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  const transferNote = bankConfig.getTransferNote(plan.id);
  const formattedPrice = formatVnd(plan.price);

  const handleCopy = (text: string, field: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(field);

    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmTransfer = () => {
    setStatus("checking");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus("demo-complete");
    }, 1800);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/60 p-4 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vietqr-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-[26px] border border-[#DCE4F3] bg-white p-6 shadow-2xl outline-none animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          aria-label={t("pricing.close")}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-[#F7F9FD] text-[#607096] transition-colors hover:bg-[#EEF3FC] hover:text-[#14244B]"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#204195]">
          <QrCode className="size-4" />
          {t("pricing.modalBadge")}
        </div>

        <h3 id="vietqr-modal-title" className="mt-2 text-xl font-bold text-[#14244B]">
          {t("pricing.modalTitle")} {t(plan.nameKey)}
        </h3>

        <p className="mt-1 text-xs text-[#506085]">
          {t("pricing.modalDescription")}
        </p>

        {/* QR Code Graphic Box with DEMO / PLACEHOLDER label */}
        <div className="my-5 flex flex-col items-center justify-center rounded-[20px] border border-[#DCE4F3] bg-[#F7F9FD] p-5">
          <div className="relative grid size-48 place-items-center rounded-xl bg-white p-3 shadow-inner border border-[#DCE4F3]">
            {/* Visual VietQR placeholder / QR image */}
            <div className="flex flex-col items-center justify-center gap-2 text-center text-[#204195]">
              <span className="rounded-md bg-[#FCB625] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#14244B]">
                DEMO / PLACEHOLDER
              </span>
              <QrCode className="size-16 opacity-70" />
              <span className="font-mono text-[10px] font-bold">
                VIETQR · {formattedPrice} đ
              </span>
            </div>
          </div>

          <span className="mt-3 text-center text-[11px] font-medium text-[#607096] max-w-xs">
            {t("pricing.qrWording")}
          </span>

          <span className="mt-1 text-center text-[11px] font-semibold text-[#14244B]">
            {bankConfig.bankName} — {bankConfig.accountHolder}
          </span>
        </div>

        {/* Details Copy Box */}
        <div className="space-y-2.5 rounded-[16px] bg-[#F7F9FD] p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#607096]">{t("pricing.bank")}:</span>
            <span className="font-bold text-[#14244B]">{bankConfig.bankName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-[#607096]">{t("pricing.account")}:</span>
            <button
              onClick={() => handleCopy(bankConfig.accountNumber, "account")}
              className="inline-flex items-center gap-1.5 font-mono font-bold text-[#204195] hover:underline"
            >
              {bankConfig.accountNumber}
              {copiedField === "account" ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-[#607096]">{t("pricing.content")}:</span>
            <button
              onClick={() => handleCopy(transferNote, "content")}
              className="inline-flex items-center gap-1.5 font-mono font-bold text-[#204195] hover:underline"
            >
              {transferNote}
              {copiedField === "content" ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-center font-medium leading-normal text-[#8090B5]">
          {t("pricing.demoNoticeText")}
        </p>

        <div className="mt-5 flex gap-3">
          {status === "idle" && (
            <button
              onClick={handleConfirmTransfer}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#204195] text-xs font-bold text-white shadow-sm transition-all hover:bg-[#183275]"
            >
              <ShieldCheck className="size-4" />
              {t("pricing.transferred")}
            </button>
          )}

          {status === "checking" && (
            <div className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#EEF3FC] text-xs font-bold text-[#204195]">
              <div className="size-4 animate-spin rounded-full border-2 border-[#204195] border-t-transparent" />
              {t("pricing.checking")}
            </div>
          )}

          {status === "demo-complete" && (
            <div className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-blue-50 text-xs font-bold text-blue-700 border border-blue-200">
              <CheckCircle2 className="size-4 text-blue-600" />
              {t("pricing.demoComplete")}
            </div>
          )}

          <button
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-[14px] border border-[#DCE4F3] bg-white px-4 text-xs font-bold text-[#14244B] hover:bg-[#F7F9FD]"
          >
            {t("pricing.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
