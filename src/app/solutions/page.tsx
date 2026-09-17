import Footer from "@/components/Footer";
import Link from "next/link";
import { cookies } from "next/headers";
import MarketingNav from "../../components/MarketingNav";
import { getDictionary, normalizeLang } from "../../i18n/i18n";
import {
  ArrowRight, Briefcase, CheckCircle2, Crown, FileCheck2, GraduationCap,
  Mic, ShieldCheck, Sparkles,
} from "lucide-react";
import { SolutionsPersonaSwitcher } from "../../components/SolutionsPersonaSwitcher";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;
  return { title: t("solutions.metaTitle") };
}

export default async function SolutionsPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-h-screen bg-white font-body text-[#234196]">
      <MarketingNav active="solutions" />
      <main>
        <section className="paper-dots mx-auto grid max-w-[1480px] gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-12">
          <div>
            <span className="sticker -rotate-2 bg-[#FCB625]"><Sparkles size={14} /> Giải pháp đo ni đóng giày cho từng giai đoạn nghề nghiệp</span>
            <h1 className="mt-8 text-[clamp(3.3rem,6.5vw,6.8rem)] leading-[.9] tracking-[-.05em]">
              {t("solutions.hero.titlePlain")} <span className="marker">{t("solutions.hero.titleGradient")}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5A6B8F]">{t("solutions.hero.subtitle")}</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/interview/cv-score" className="chunky-primary px-6 py-4">Tìm lộ trình của bạn <ArrowRight size={18} /></Link><Link href="#personas" className="chunky-secondary px-6 py-4">Xem theo kinh nghiệm</Link></div>
          </div>
          <SolutionsPersonaSwitcher />
        </section>

        <section id="personas" className="border-y-2 border-[#234196] bg-[#FEF9EE] px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1480px]">
            <div className="max-w-3xl"><span className="font-metadata text-[11px] font-bold text-[#E59E10]">01 · Giải pháp theo chân dung</span><h2 className="mt-3 text-4xl tracking-tight sm:text-6xl">Đúng vấn đề. Đúng giai đoạn. Đúng cách luyện.</h2></div>
            <div className="mt-12 grid gap-6 md:grid-cols-12">
              <article id="students" className="storybook-card flex flex-col p-6 md:col-span-4">
                <div className="flex items-center justify-between gap-3"><GraduationCap size={30} /><span className="sticker -rotate-1 bg-[#FCB625]">0–1 năm kinh nghiệm</span></div>
                <h3 className="mt-7 text-3xl">{t("solutions.segment.students.title")}</h3>
                <p className="mt-4 leading-7 text-[#5A6B8F]">{t("solutions.segment.students.desc")}</p>
                <ul className="mt-6 space-y-3 text-sm font-semibold">{["Biến đồ án thành bullet có tác động", "Gỡ lo âu phỏng vấn hành vi", "Dựng câu chuyện STAR đầu tiên"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-[#2E7D32]" />{item}</li>)}</ul>
                <div className="mt-7 rounded-xl border-2 border-[#234196] bg-[#F0F4FC] p-4"><p className="text-xs text-[#5A6B8F] line-through">Làm đồ án phân tích dữ liệu.</p><p className="mt-3 text-sm font-semibold">Phân tích 12.000 giao dịch, tìm ra 3 nhóm khách hàng có tỷ lệ rời bỏ cao.</p></div>
                <Link href="/signup" className="chunky-secondary mt-7 px-5 py-3">Khám phá lộ trình Fresher <ArrowRight size={17} /></Link>
              </article>

              <article id="seekers" className="storybook-card flex flex-col bg-[#F0F4FC] p-6 md:col-span-8 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3"><Briefcase size={32} /><span className="sticker rotate-1 bg-[#FCB625]">2–5 năm · Tối ưu thu nhập</span></div>
                <h3 className="mt-7 text-4xl">{t("solutions.segment.seekers.title")}</h3>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5A6B8F]">{t("solutions.segment.seekers.desc")}</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border-2 border-[#234196] bg-white p-5"><span className="sticker -rotate-1 border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]">88% Match</span><p className="mt-4 font-headline text-2xl">Đủ năng lực cốt lõi</p><div className="mt-4 flex flex-wrap gap-2"><span className="sticker border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]">SQL</span><span className="sticker border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]">dbt?</span></div></div>
                  <div className="rounded-xl border-2 border-[#234196] bg-white p-5"><span className="sticker rotate-1 bg-[#FCB625]"><span className="h-2 w-2 rounded-full bg-[#2E7D32]" /> WebRTC Live · 420ms</span><p className="mt-4 font-headline text-2xl">Phản xạ như buổi thật</p><div className="mt-5 flex h-12 items-end gap-1">{[22,42,30,48,26,38,18].map((height, index) => <span key={index} className="w-2 rounded-full bg-[#234196]" style={{ height }} />)}</div></div>
                </div>
                <Link href="/interview/cv-score" className="chunky-primary mt-8 w-fit px-6 py-4">Tối ưu CV & Luyện Phỏng vấn ngay <ArrowRight size={18} /></Link>
              </article>

              <article id="executives" className="storybook-card grid gap-10 bg-[#FEF9EE] p-7 md:col-span-12 md:grid-cols-[1.2fr_.8fr] md:p-12">
                <div><div className="flex flex-wrap items-center gap-3"><Crown size={32} /><span className="sticker -rotate-1 bg-[#FCB625]">Quản lý cấp cao & chuyển đổi ngành</span></div><h3 className="mt-7 text-4xl sm:text-5xl">{t("solutions.segment.professionals.title")}</h3><p className="mt-5 max-w-3xl text-lg leading-8 text-[#5A6B8F]">{t("solutions.segment.professionals.desc")}</p><ul className="mt-7 grid gap-3 text-sm font-semibold sm:grid-cols-2"><li className="flex gap-2"><CheckCircle2 size={17} className="text-[#2E7D32]" />Định vị executive narrative</li><li className="flex gap-2"><CheckCircle2 size={17} className="text-[#2E7D32]" />Khung SPAR cho xung đột lãnh đạo</li><li className="flex gap-2"><CheckCircle2 size={17} className="text-[#2E7D32]" />Panel mock interview</li><li className="flex gap-2"><ShieldCheck size={17} className="text-[#2E7D32]" />Bảo mật tuyệt đối</li></ul><Link href="/signup" className="chunky-secondary mt-8 px-6 py-4">Đặt phiên tư vấn bảo mật <ArrowRight size={18} /></Link></div>
                <div className="grid content-center gap-4"><div className="rotate-1 rounded-2xl border-2 border-[#234196] bg-[#FCB625] p-6 text-center shadow-[4px_4px_0_#234196]"><strong className="font-headline text-6xl">+35%</strong><p className="mt-2 font-metadata text-[10px] font-bold">Lương đàm phán trung bình</p></div><div className="-rotate-1 rounded-2xl border-2 border-[#234196] bg-white p-6 text-center shadow-[4px_4px_0_#234196]"><strong className="font-headline text-6xl">100%</strong><p className="mt-2 font-metadata text-[10px] font-bold">Bảo mật danh tính hồ sơ</p></div></div>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="text-center"><span className="font-metadata text-[11px] font-bold text-[#E59E10]">02 · Năng lực lõi</span><h2 className="mt-3 text-4xl sm:text-6xl">{t("solutions.modalities.title")}</h2><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#5A6B8F]">{t("solutions.modalities.subtitle")}</p></div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              [FileCheck2, "Đối soát Ngữ nghĩa CV–JD", "Bóc tách kỹ năng bắt buộc và gợi ý số liệu Action–Context–Metric."],
              [Mic, "Phỏng vấn Thoại WebRTC <500ms", "Giọng nói tự nhiên, hỗ trợ thuật ngữ kỹ thuật song ngữ và barge‑in."],
              [Sparkles, "Biên bản STAR & Nhịp điệu", "Đo từ đệm, tốc độ WPM và dựng kịch bản trả lời mẫu có căn cứ."],
            ].map(([Icon, title, description], index) => {
              const PillarIcon = Icon as typeof FileCheck2;
              return <article key={String(title)} className={`rounded-2xl border-2 border-[#234196] p-7 shadow-[4px_4px_0_#234196] ${index === 1 ? "bg-[#F0F4FC]" : index === 2 ? "bg-[#FEF9EE]" : "bg-white"}`}><span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-[#234196] bg-[#FCB625]"><PillarIcon size={24} /></span><h3 className="mt-6 text-3xl">{String(title)}</h3><p className="mt-4 leading-7 text-[#5A6B8F]">{String(description)}</p></article>;
            })}
          </div>
        </section>

        <section className="border-y-2 border-[#234196] bg-[#F0F4FC] px-5 py-20 sm:px-8 md:py-28">
          <div className="storybook-card mx-auto grid max-w-6xl overflow-hidden md:grid-cols-2">
            <div className="p-7 sm:p-10"><span className="sticker -rotate-1 bg-[#FCB625]">Hậu trường Semantic RAG</span><h2 className="mt-7 text-4xl sm:text-5xl">{t("solutions.editorial.title")}</h2><p className="mt-5 leading-8 text-[#5A6B8F]">{t("solutions.editorial.desc")}</p><div className="mt-8 space-y-7"><div className="flex gap-5"><strong className="font-metadata text-3xl">01</strong><div><h3 className="font-sans text-lg font-bold">Keyword stuffing thất bại</h3><p className="mt-2 text-sm leading-6 text-[#5A6B8F]">ATS hiện đại đọc ngữ cảnh, mức độ thành thạo và bằng chứng tác động.</p></div></div><div className="flex gap-5"><strong className="font-metadata text-3xl">02</strong><div><h3 className="font-sans text-lg font-bold">RAG bảo vệ tính xác thực</h3><p className="mt-2 text-sm leading-6 text-[#5A6B8F]">Mọi gợi ý đều neo vào dữ liệu CV và JD thật của ứng viên.</p></div></div></div></div>
            <div className="border-t-2 border-[#234196] bg-[#FEF9EE] p-7 md:border-l-2 md:border-t-0 sm:p-10"><span className="font-metadata text-[10px] font-bold">CV Live Diff · v2</span><div className="mt-6 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] p-5"><span className="text-xs font-bold text-[#D32F2F]">Bản cũ</span><p className="mt-3 text-[#5A6B8F] line-through">Hỗ trợ phân tích báo cáo kinh doanh hàng tuần.</p></div><div className="mt-4 rounded-xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-5"><span className="text-xs font-bold text-[#2E7D32]">Bản có căn cứ</span><p className="mt-3 font-semibold leading-7">Tự động hóa báo cáo tuần bằng SQL, giảm <span className="marker">40%</span> thời gian tổng hợp.</p></div><p className="mt-5 text-xs leading-6 text-[#5A6B8F]">Con số chỉ được thêm sau khi ứng viên xác nhận.</p></div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-5xl rounded-3xl border-2 border-[#234196] bg-[#FCB625] p-8 text-center shadow-[8px_8px_0_#234196] sm:p-14"><Sparkles className="mx-auto" size={32} /><h2 className="mx-auto mt-5 max-w-3xl text-4xl sm:text-6xl">{t("solutions.cta.title")}</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#234196]/80">Bắt đầu bằng dữ liệu thật của bạn. Thanh toán một lần, không có bẫy tự động gia hạn.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#234196] bg-[#234196] px-7 py-4 font-bold text-white shadow-[3px_3px_0_white] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">Bắt đầu Thử nghiệm Ngay <Sparkles size={17} /></Link><Link href="/pricing" className="chunky-secondary px-7 py-4">Xem Bảng Giá Minh Bạch</Link></div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
