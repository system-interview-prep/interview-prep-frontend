"use client";

import Link from "next/link";
import { BadgeCheck, CreditCard, GitBranch, Mail, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";

const productLinks = [
  ["So khớp Ngữ nghĩa CV–JD", "/interview/cv-score"],
  ["Buồng Luyện Thoại WebRTC", "/voice"],
  ["Tối ưu Live Diff", "/studio"],
  ["Đánh giá Nhanh CV Roast", "/#hero"],
  ["Bảng Phân tích STAR / SPAR", "/interview-summary"],
] as const;
const careerLinks = [
  ["Dành cho Sinh viên & Fresher", "/solutions#students"],
  ["Nhân sự 2–5 năm Kinh nghiệm", "/solutions#seekers"],
  ["Cấp Quản lý & Chuyển ngành", "/solutions#executives"],
  ["Kịch bản Phỏng vấn Data & Product", "/resources?topic=interview"],
  ["Kịch bản Phỏng vấn Kỹ thuật", "/resources?topic=technical"],
] as const;
const knowledgeLinks = [
  ["Trung tâm Tri thức Tuyển dụng", "/resources"],
  ["Giải mã Bộ lọc Thuật toán ATS", "/resources?topic=ats"],
  ["Bảng Giá Gói Chiến Dịch", "/pricing"],
  ["Tuyên ngôn Đạo đức Tuyển dụng", "/solutions"],
  ["Chính sách Bảo mật Dữ liệu", "/resources?topic=privacy"],
] as const;

export default function Footer() {
  const { lang, setLang } = useLanguage();
  const vi = lang === "vi";
  const trust = [
    { icon: ShieldCheck, badge: vi ? "100% Riêng tư" : "100% Private", tone: "bg-[#FCB625]", text: vi ? "Xóa toàn bộ luồng âm thanh ngay sau phiên phỏng vấn. Không lưu trữ giọng nói." : "Voice streams are deleted after every interview. We never retain your voice." },
    { icon: CreditCard, badge: vi ? "Không tự động gia hạn" : "No auto-renewal", tone: "bg-white", text: vi ? "Thanh toán VietQR một lần theo chiến dịch tìm việc. Tuyệt đối không lưu thẻ tín dụng." : "One-time VietQR payments for each job campaign. No credit cards are stored." },
    { icon: BadgeCheck, badge: vi ? "Chuẩn ATS toàn cầu" : "Global ATS standard", tone: "border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]", text: vi ? "Rèn phản xạ và củng cố năng lực thật. Nói không với mọi hình thức nhắc bài gian lận." : "Build real interview skills. We reject deceptive real-time answer assistance." },
  ];

  const share = async () => {
    if (navigator.share) await navigator.share({ title: "Career · Studio", url: window.location.href });
    else await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <footer className="border-t-2 border-[#234196] bg-white text-[#234196]">
      <div className="border-b-2 border-[#234196] bg-[#FEF9EE] px-5 py-7 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {trust.map(({ icon: Icon, badge, tone, text }, index) => (
            <article key={badge} className="rounded-2xl border-2 border-[#234196] bg-white p-5 shadow-[3px_3px_0_#234196]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-[#234196] bg-[#F0F4FC]"><Icon size={19} /></span>
                <div><span className={`sticker ${tone} ${index % 2 ? "rotate-1" : "-rotate-1"}`}>{badge}</span><p className="mt-4 text-sm leading-6 text-[#5A6B8F]">{text}</p></div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 md:py-16 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-4">
          <Link href="/" className="inline-flex items-center gap-2 font-headline text-3xl font-semibold"><span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#234196] bg-[#FCB625] shadow-[2px_2px_0_#234196]"><Sparkles size={18} /></span>Career · Studio</Link>
          <p className="mt-5 max-w-sm leading-7 text-[#5A6B8F]">{vi ? "Nền tảng đối soát ngữ nghĩa CV–JD và diễn tập phỏng vấn phản xạ thời gian thực." : "Semantic CV–JD matching and real-time voice interview practice for ambitious candidates."}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[#234196] bg-white px-3 py-2 shadow-[2px_2px_0_#234196]"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2E7D32]" /><span className="font-metadata text-[9px] font-bold sm:text-[10px]">WebRTC Engine: 420ms · 99.98% Uptime</span></div>
        </div>

        <div className="grid gap-9 sm:grid-cols-3 lg:col-span-8">
          {[
            [vi ? "Sản phẩm & Công cụ" : "Product & Tools", productLinks],
            [vi ? "Giải pháp Nghề nghiệp" : "Career Solutions", careerLinks],
            [vi ? "Tri thức & Minh bạch" : "Knowledge & Trust", knowledgeLinks],
          ].map(([title, links]) => (
            <nav key={String(title)} aria-label={String(title)}>
              <h2 className="font-metadata text-[10px] font-bold">{String(title)}<span className="mt-2 block h-1 w-10 rounded-full bg-[#FCB625]" /></h2>
              <ul className="mt-5 space-y-3">{(links as ReadonlyArray<readonly [string, string]>).map(([label, href]) => <li key={label}><Link href={href} className="text-sm font-medium leading-5 text-[#5A6B8F] transition-colors hover:text-[#234196] hover:underline hover:decoration-[#FCB625] hover:decoration-2 hover:underline-offset-4">{label}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-[#234196] bg-[#F0F4FC] px-5 py-7 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
          <p className="text-xs font-medium text-[#5A6B8F]">© 2026 INTERVIA / CAREER · STUDIO. {vi ? "Tất cả các quyền được bảo lưu." : "All rights reserved."}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold"><Link href="/resources?topic=privacy" className="hover:underline">Chính sách Riêng tư</Link><Link href="/resources?topic=terms" className="hover:underline">Điều khoản Dịch vụ</Link><Link href="/solutions" className="hover:underline">Cam kết Dữ liệu AI</Link><Link href="/resources?topic=cookies" className="hover:underline">Bảo mật & Cookies</Link></div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border-2 border-[#234196] bg-white p-0.5 shadow-[2px_2px_0_#234196]" aria-label="Ngôn ngữ">
              <button type="button" onClick={() => setLang("vi")} className={`rounded-md px-2.5 py-1 text-xs font-bold ${vi ? "bg-[#FCB625]" : "text-[#5A6B8F]"}`}>VN</button>
              <button type="button" onClick={() => setLang("en")} className={`rounded-md px-2.5 py-1 text-xs font-bold ${!vi ? "bg-[#FCB625]" : "text-[#5A6B8F]"}`}>EN</button>
            </div>
            <button type="button" onClick={() => void share()} className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#234196] bg-white shadow-[2px_2px_0_#234196] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5" aria-label="Chia sẻ"><Share2 size={16} /></button>
            <Link href="mailto:hello@intervia.vn" className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#234196] bg-white shadow-[2px_2px_0_#234196] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5" aria-label="Email"><Mail size={16} /></Link>
            <Link href="https://github.com" className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#234196] bg-white shadow-[2px_2px_0_#234196] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5" aria-label="GitHub"><GitBranch size={16} /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
