import Footer from "@/components/Footer";
import Link from "next/link";
import { cookies } from "next/headers";
import AnimateOnScroll from "../../components/AnimateOnScroll";
import MarketingNav from "../../components/MarketingNav";
import { getDictionary, normalizeLang } from "../../i18n/i18n";
import {
  ArrowRight, ArrowUpRight, Bookmark, Calendar, CheckCircle2, FileText,
  Search, Sparkles, Users,
} from "lucide-react";

const ARTICLE_DELAYS: Record<"a1" | "a2" | "a3", number> = { a1: 0, a2: 150, a3: 300 };

function AtsBlueprint() {
  return (
    <div className="grid min-h-64 place-items-center border-b-2 border-[#234196] bg-[#F0F4FC] p-6 sm:p-8">
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-[1fr_180px]">
        <div className="rotate-[-1deg] rounded-xl border-2 border-[#234196] bg-white p-5 shadow-[4px_4px_0_#234196]">
          <div className="flex items-center justify-between"><span className="font-headline text-2xl">Hồ sơ ứng viên</span><span className="sticker bg-[#FCB625]">ATS scan</span></div>
          <div className="mt-5 space-y-3">{[92, 72, 84, 58].map((width, index) => <div key={width} className="flex items-center gap-2"><CheckCircle2 size={16} className={index === 3 ? "text-[#D32F2F]" : "text-[#2E7D32]"} /><span className="h-3 rounded-full bg-[#B7C6E6]" style={{ width: `${width}%` }} /></div>)}</div>
        </div>
        <div className="grid gap-3"><div className="rounded-xl border-2 border-[#2E7D32] bg-[#E8F5E9] p-4 text-center"><strong className="font-headline text-4xl">78%</strong><p className="font-metadata text-[8px]">Semantic match</p></div><div className="rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] p-4 text-center"><strong className="font-headline text-2xl">03 gaps</strong><p className="font-metadata text-[8px]">Cần chứng minh</p></div></div>
      </div>
    </div>
  );
}

function ArticleDiagram({ kind }: { kind: "star" | "audio" | "semantic" }) {
  if (kind === "star") return <div className="grid h-48 grid-cols-2 gap-3 rounded-xl border-2 border-[#234196] bg-[#FEF9EE] p-5">{["S · Tình huống", "T · Nhiệm vụ", "A · Hành động", "R · Kết quả"].map((item, index) => <div key={item} className={`grid place-items-center rounded-lg border-2 border-[#234196] p-2 text-center text-xs font-bold ${index === 3 ? "bg-[#FCB625]" : "bg-white"}`}>{item}</div>)}</div>;
  if (kind === "audio") return <div className="flex h-48 items-center justify-center gap-2 rounded-xl border-2 border-[#234196] bg-[#F0F4FC] p-5">{[30,68,42,86,54,72,38,60].map((height, index) => <span key={index} className="w-4 rounded-full bg-[#234196]" style={{ height }} />)}<span className="sticker absolute rotate-2 bg-[#FCB625]">“ừm” × 7</span></div>;
  return <div className="grid h-48 gap-3 rounded-xl border-2 border-[#234196] bg-white p-5"><div className="flex flex-wrap content-center gap-2">{["SQL", "Power BI", "FinTech"].map((tag) => <span key={tag} className="sticker border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]">{tag}</span>)}<span className="sticker border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]">dbt?</span></div><div className="rounded-lg border-2 border-dashed border-[#234196] bg-[#FEF9EE] p-3 text-center font-metadata text-[9px]">Ngữ cảnh &gt; nhồi từ khóa</div></div>;
}

export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;
  return { title: t("resources.metaTitle") };
}

export default async function ResourcesPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;
  const articles = [
    { key: "a1" as const, kind: "star" as const, initials: "HN" },
    { key: "a2" as const, kind: "audio" as const, initials: "MT" },
    { key: "a3" as const, kind: "semantic" as const, initials: "KL" },
  ];

  return (
    <div className="min-h-screen bg-white font-body text-[#234196]">
      <MarketingNav active="resources" />
      <main>
        <section className="paper-dots border-b-2 border-[#234196] bg-white px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto max-w-[1480px] text-center">
            <span className="sticker -rotate-2 bg-[#FCB625]"><Sparkles size={14} /> Trung tâm tri thức tuyển dụng & cẩm nang phỏng vấn 2026</span>
            <h1 className="mx-auto mt-8 max-w-5xl text-[clamp(3.3rem,7vw,6.8rem)] leading-[.9] tracking-[-.05em]">{t("resources.hero.titleBefore")} <span className="marker italic">{t("resources.hero.titleAccent")}</span> {t("resources.hero.titleAfter")}</h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#5A6B8F]">{t("resources.hero.subtitle")}</p>
            <form action="/resources" method="get" className="mx-auto mt-9 flex max-w-2xl items-center gap-2 rounded-2xl border-2 border-[#234196] bg-white p-2 text-left shadow-[4px_4px_0_#234196]">
              <Search size={22} className="ml-2 shrink-0" /><input name="q" aria-label={t("resources.hero.searchPlaceholder")} placeholder={t("resources.hero.searchPlaceholder")} className="min-w-0 flex-1 border-0 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-[#5A6B8F]" /><button type="submit" className="chunky-primary px-5 py-3 text-sm">Tìm kiếm</button>
            </form>
            <div className="mx-auto mt-6 flex max-w-5xl gap-3 overflow-x-auto pb-2">
              {["✦ Tất cả cẩm nang", "Thuật toán ATS", "Khung Phỏng vấn STAR", "Đàm phán Lương & Offer", "Chuyển đổi Ngành nghề"].map((label, index) => <Link key={label} href={index === 0 ? "/resources" : `/resources?topic=${encodeURIComponent(label)}`} className={`sticker shrink-0 ${index === 0 ? "rotate-1 bg-[#FCB625] shadow-[2px_2px_0_#234196]" : "bg-white hover:bg-[#F0F4FC]"}`}>{label}</Link>)}
            </div>
          </div>
        </section>

        <section className="bg-[#FEF9EE] px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1480px]">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="font-metadata text-[10px] font-bold text-[#E59E10]">Bài viết tâm điểm tháng này</span><h2 className="mt-2 text-4xl sm:text-5xl">{t("resources.featured.sectionTitle")}</h2></div><Link href="#articles" className="inline-flex items-center gap-2 font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">Xem tất cả bài viết <ArrowRight size={17} /></Link></div>
            <div className="mt-10 grid gap-6 md:grid-cols-12">
              <article className="storybook-card overflow-hidden md:col-span-8"><AtsBlueprint /><div className="p-6 sm:p-8"><div className="flex flex-wrap items-center gap-3"><span className="sticker -rotate-1 bg-[#FCB625]">Cẩm nang đột phá · 12 phút đọc</span><time className="font-metadata text-[9px] text-[#5A6B8F]">18 · 08 · 2026</time></div><h3 className="mt-6 text-3xl sm:text-4xl"><Link href="#" className="hover:text-[#E59E10]">{t("resources.featured.main.title")}</Link></h3><p className="mt-4 max-w-3xl leading-7 text-[#5A6B8F]">75% hồ sơ thất bại ở bước parse tự động. Bài phân tích này chỉ ra cách semantic matching đọc đúng bối cảnh thay vì săn từ khóa rời rạc.</p><Link href="#" className="mt-6 inline-flex items-center gap-2 font-bold">Đọc phân tích đầy đủ <ArrowUpRight size={18} /></Link></div></article>
              <div className="grid gap-6 md:col-span-4">
                <article className="rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] p-6 shadow-[4px_4px_0_#234196]"><span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#234196] bg-[#FCB625]"><Sparkles size={21} /></span><h3 className="mt-5 text-3xl">Bí quyết phỏng vấn giọng nói không độ trễ</h3><p className="mt-3 text-sm leading-6 text-[#5A6B8F]">Cách tận dụng khoảng dừng, barge‑in và nhịp nói để tạo cảm giác đối thoại thật.</p><Link href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-bold">Đọc nhanh <ArrowRight size={15} /></Link></article>
                <article className="rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196]"><span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#234196] bg-[#FEF9EE]"><FileText size={21} /></span><h3 className="mt-5 text-3xl">Chiến thuật đàm phán tăng 25% lương khởi điểm</h3><p className="mt-3 text-sm leading-6 text-[#5A6B8F]">Neo kỳ vọng vào dữ liệu thị trường và phạm vi tác động của vai trò.</p><Link href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-bold">Xem chiến thuật <ArrowRight size={15} /></Link></article>
              </div>
            </div>
          </div>
        </section>

        <section id="articles" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1480px]"><span className="font-metadata text-[10px] font-bold text-[#E59E10]">Thư viện tuyển chọn</span><h2 className="mt-2 max-w-4xl text-4xl sm:text-5xl">Nghiên cứu & Hướng dẫn Thực hành Chuyên sâu</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {articles.map(({ key, kind, initials }) => <AnimateOnScroll key={key} className="flex h-full flex-col rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#234196]" delayMs={ARTICLE_DELAYS[key]}>
                <ArticleDiagram kind={kind} /><time className="mt-6 font-metadata text-[9px] text-[#5A6B8F]">{t(`resources.articles.${key}.date`)} · 8 phút đọc</time><h3 className="mt-3 text-2xl"><Link href="#">{t(`resources.articles.${key}.title`)}</Link></h3><p className="mt-3 flex-1 text-sm leading-7 text-[#5A6B8F]">{t(`resources.articles.${key}.excerpt`)}</p><div className="mt-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#234196] bg-[#FCB625] font-metadata text-[10px] font-bold">{initials}</span><strong className="text-sm">{t(`resources.articles.${key}.author`)}</strong></div>
              </AnimateOnScroll>)}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 md:pb-28">
          <AnimateOnScroll className="storybook-card mx-auto grid max-w-[1480px] gap-10 bg-[#F0F4FC] p-7 md:grid-cols-[1fr_.9fr] md:p-12">
            <div><div className="flex -space-x-2">{["AN","PM","DA"].map((initials, index) => <span key={initials} className={`grid h-11 w-11 place-items-center rounded-full border-2 border-[#234196] font-metadata text-[9px] font-bold ${index === 1 ? "bg-[#FCB625]" : "bg-white"}`}>{initials}</span>)}</div><span className="sticker mt-5 -rotate-1 bg-[#FCB625]">15.000+ ứng viên</span><h2 className="mt-6 text-4xl sm:text-5xl">Cộng đồng Diễn tập & Thẩm định CV Đồng đẳng</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-[#5A6B8F]">Mock interview ẩn danh hằng tuần và phản hồi đa chiều từ những người cùng ngành, cùng cấp độ.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button type="button" className="chunky-primary px-6 py-4"><Users size={18} /> Tham gia Discord / Zalo</button><button type="button" className="chunky-secondary px-6 py-4"><Calendar size={18} /> Lịch diễn tập tuần này</button></div></div>
            <div className="grid grid-cols-2 gap-4">{[[Users,"Ghép cặp Mock 1–1"],[Bookmark,"Kho câu hỏi từ 100+ công ty"],[CheckCircle2,"Thẩm định chéo ẩn danh"],[Sparkles,"Hỏi đáp cùng chuyên gia HR"]].map(([Icon, title]) => { const TileIcon = Icon as typeof Users; return <div key={String(title)} className="rounded-xl border-2 border-[#234196] bg-white p-5 shadow-[3px_3px_0_#234196]"><TileIcon size={23} /><h3 className="mt-4 font-sans text-sm font-bold">{String(title)}</h3></div>; })}</div>
          </AnimateOnScroll>
        </section>

        <section className="px-5 pb-20 sm:px-8 md:pb-28"><AnimateOnScroll className="mx-auto max-w-5xl rounded-3xl border-2 border-[#234196] bg-[#FCB625] p-8 text-center shadow-[8px_8px_0_#234196] sm:p-14"><Sparkles className="mx-auto" size={32} /><h2 className="mx-auto mt-5 max-w-3xl text-4xl sm:text-6xl">Áp dụng ngay các phương pháp này vào hồ sơ của bạn.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8">Kiểm tra độ tương thích CV với bản mô tả công việc hoàn toàn miễn phí ngay hôm nay.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#234196] bg-[#234196] px-7 py-4 font-bold text-white shadow-[3px_3px_0_white] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">Bắt đầu So Khớp CV Miễn phí <ArrowRight size={18} /></Link><Link href="/pricing" className="chunky-secondary px-7 py-4">Xem Gói Diễn tập Phỏng vấn</Link></div></AnimateOnScroll></section>
      </main>

      <Footer />
    </div>
  );
}
