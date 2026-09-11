"use client";

import Footer from "@/components/Footer";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Check, ChevronDown, CirclePlay, Database, FileSearch,
  Headphones, Mic2, QrCode, ShieldCheck, Sparkles, Upload, X,
} from "lucide-react";
import { useState } from "react";
import MarketingNav from "@/components/MarketingNav";

const roastSamples = {
  data: {
    label: "Data Analyst",
    old: "Quản lý dữ liệu bán hàng và lập báo cáo tuần cho ban giám đốc.",
    fresh: "Thiết lập pipeline SQL tự động hóa báo cáo doanh thu, giảm 40% thời gian tổng hợp số liệu tuần.",
    gaps: ["Không có công cụ", "Thiếu quy mô", "Chưa có tác động"],
  },
  product: {
    label: "Product Manager",
    old: "Phụ trách phát triển tính năng mới cho ứng dụng.",
    fresh: "Dẫn dắt discovery và ra mắt luồng onboarding mới, tăng 24% tỷ lệ kích hoạt người dùng trong 6 tuần.",
    gaps: ["Vai trò mơ hồ", "Thiếu phương pháp", "Chưa định lượng"],
  },
} as const;

const chapters = [
  { time: "0:00", title: "So khớp CV" },
  { time: "0:20", title: "Buồng thoại WebRTC" },
  { time: "0:40", title: "Biên bản STAR" },
] as const;

const steps = [
  { icon: Upload, title: "Tải CV & dán JD mục tiêu", text: "AI bóc tách thực thể ngữ nghĩa và bối cảnh năng lực, không đếm từ khóa thô sơ." },
  { icon: FileSearch, title: "Tối ưu hóa nội dung (Live Diff)", text: "Điền số liệu thực tế để AI lắp ghép thành thành tựu chuẩn ATS, không bịa kinh nghiệm." },
  { icon: Mic2, title: "Bật micro & luyện phản xạ", text: "Đàm thoại với phỏng vấn viên AI khó tính để rèn trí nhớ cơ bắp và sự tự tin." },
];

const faqs = [
  ["Hệ thống có tự động bịa đặt kinh nghiệm không có thật vào CV của tôi không?", "Không. Career · Studio chỉ cấu trúc lại dữ liệu thật bạn cung cấp và luôn yêu cầu xác nhận trước khi thêm số liệu."],
  ["Phỏng vấn giọng nói có hiểu thuật ngữ tiếng Anh kết hợp tiếng Việt không?", "Có. Hệ thống nạp trước từ vựng chuyên ngành từ chính JD để nhận diện chính xác ngữ cảnh Việt–Anh."],
  ["Nếu tôi ngắt lời AI khi đang phỏng vấn thì sao?", "Cơ chế WebRTC Barge-in lập tức hạ âm lượng AI và chuyển về trạng thái lắng nghe, tự nhiên như người thật."],
  ["Tôi có bị trừ tiền tự động vào tháng sau không?", "Không. Đây là gói thời hạn thanh toán một lần qua VietQR; nền tảng không lưu thẻ tín dụng và không tự động gia hạn."],
];

const reveal = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } };

export default function LandingPage() {
  const [sample, setSample] = useState<keyof typeof roastSamples>("data");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const current = roastSamples[sample];

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#234196]">
      <MarketingNav active="platform" />

      <main>
        <section className="paper-dots px-5 pb-20 pt-16 text-center sm:px-8 md:pb-28 md:pt-24" id="hero">
          <motion.div {...reveal} className="transform-gpu mx-auto max-w-6xl">
            <span className="sticker -rotate-2 bg-[#FCB625]"><Sparkles size={14} /> Nền tảng chuẩn bị ứng tuyển thực chiến 2026</span>
            <h1 className="mx-auto mt-8 max-w-5xl text-[clamp(3.2rem,7vw,7rem)] leading-[.9] tracking-[-.055em]">Đừng để hồ sơ của bạn bị hệ thống ATS loại bỏ trong <span className="marker">5 giây</span> đầu tiên.</h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#5A6B8F] sm:text-xl">So khớp ngữ nghĩa CV–JD theo thời gian thực và diễn tập phỏng vấn giọng nói hai chiều phản hồi dưới 500ms. Rèn phản xạ thực chất, kiên quyết nói không với nhắc bài gian lận.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/interview/cv-score" className="chunky-primary px-6 py-4">Mở Không Gian So Khớp & Tải CV <ArrowRight size={18} /></Link>
              <a href="#video-demo" className="chunky-secondary px-6 py-4"><CirclePlay size={18} /> Xem Video Trải nghiệm (60s)</a>
            </div>
          </motion.div>

          <motion.div {...reveal} className="storybook-card mx-auto mt-12 max-w-4xl p-5 text-left sm:p-7">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(roastSamples) as Array<keyof typeof roastSamples>).map((key) => <button key={key} type="button" onClick={() => { setSample(key); setShowAnalysis(false); }} className={`rounded-xl border-2 border-[#234196] px-4 py-2 text-sm font-bold ${sample === key ? "bg-[#FCB625]" : "bg-white hover:bg-[#F0F4FC]"}`}>Thử câu mẫu {roastSamples[key].label}</button>)}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border-2 border-dashed border-[#D32F2F] bg-[#FFEBEE] p-5"><span className="sticker -rotate-1 border-[#D32F2F] bg-white text-[#D32F2F]"><X size={14} /> 85% nguy cơ ATS đánh rớt</span><p className="mt-5 leading-7 text-[#5A6B8F]">{current.old}</p></div>
              <div className="rounded-xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-5"><span className="sticker rotate-1 border-[#2E7D32] bg-[#FCB625] text-[#2E7D32]"><Check size={14} /> Chuẩn ATS</span><p className="mt-5 font-semibold leading-7">{current.fresh}</p></div>
            </div>
            <button type="button" onClick={() => setShowAnalysis((value) => !value)} className="mt-5 font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">{showAnalysis ? "Ẩn phân tích" : "Bấm để xem AI phân tích lỗ hổng…"}</button>
            {showAnalysis && <div className="mt-4 flex flex-wrap gap-2">{current.gaps.map((gap) => <span key={gap} className="sticker border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]">{gap}</span>)}</div>}
          </motion.div>
        </section>

        <section id="video-demo" className="border-y-2 border-[#234196] bg-[#F0F4FC] px-5 py-20 sm:px-8 md:py-28">
          <motion.div {...reveal} className="transform-gpu mx-auto max-w-6xl">
            <div className="text-center"><span className="font-metadata text-xs font-bold text-[#E59E10]">Xem hệ thống vận hành</span><h2 className="mt-3 text-4xl tracking-tight sm:text-6xl">Trải nghiệm trước khi bạn nộp đơn ứng tuyển.</h2></div>
            <div className="mt-10 overflow-hidden rounded-2xl border-2 border-[#234196] bg-white shadow-[8px_8px_0px_#234196]">
              <div className="flex h-11 items-center gap-2 border-b-2 border-[#234196] bg-[#FEF9EE] px-4" aria-label="Career Studio video walkthrough">
                <span className="h-3 w-3 rounded-full border-2 border-[#234196] bg-[#FCB625]" />
                <span className="h-3 w-3 rounded-full border-2 border-[#234196] bg-[#234196]" />
                <span className="h-3 w-3 rounded-full border-2 border-[#234196] bg-[#2E7D32]" />
                <span className="ml-3 font-metadata text-[9px]">career.studio/walkthrough</span>
              </div>
              <div className="relative aspect-video overflow-hidden bg-[#F0F4FC]">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  preload="auto"
                  onError={() => setVideoFailed(true)}
                  poster="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                  className="h-full w-full object-cover"
                  aria-label="Video walkthrough of an interview preparation session"
                >
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-woman-having-a-video-call-on-a-laptop-40439-large.mp4" type="video/mp4" />
                </video>
                {videoFailed && (
                  <div className="absolute inset-0 grid place-items-center bg-[#F0F4FC]/95 p-6 text-center">
                    <p className="max-w-sm rounded-xl border-2 border-[#234196] bg-white p-4 font-semibold text-[#234196] shadow-[3px_3px_0_#234196]">Video từ Mixkit hiện không phản hồi. Poster vẫn hiển thị; hãy thử tải lại trang hoặc dùng video local trong thư mục public.</p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 bg-gradient-to-t from-[#234196]/70 via-[#234196]/10 to-transparent p-4 sm:p-5">
                  <span className="sticker -rotate-1 bg-[#FCB625] text-[#234196] shadow-[2px_2px_0_#234196]">✦ Đang phân tích nhịp nói &amp; STAR</span>
                  <span className="sticker rotate-1 bg-white text-[#234196] shadow-[2px_2px_0_#234196]">• WebRTC Live: 420ms</span>
                </div>
              </div>
              <div className="grid md:grid-cols-3">
                {chapters.map((item, index) => (
                  <button
                    key={item.time}
                    type="button"
                    onClick={() => setChapter(index)}
                    className={`border-t-2 border-[#234196] p-4 text-left transition-colors md:border-l-2 ${index === 0 ? "md:border-l-0" : ""} ${chapter === index ? "bg-[#FCB625]" : "bg-white hover:bg-[#FEF9EE]"}`}
                    aria-pressed={chapter === index}
                  >
                    <span className="font-metadata text-[9px]">{item.time}</span>
                    <strong className="mt-1 block text-sm">{item.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28" id="how">
          <motion.div {...reveal} className="transform-gpu mx-auto max-w-6xl"><div className="max-w-3xl"><span className="sticker -rotate-1 bg-[#FCB625]">Cách hoạt động</span><h2 className="mt-6 text-4xl tracking-tight sm:text-6xl">3 bước đơn giản để chinh phục vòng phỏng vấn.</h2></div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">{steps.map(({ icon: Icon, title, text }, index) => <article key={title} className="storybook-card relative p-6"><span className={`sticker absolute -top-4 right-5 bg-[#FCB625] ${index % 2 ? "rotate-2" : "-rotate-2"}`}>#0{index + 1}</span><Icon size={32} /><h3 className="mt-7 text-3xl">{title}</h3><p className="mt-4 leading-7 text-[#5A6B8F]">{text}</p></article>)}</div>
          </motion.div>
        </section>

        <section className="border-y-2 border-[#234196] bg-[#FEF9EE] px-5 py-20 sm:px-8 md:py-28" id="features">
          <motion.div {...reveal} className="transform-gpu mx-auto max-w-6xl"><div className="text-center"><span className="font-metadata text-xs font-bold text-[#E59E10]">Bộ công cụ thực chiến</span><h2 className="mt-3 text-4xl sm:text-6xl">Không chỉ sửa CV. Xây năng lực thật.</h2></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <article className="storybook-card bg-white p-7"><Database size={30} /><h3 className="mt-5 text-4xl">Đối soát Ngữ nghĩa Đa chiều</h3><p className="mt-4 leading-7 text-[#5A6B8F]">Ma trận kỹ năng đáp ứng và lỗ hổng cần chứng minh, có dẫn chứng trực tiếp từ CV.</p><div className="mt-6 flex flex-wrap gap-2"><span className="sticker border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]">SQL · Match</span><span className="sticker border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]">Airflow · Gap</span></div></article>
              <article className="storybook-card bg-[#F0F4FC] p-7"><Headphones size={30} /><h3 className="mt-5 text-4xl">Buồng Diễn tập WebRTC</h3><p className="mt-4 leading-7 text-[#5A6B8F]">Độ trễ dưới 500ms, Graceful Barge‑in và sóng âm phản hồi âm lượng thực tế.</p><div className="mt-6 flex items-end gap-1">{[20,40,68,34,55,76,42,26].map((height, i) => <motion.span key={i} style={{ height }} animate={{ scaleY: [.5, 1, .7] }} transition={{ repeat: Infinity, duration: .7 + i * .05, ease: "easeInOut" }} className="origin-bottom transform-gpu w-3 rounded-full bg-[#234196]" />)}</div></article>
              <article className="rounded-2xl border-2 border-[#234196] bg-white p-7 shadow-[4px_4px_0_#234196]"><BarChart3 size={28} /><h3 className="mt-4 text-3xl">Biên bản STAR/SPAR</h3><p className="mt-3 leading-7 text-[#5A6B8F]">Chấm bối cảnh, hành động, kết quả và đếm từ đệm như “ừm”, “kiểu như”.</p></article>
              <article className="rounded-2xl border-2 border-[#234196] bg-[#FCB625] p-7 shadow-[4px_4px_0_#234196]"><ShieldCheck size={28} /><h3 className="mt-4 text-3xl">Đạo đức Tuyển dụng</h3><p className="mt-3 leading-7">Rèn luyện năng lực thật, không nhắc bài trong phỏng vấn và được HR tin cậy.</p></article>
            </div>
          </motion.div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28" id="pricing">
          <motion.div {...reveal} className="transform-gpu mx-auto max-w-6xl"><div className="mx-auto max-w-3xl text-center"><span className="sticker rotate-1 bg-[#FCB625]"><QrCode size={14} /> VietQR · Thanh toán một lần</span><h2 className="mt-6 text-4xl sm:text-6xl">Chi phí minh bạch cho đúng chu kỳ tìm việc.</h2><p className="mt-4 text-lg text-[#5A6B8F]">Không tự động trừ tiền gia hạn định kỳ.</p></div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">{[["Gói Khởi Đầu","99.000","14 ngày","Fresher & sinh viên mới ra trường"],["Gói Chuyên Nghiệp","249.000","30 ngày","Không giới hạn so khớp · 10 mock interview"],["Gói Nạp Lượt","49.000","Linh hoạt","5 lượt so khớp hoặc 1 mock interview"]].map(([name, price, period, desc], index) => <article key={name} className={`relative flex flex-col rounded-2xl border-2 border-[#234196] p-6 ${index === 1 ? "bg-[#FEF9EE] shadow-[6px_6px_0_#234196] md:-translate-y-3" : "bg-white shadow-[3px_3px_0_#234196]"}`}>{index === 1 && <span className="sticker absolute -top-4 left-5 rotate-1 bg-[#FCB625]">Đề xuất nhiều nhất</span>}<h3 className="mt-3 text-3xl">{name}</h3><p className="mt-5"><strong className="font-headline text-5xl">{price}</strong> VNĐ</p><span className="mt-1 font-metadata text-[10px]">{period}</span><p className="mt-6 flex-1 leading-7 text-[#5A6B8F]">{desc}</p><Link href="/pricing" className={`${index === 1 ? "chunky-primary" : "chunky-secondary"} mt-7 px-5 py-3`}>Chọn gói</Link></article>)}</div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] p-5 text-center text-sm font-bold"><ShieldCheck size={20} /> MB Bank · Vietcombank · MoMo · ZaloPay <span className="marker">Kích hoạt trong 3 giây</span></div>
          </motion.div>
        </section>

        <section className="border-y-2 border-[#234196] bg-[#F0F4FC] px-5 py-20 sm:px-8 md:py-28" id="faq">
          <motion.div {...reveal} className="transform-gpu mx-auto max-w-4xl"><div className="text-center"><span className="font-metadata text-xs font-bold text-[#E59E10]">Không né câu hỏi khó</span><h2 className="mt-3 text-4xl sm:text-6xl">Câu hỏi thường gặp.</h2></div>
            <div className="mt-10 space-y-4">
              {faqs.map(([question, answer], index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={question} className="overflow-hidden rounded-2xl border-2 border-[#234196] bg-white shadow-[3px_3px_0_#234196]">
                    <button type="button" onClick={() => setOpenFaq(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`}>
                      <span>{question}</span>
                      <ChevronDown className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div id={`faq-answer-${index}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }} className="overflow-hidden border-t-2 border-[#234196] bg-[#FEF9EE]">
                          <p className="p-5 leading-7 text-[#5A6B8F]">{answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28">
          <motion.div {...reveal} className="transform-gpu mx-auto max-w-6xl rounded-2xl border-2 border-[#234196] bg-[#FCB625] p-8 text-center shadow-[6px_6px_0_#234196] sm:p-14"><Sparkles className="mx-auto" size={32} /><h2 className="mx-auto mt-5 max-w-3xl text-4xl sm:text-6xl">Sẵn sàng nhận lời mời phỏng vấn tiếp theo?</h2><Link href="/interview/cv-score" className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-[#234196] bg-[#234196] px-7 py-4 font-bold text-white shadow-[3px_3px_0_white] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none">Bắt đầu So Khớp Hồ Sơ Ngay <ArrowRight size={19} /></Link></motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
