"use client";

/** A transparent replacement for recurring-billing controls. */
export default function PricingBillingToggle() {
  return (
    <div className="mx-auto flex w-fit items-center gap-3 border border-[#E8E6DC] bg-white px-4 py-2 text-left">
      <span className="flex h-5 w-5 items-center justify-center bg-[#EFF3EA] text-[#566844]" aria-hidden>
        <span className="material-symbols-outlined text-sm">verified</span>
      </span>
      <div>
        <p className="font-metadata text-[10px] text-[#87867F]">Thanh toán một lần</p>
        <p className="text-xs text-[#5E5D59]">Không gia hạn định kỳ, không tự động trừ tiền.</p>
      </div>
    </div>
  );
}
