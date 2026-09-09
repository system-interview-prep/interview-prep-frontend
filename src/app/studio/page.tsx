"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, Lightbulb, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";

const matched = ["SQL nâng cao", "Python", "Power BI", "A/B Testing", "FinTech", "Scrum"];
const gaps = ["dbt", "Airflow", "Data Governance"];

export default function StudioPage() {
  const [tab, setTab] = useState<"skills" | "diff">("skills");
  const [metric, setMetric] = useState("35");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-white text-[#234196]">
      <header className="flex h-14 items-center justify-between gap-4 border-b-2 border-[#234196] bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold hover:underline"><ArrowLeft size={15} /> Trang chủ</Link>
          <span className="hidden text-[#B7C6E6] sm:block">/</span>
          <span className="truncate font-headline text-lg font-semibold">Career · Studio</span>
        </div>
        <span className="sticker rotate-1 bg-[#FCB625]">Demo đã tải sẵn</span>
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:h-[calc(100vh-3.5rem)] lg:flex-row lg:overflow-hidden">
        <aside className="flex min-h-[560px] flex-col border-b-2 border-[#234196] bg-[#F0F4FC] lg:w-[40%] lg:border-b-0 lg:border-r-2">
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            <div className="sticker -rotate-1 bg-white"><Sparkles size={14} /> Góc nhìn nhà tuyển dụng</div>
            <h1 className="mt-6 max-w-xl text-4xl leading-[1.02] tracking-[-.035em] sm:text-5xl">CV tốt rồi. Nhưng chưa kể hết “độ nặng” của bạn.</h1>
            <p className="mt-5 max-w-xl leading-7 text-[#5A6B8F]">
              Với vị trí <strong className="text-[#234196]">Chuyên viên Phân tích Dữ liệu Cấp cao · FinTech Corp</strong>, hệ thống đã tìm thấy nền tảng kỹ thuật vững và một khoảng trống quan trọng về vận hành dữ liệu.
            </p>

            <div className="mt-8 rounded-2xl border-2 border-[#234196] bg-[#FEF9EE] p-5 shadow-[4px_4px_0_#FCB625]">
              <div className="flex items-center gap-2 font-bold"><Lightbulb size={19} className="text-[#E59E10]" /> Recruiter đang nghĩ gì?</div>
              <p className="mt-3 text-sm leading-6 text-[#5A6B8F]">“Ứng viên biết làm dashboard, nhưng tác động đến doanh thu hoặc tốc độ ra quyết định là bao nhiêu?”</p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex gap-3"><span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-[#234196] bg-[#FCB625] font-metadata text-[10px] font-bold">1</span><p className="text-sm leading-6"><strong>Làm rõ quy mô:</strong> số người dùng, số dashboard, hoặc lượng dữ liệu.</p></div>
              <div className="flex gap-3"><span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-[#234196] bg-white font-metadata text-[10px] font-bold">2</span><p className="text-sm leading-6"><strong>Chứng minh tác động:</strong> giảm thời gian, tăng độ chính xác, hoặc hỗ trợ doanh thu.</p></div>
            </div>

            {sent && <div className="mt-6 rounded-xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-4 text-sm font-semibold text-[#2E7D32]">AI đã nhận câu hỏi và đang dùng ngữ cảnh CV–JD hiện tại để trả lời.</div>}
          </div>

          <div className="border-t-2 border-[#234196] bg-white p-4 sm:p-5">
            <label htmlFor="studio-composer" className="mb-2 flex items-center gap-2 font-metadata text-[10px] font-bold"><MessageCircle size={14} /> Hỏi AI về bản đối soát</label>
            <div className="flex gap-2">
              <input id="studio-composer" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="Ví dụ: Viết lại bullet này tự nhiên hơn…" className="min-w-0 flex-1 rounded-xl border-2 border-[#234196] bg-white px-4 py-3 text-sm placeholder:text-[#8B9ABD]" />
              <button type="button" onClick={submit} aria-label="Gửi" className="chunky-primary h-12 w-12"><Send size={18} /></button>
            </div>
          </div>
        </aside>

        <section className="flex min-h-[700px] flex-1 flex-col bg-white lg:w-[60%] lg:min-h-0">
          <div className="border-b-2 border-[#234196] bg-[#FEF9EE] px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="sticker -rotate-1 bg-white">v2</span><span className="font-metadata text-[10px] font-bold text-[#2E7D32]">● Sẵn sàng phỏng vấn</span></div>
                <p className="mt-3 max-w-2xl text-sm font-semibold">Senior Data Analyst · FinTech Corp</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setMetric("35")} className="chunky-secondary px-3 py-2 text-xs"><RotateCcw size={15} /> Hoàn tác v1</button>
                <button type="button" onClick={() => window.print()} className="chunky-secondary px-3 py-2 text-xs"><Download size={15} /> Xuất PDF</button>
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div><span className="font-headline text-6xl leading-none sm:text-7xl">78%</span><span className="ml-2 text-sm font-bold">Tương thích</span></div>
              <div className="h-3 w-36 overflow-hidden rounded-full border-2 border-[#234196] bg-white sm:w-52"><div className="h-full w-[78%] bg-[#FCB625]" /></div>
            </div>
          </div>

          <div className="flex gap-2 border-b-2 border-[#234196] px-5 pt-4 sm:px-7">
            <button type="button" onClick={() => setTab("skills")} className={`rounded-t-xl border-2 border-b-0 border-[#234196] px-4 py-2 text-sm font-bold ${tab === "skills" ? "bg-[#FCB625]" : "bg-white"}`}>Đối soát Kỹ năng</button>
            <button type="button" onClick={() => setTab("diff")} className={`rounded-t-xl border-2 border-b-0 border-[#234196] px-4 py-2 text-sm font-bold ${tab === "diff" ? "bg-[#FCB625]" : "bg-white"}`}>CV Live Diff</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {tab === "skills" ? (
              <div className="space-y-9">
                <div>
                  <div className="mb-4 flex items-center gap-2"><Check size={18} className="text-[#2E7D32]" /><h2 className="text-2xl">Kỹ năng đã khớp</h2></div>
                  <div className="flex flex-wrap gap-3">{matched.map((skill, index) => <span key={skill} className={`sticker border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] ${index % 2 ? "rotate-1" : "-rotate-1"}`}>{skill}</span>)}</div>
                </div>
                <div>
                  <div className="mb-4 flex items-center gap-2"><X size={18} className="text-[#D32F2F]" /><h2 className="text-2xl">Khoảng trống cần xử lý</h2></div>
                  <div className="flex flex-wrap gap-3">{gaps.map((skill, index) => <span key={skill} className={`sticker border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F] ${index % 2 ? "-rotate-1" : "rotate-1"}`}>{skill}</span>)}</div>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-[#5A6B8F]">Không nên thêm kỹ năng bạn chưa có. Hãy chuẩn bị cách chứng minh khả năng học nhanh và kinh nghiệm tương đương.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                <div><p className="font-metadata text-[10px] font-bold text-[#5A6B8F]">Kinh nghiệm · FinTech Analytics</p><h2 className="mt-2 text-3xl">Tối ưu bullet theo Action–Context–Metric</h2></div>
                <div className="rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] p-5"><p className="text-sm font-bold text-[#D32F2F]">Bản cũ</p><p className="mt-3 leading-7 text-[#5A6B8F] line-through">Xây dựng dashboard và hỗ trợ các phòng ban theo dõi báo cáo kinh doanh.</p></div>
                <div className="rounded-xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-5"><p className="text-sm font-bold text-[#2E7D32]">Bản AI tối ưu</p><p className="mt-3 text-lg font-semibold leading-8">Thiết kế 12 dashboard Power BI cho Khối Tăng trưởng, rút ngắn thời gian tổng hợp báo cáo <span className="marker">{metric}%</span> và hỗ trợ quyết định phân bổ ngân sách theo tuần.</p></div>
                <label className="block rounded-xl border-2 border-dashed border-[#234196] bg-[#F0F4FC] p-5">
                  <span className="font-metadata text-[10px] font-bold">Điền con số thật của bạn</span>
                  <span className="mt-3 flex items-center gap-3"><input value={metric} onChange={(event) => setMetric(event.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className="w-24 rounded-lg border-2 border-[#234196] bg-white px-3 py-2 text-2xl font-bold" /><span className="font-headline text-3xl">%</span><span className="text-sm text-[#5A6B8F]">giảm thời gian tổng hợp</span></span>
                </label>
              </div>
            )}
          </div>

          <div className="border-t-2 border-[#234196] bg-[#F0F4FC] p-4 sm:p-5">
            <Link href="/voice" className="chunky-primary w-full px-6 py-3.5">Chuyển sang Luyện Phỏng vấn Giọng nói <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
