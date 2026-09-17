"use client";

import Link from "next/link";
import { Check, CheckCircle2, Copy, QrCode, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import MarketingNav from "@/components/MarketingNav";

type Plan = { name: string; price: string; period: string; description: string; featured?: boolean };
const plans: Plan[] = [
  { name: "Starter Pass", price: "99.000", period: "14 ngày", description: "3 lượt so khớp CV–JD và 2 buổi mock interview." },
  { name: "Career Pro", price: "249.000", period: "30 ngày", description: "Không giới hạn so khớp và 10 buổi mock interview.", featured: true },
  { name: "Flex Credit", price: "49.000", period: "dùng linh hoạt", description: "5 lượt so khớp hoặc 1 mock interview." },
];

function VietQrModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "checking" | "done">("idle");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (status !== "checking") return;
    const timeout = window.setTimeout(() => setStatus("done"), 3000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1300);
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#234196]/35 p-4" role="dialog" aria-modal="true" aria-labelledby="qr-title">
      <div className="storybook-card relative max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-[#FEF9EE] p-5 sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border-2 border-[#234196] bg-white" aria-label="Đóng"><X size={20} /></button>
        <div className="pr-12">
          <span className="sticker -rotate-1 bg-[#FCB625]"><QrCode size={14} /> VietQR tức thì</span>
          <h2 id="qr-title" className="mt-5 text-4xl sm:text-5xl">Kích hoạt {plan.name}</h2>
          <p className="mt-2 text-[#5A6B8F]">{plan.price} VNĐ · {plan.period}</p>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="mx-auto grid h-60 w-60 place-items-center rounded-2xl border-2 border-[#234196] bg-white p-4 shadow-[4px_4px_0_#234196]">
            <div className="grid h-full w-full grid-cols-7 gap-1 bg-white p-2" aria-label="QR thanh toán minh họa">
              {Array.from({ length: 49 }, (_, index) => <span key={index} className={`${[0,1,2,5,6,7,8,9,12,14,16,18,20,21,22,24,27,28,30,32,34,36,38,40,41,42,43,46,47,48].includes(index) ? "bg-[#234196]" : "bg-[#FCB625]/20"} ${index % 5 === 0 ? "rounded-sm" : ""}`} />)}
            </div>
          </div>
          <div>
            <div className="space-y-3">
              {[["Ngân hàng", "MB Bank"], ["Số tài khoản", "0888 2026 78"], ["Nội dung", "CAREER PRO 7826"]].map(([label, value]) => (
                <button type="button" key={label} onClick={() => copy(value, label)} className="flex w-full items-center justify-between rounded-xl border-2 border-[#234196] bg-white p-3 text-left">
                  <span><span className="block font-metadata text-[9px] text-[#5A6B8F]">{label}</span><strong className="mt-1 block">{value}</strong></span>
                  {copied === label ? <Check size={18} className="text-[#2E7D32]" /> : <Copy size={17} />}
                </button>
              ))}
            </div>
            <button type="button" disabled={status !== "idle"} onClick={() => setStatus("checking")} className="chunky-primary mt-4 w-full px-5 py-3.5 disabled:opacity-60">
              {status === "idle" && "Tôi đã chuyển khoản"}
              {status === "checking" && "Đang xác nhận… 3 giây"}
              {status === "done" && <><CheckCircle2 size={18} /> Đã kích hoạt tức thì!</>}
            </button>
          </div>
        </div>
        <p className="mt-7 flex items-start gap-2 rounded-xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-4 text-sm font-semibold text-[#2E7D32]"><ShieldCheck size={19} className="shrink-0" /> Đây là mô phỏng thanh toán. Không có giao dịch thật nào được thực hiện.</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [selected, setSelected] = useState<Plan | null>(null);
  return (
    <div className="min-h-screen bg-white text-[#234196]">
      <MarketingNav active="pricing" />
      <main className="paper-dots mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="sticker -rotate-1 bg-[#FCB625]"><Sparkles size={14} /> Giá thẳng thắn, không bẫy gia hạn</span>
          <h1 className="mt-7 text-5xl leading-[.95] tracking-[-.04em] sm:text-7xl">Chọn đúng nhịp cho chiến dịch tìm việc.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#5A6B8F]">Thanh toán một lần cho chu kỳ bạn cần. Không thẻ tín dụng, không tự động trừ tiền.</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <article key={plan.name} className={`relative flex flex-col rounded-2xl border-2 border-[#234196] p-6 sm:p-7 ${plan.featured ? "bg-[#FEF9EE] shadow-[6px_6px_0_#234196] lg:-translate-y-3" : "bg-white shadow-[3px_3px_0_#234196]"}`}>
              {plan.featured && <span className="sticker absolute -top-4 left-5 rotate-1 bg-[#FCB625]">Đề xuất nhiều nhất</span>}
              <span className="font-metadata text-[10px] font-bold text-[#5A6B8F]">0{index + 1} · Pass</span>
              <h2 className="mt-5 text-4xl">{plan.name}</h2>
              <div className="mt-5"><span className="font-headline text-5xl">{plan.price}</span><span className="ml-2 font-bold">VNĐ</span></div>
              <p className="mt-2 font-metadata text-[10px] text-[#5A6B8F]">{plan.period}</p>
              <p className="mt-7 flex-1 leading-7 text-[#5A6B8F]">{plan.description}</p>
              <ul className="mt-6 space-y-2 text-sm font-semibold">
                <li className="flex gap-2"><Check size={17} className="text-[#2E7D32]" /> Dữ liệu mã hóa</li>
                <li className="flex gap-2"><Check size={17} className="text-[#2E7D32]" /> Kích hoạt tức thì</li>
                <li className="flex gap-2"><Check size={17} className="text-[#2E7D32]" /> Không tự động gia hạn</li>
              </ul>
              <button type="button" onClick={() => setSelected(plan)} className={`${plan.featured ? "chunky-primary" : "chunky-secondary"} mt-8 px-5 py-3.5`}>Chọn {plan.name}</button>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] p-5 text-center font-semibold shadow-[4px_4px_0_#FCB625] sm:p-6">
          <ShieldCheck className="mx-auto mb-3" />
          Thanh toán 1 lần cho chu kỳ tìm việc. Cam kết <span className="marker">KHÔNG</span> trừ tiền gia hạn tự động.
        </div>
        <div className="mt-10 text-center"><Link href="/studio" className="font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">Thử Studio miễn phí trước khi mua</Link></div>
      </main>
      {selected && <VietQrModal plan={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
