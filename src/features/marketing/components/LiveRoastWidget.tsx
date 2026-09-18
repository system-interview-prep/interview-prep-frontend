"use client";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useState } from "react";

export function LiveRoastWidget() {
  const [optimized, setOptimized] = useState(false);
  return <div className="storybook-card relative overflow-hidden p-5 sm:p-7 lg:p-8">
    <span className="absolute -right-5 -top-5 h-24 w-24 rounded-full border-2 border-[#234196] bg-[#FCB625]" aria-hidden />
    <div className="relative flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-metadata text-[10px] font-bold text-[#5A6B8F]">Live roast · 01 bullet CV</p><h2 className="mt-1 font-headline text-2xl text-[#234196] sm:text-3xl">Từ “có làm” thành “có tác động”.</h2></div>
      <span className="sticker rotate-[2deg] bg-[#FEF9EE]"><Sparkles size={14} /> AI đang soi</span>
    </div>
    <div className="relative mt-7 grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border-2 border-dashed border-[#D32F2F] bg-[#FFEBEE] p-5">
        <span className="sticker -rotate-1 border-[#D32F2F] bg-white text-[#D32F2F]"><X size={14} /> Quá chung chung</span>
        <p className="mt-5 text-lg leading-8 text-[#5A6B8F] line-through decoration-2">Tham gia hỗ trợ quản lý dự án và làm báo cáo.</p>
        <p className="mt-5 font-metadata text-[10px] text-[#D32F2F]">Thiếu hành động · ngữ cảnh · con số</p>
      </article>
      <article className={`rounded-xl border-2 border-[#234196] p-5 transition-colors ${optimized ? "bg-[#E8F5E9]" : "bg-[#F0F4FC]"}`}>
        <span className="sticker rotate-[-1.5deg] bg-[#FCB625]"><Check size={14} /> Chuẩn ATS</span>
        <p className="mt-5 text-lg font-semibold leading-8 text-[#234196]">Điều phối sprint <span className="marker">8 kỹ sư</span> theo Scrum, bàn giao tính năng thanh toán đúng hạn <span className="marker">100%</span>.</p>
        <p className="mt-5 font-metadata text-[10px] text-[#2E7D32]">Action · Context · Metric</p>
      </article>
    </div>
    <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={() => setOptimized(true)} className="chunky-primary px-6 py-3.5"><Sparkles size={18} /> {optimized ? "Đã tối ưu bản demo!" : "Tối ưu hồ sơ của bạn ngay"} <ArrowRight size={18} /></button>
      {optimized ? <button type="button" onClick={() => setOptimized(false)} className="chunky-secondary px-5 py-3.5"><RotateCcw size={17} /> Xem lại</button> : <Link href="/studio" className="chunky-secondary px-5 py-3.5">Mở dữ liệu demo</Link>}
    </div>
  </div>;
}
