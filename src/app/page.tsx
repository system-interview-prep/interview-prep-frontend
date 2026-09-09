"use client";

import Footer from "@/components/Footer";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Check, ChevronDown, CirclePlay, Database, FileSearch,
  Headphones, Mic2, Play, QrCode, ShieldCheck, Sparkles, Upload, Volume2, X,
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
  { time: "0:00 – 0:20", title: "Quét đối soát ngữ nghĩa CV–JD", kind: "match" },
  { time: "0:21 – 0:40", title: "Luyện phỏng vấn WebRTC không độ trễ", kind: "voice" },
  { time: "0:41 – 1:00", title: "Phân tích biên bản STAR & nhịp thở", kind: "report" },
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

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: .5 } };

export default function LandingPage() {
  const [sample, setSample] = useState<keyof typeof roastSamples>("data");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const current = roastSamples[sample];

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#234196]">
      <MarketingNav active="platform" />

      <main>
        <section className="paper-dots px-5 pb-20 pt-16 text-center sm:px-8 md:pb-28 md:pt-24" id="hero">
          <motion.div {...reveal} className="mx-auto max-w-6xl">
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
            {showAnalysis && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex flex-wrap gap-2">{current.gaps.map((gap) => <span key={gap} className="sticker border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]">{gap}</span>)}</motion.div>}
          </motion.div>
        </section>

        <section id="video-demo" className="border-y-2 border-[#234196] bg-[#F0F4FC] px-5 py-20 sm:px-8 md:py-28">
          <motion.div {...reveal} className="mx-auto max-w-6xl">
            <div className="text-center"><span className="font-metadata text-xs font-bold text-[#E59E10]">Xem hệ thống vận hành</span><h2 className="mt-3 text-4xl tracking-tight sm:text-6xl">Trải nghiệm trước khi bạn nộp đơn ứng tuyển.</h2></div>
            <div className="mt-10 overflow-hidden rounded-2xl border-2 border-[#234196] bg-white shadow-[8px_8px_0_#234196]">
              <div className="flex h-11 items-center gap-2 border-b-2 border-[#234196] bg-[#FEF9EE] px-4"><span className="h-3 w-3 rounded-full border-2 border-[#234196] bg-[#FCB625]" /><span className="h-3 w-3 rounded-full border-2 border-[#234196] bg-white" /><span className="h-3 w-3 rounded-full border-2 border-[#234196] bg-[#234196]" /><span className="ml-3 font-metadata text-[9px]">career.studio/demo</span></div>
              <div className="relative aspect-video overflow-hidden bg-[#F0F4FC]">
                <div className="absolute inset-0 grid md:grid-cols-[.42fr_.58fr]">
                  <div className="border-r-2 border-[#234196] p-5 text-left"><span className="sticker bg-[#FCB625]">AI reasoning</span><h3 className="mt-5 text-2xl">{chapters[chapter].title}</h3><div className="mt-6 space-y-3">{[1,2,3].map((item) => <div key={item} className="h-3 rounded-full bg-[#B7C6E6]" style={{ width: `${90 - item * 13}%` }} />)}</div></div>
                  <div className="grid place-items-center bg-white p-6">{chapters[chapter].kind === "voice" ? <motion.div animate={{ borderRadius: ["40% 60% 55% 45% / 45% 40% 60% 55%","60% 40% 45% 55% / 55% 60% 40% 45%"], scale: [1,.92,1] }} transition={{ repeat: Infinity, duration: 1.4 }} className="grid h-36 w-36 place-items-center border-2 border-[#234196] bg-[#FCB625] shadow-[6px_6px_0_#234196]"><Volume2 size={44} /></motion.div> : chapters[chapter].kind === "match" ? <div className="w-full max-w-md"><div className="font-headline text-6xl">78%</div><div className="mt-5 flex flex-wrap gap-2">{["SQL","Python","Power BI","dbt?"].map((skill, i) => <span key={skill} className={`sticker ${i === 3 ? "border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]" : "border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]"}`}>{skill}</span>)}</div></div> : <div className="grid w-full max-w-md grid-cols-3 gap-3">{[82,68,91].map((score) => <div key={score} className="rounded-xl border-2 border-[#234196] bg-[#FEF9EE] p-4 text-center"><strong className="font-headline text-3xl">{score}</strong><p className="mt-1 font-metadata text-[8px]">STAR score</p></div>)}</div>}</div>
                </div>
                <button type="button" onClick={() => setPlaying((value) => !value)} className="chunky-primary absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-label={playing ? "Tạm dừng" : "Phát video"}>{playing ? <span className="text-xl">Ⅱ</span> : <Play size={25} fill="currentColor" />}</button>
              </div>
              <div className="grid md:grid-cols-3">{chapters.map((item, index) => <button key={item.time} type="button" onClick={() => { setChapter(index); setPlaying(true); }} className={`border-t-2 border-[#234196] p-4 text-left md:border-l-2 ${index === 0 ? "md:border-l-0" : ""} ${chapter === index ? "bg-[#FCB625]" : "bg-white hover:bg-[#FEF9EE]"}`}><span className="font-metadata text-[9px]">{item.time}</span><strong className="mt-1 block text-sm">{item.title}</strong></button>)}</div>
            </div>
          </motion.div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28" id="how">
          <motion.div {...reveal} className="mx-auto max-w-6xl"><div className="max-w-3xl"><span className="sticker -rotate-1 bg-[#FCB625]">Cách hoạt động</span><h2 className="mt-6 text-4xl tracking-tight sm:text-6xl">3 bước đơn giản để chinh phục vòng phỏng vấn.</h2></div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">{steps.map(({ icon: Icon, title, text }, index) => <article key={title} className="storybook-card relative p-6"><span className={`sticker absolute -top-4 right-5 bg-[#FCB625] ${index % 2 ? "rotate-2" : "-rotate-2"}`}>#0{index + 1}</span><Icon size={32} /><h3 className="mt-7 text-3xl">{title}</h3><p className="mt-4 leading-7 text-[#5A6B8F]">{text}</p></article>)}</div>
          </motion.div>
        </section>

        <section className="border-y-2 border-[#234196] bg-[#FEF9EE] px-5 py-20 sm:px-8 md:py-28" id="features">
          <motion.div {...reveal} className="mx-auto max-w-6xl"><div className="text-center"><span className="font-metadata text-xs font-bold text-[#E59E10]">Bộ công cụ thực chiến</span><h2 className="mt-3 text-4xl sm:text-6xl">Không chỉ sửa CV. Xây năng lực thật.</h2></div>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <article className="storybook-card bg-white p-7"><Database size={30} /><h3 className="mt-5 text-4xl">Đối soát Ngữ nghĩa Đa chiều</h3><p className="mt-4 leading-7 text-[#5A6B8F]">Ma trận kỹ năng đáp ứng và lỗ hổng cần chứng minh, có dẫn chứng trực tiếp từ CV.</p><div className="mt-6 flex flex-wrap gap-2"><span className="sticker border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]">SQL · Match</span><span className="sticker border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]">Airflow · Gap</span></div></article>
              <article className="storybook-card bg-[#F0F4FC] p-7"><Headphones size={30} /><h3 className="mt-5 text-4xl">Buồng Diễn tập WebRTC</h3><p className="mt-4 leading-7 text-[#5A6B8F]">Độ trễ dưới 500ms, Graceful Barge‑in và sóng âm phản hồi âm lượng thực tế.</p><div className="mt-6 flex items-end gap-1">{[20,40,68,34,55,76,42,26].map((height, i) => <motion.span key={i} animate={{ height: [height * .5, height, height * .7] }} transition={{ repeat: Infinity, duration: .7 + i * .05 }} className="w-3 rounded-full bg-[#234196]" />)}</div></article>
              <article className="rounded-2xl border-2 border-[#234196] bg-white p-7 shadow-[4px_4px_0_#234196]"><BarChart3 size={28} /><h3 className="mt-4 text-3xl">Biên bản STAR/SPAR</h3><p className="mt-3 leading-7 text-[#5A6B8F]">Chấm bối cảnh, hành động, kết quả và đếm từ đệm như “ừm”, “kiểu như”.</p></article>
              <article className="rounded-2xl border-2 border-[#234196] bg-[#FCB625] p-7 shadow-[4px_4px_0_#234196]"><ShieldCheck size={28} /><h3 className="mt-4 text-3xl">Đạo đức Tuyển dụng</h3><p className="mt-3 leading-7">Rèn luyện năng lực thật, không nhắc bài trong phỏng vấn và được HR tin cậy.</p></article>
            </div>
          </motion.div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28" id="pricing">
          <motion.div {...reveal} className="mx-auto max-w-6xl"><div className="mx-auto max-w-3xl text-center"><span className="sticker rotate-1 bg-[#FCB625]"><QrCode size={14} /> VietQR · Thanh toán một lần</span><h2 className="mt-6 text-4xl sm:text-6xl">Chi phí minh bạch cho đúng chu kỳ tìm việc.</h2><p className="mt-4 text-lg text-[#5A6B8F]">Không tự động trừ tiền gia hạn định kỳ.</p></div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">{[["Gói Khởi Đầu","99.000","14 ngày","Fresher & sinh viên mới ra trường"],["Gói Chuyên Nghiệp","249.000","30 ngày","Không giới hạn so khớp · 10 mock interview"],["Gói Nạp Lượt","49.000","Linh hoạt","5 lượt so khớp hoặc 1 mock interview"]].map(([name, price, period, desc], index) => <article key={name} className={`relative flex flex-col rounded-2xl border-2 border-[#234196] p-6 ${index === 1 ? "bg-[#FEF9EE] shadow-[6px_6px_0_#234196] md:-translate-y-3" : "bg-white shadow-[3px_3px_0_#234196]"}`}>{index === 1 && <span className="sticker absolute -top-4 left-5 rotate-1 bg-[#FCB625]">Đề xuất nhiều nhất</span>}<h3 className="mt-3 text-3xl">{name}</h3><p className="mt-5"><strong className="font-headline text-5xl">{price}</strong> VNĐ</p><span className="mt-1 font-metadata text-[10px]">{period}</span><p className="mt-6 flex-1 leading-7 text-[#5A6B8F]">{desc}</p><Link href="/pricing" className={`${index === 1 ? "chunky-primary" : "chunky-secondary"} mt-7 px-5 py-3`}>Chọn gói</Link></article>)}</div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] p-5 text-center text-sm font-bold"><ShieldCheck size={20} /> MB Bank · Vietcombank · MoMo · ZaloPay <span className="marker">Kích hoạt trong 3 giây</span></div>
          </motion.div>
        </section>

        <section className="border-y-2 border-[#234196] bg-[#F0F4FC] px-5 py-20 sm:px-8 md:py-28" id="faq">
          <motion.div {...reveal} className="mx-auto max-w-4xl"><div className="text-center"><span className="font-metadata text-xs font-bold text-[#E59E10]">Không né câu hỏi khó</span><h2 className="mt-3 text-4xl sm:text-6xl">Câu hỏi thường gặp.</h2></div>
            <div className="mt-10 space-y-4">{faqs.map(([question, answer], index) => <div key={question} className="overflow-hidden rounded-2xl border-2 border-[#234196] bg-white shadow-[3px_3px_0_#234196]"><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold" aria-expanded={openFaq === index}><span>{question}</span><ChevronDown className={`shrink-0 transition-transform ${openFaq === index ? "rotate-180" : ""}`} /></button>{openFaq === index && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t-2 border-[#234196] bg-[#FEF9EE] p-5 leading-7 text-[#5A6B8F]">{answer}</motion.p>}</div>)}</div>
          </motion.div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28">
          <motion.div {...reveal} className="mx-auto max-w-6xl rounded-2xl border-2 border-[#234196] bg-[#FCB625] p-8 text-center shadow-[6px_6px_0_#234196] sm:p-14"><Sparkles className="mx-auto" size={32} /><h2 className="mx-auto mt-5 max-w-3xl text-4xl sm:text-6xl">Sẵn sàng nhận lời mời phỏng vấn tiếp theo?</h2><Link href="/interview/cv-score" className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-[#234196] bg-[#234196] px-7 py-4 font-bold text-white shadow-[3px_3px_0_white] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none">Bắt đầu So Khớp Hồ Sơ Ngay <ArrowRight size={19} /></Link></motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
