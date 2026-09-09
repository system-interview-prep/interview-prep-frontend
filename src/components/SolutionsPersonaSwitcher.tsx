"use client";

import { Briefcase, Crown, GraduationCap, TrendingUp } from "lucide-react";
import { useState } from "react";

const personas = [
  { id: "student", label: "Sinh viên", icon: GraduationCap, score: "76%", metric: "CV dự án → thành tựu", note: "Tạo câu chuyện STAR đầu tiên từ đồ án và hoạt động CLB." },
  { id: "mid", label: "2–5 năm", icon: Briefcase, score: "94%", metric: "Tỷ lệ vượt qua ATS", note: "Làm rõ tác động, con số và khoảng trống kỹ năng theo từng JD." },
  { id: "lead", label: "Cấp Quản lý", icon: Crown, score: "+35%", metric: "Lương đàm phán", note: "Định vị năng lực lãnh đạo và luyện panel interview bảo mật." },
] as const;

export function SolutionsPersonaSwitcher() {
  const [active, setActive] = useState<(typeof personas)[number]["id"]>("mid");
  const selected = personas.find((persona) => persona.id === active) ?? personas[1];

  return (
    <div className="storybook-card bg-[#F0F4FC] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="font-metadata text-[10px] font-bold text-[#5A6B8F]">Chọn giai đoạn của bạn</span>
        <span className="sticker rotate-2 bg-[#FCB625]"><TrendingUp size={13} /> Live preview</span>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {personas.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setActive(id)} className={`flex items-center justify-center gap-2 rounded-xl border-2 border-[#234196] px-3 py-3 text-xs font-bold transition-all ${active === id ? "translate-x-0.5 translate-y-0.5 bg-[#FCB625] shadow-none" : "bg-white shadow-[2px_2px_0_#234196] hover:-translate-y-0.5"}`}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border-2 border-[#234196] bg-white p-6">
        <p className="font-headline text-6xl leading-none">{selected.score}</p>
        <p className="mt-2 font-metadata text-[10px] font-bold text-[#2E7D32]">{selected.metric}</p>
        <p className="mt-5 leading-7 text-[#5A6B8F]">{selected.note}</p>
      </div>
    </div>
  );
}
