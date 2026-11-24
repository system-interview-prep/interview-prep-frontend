"use client";

import { Briefcase, Crown, GraduationCap, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

const personas = [
  { id: "student", labelKey: "persona.student.label", icon: GraduationCap, score: "76%", metric: "CV dự án → thành tựu", noteKey: "persona.student.note" },
  { id: "mid", labelKey: "persona.mid.label", icon: Briefcase, score: "94%", metric: "Tỷ lệ vượt qua ATS", noteKey: "persona.mid.note" },
  { id: "lead", labelKey: "persona.lead.label", icon: Crown, score: "+35%", metric: "Lương đàm phán", noteKey: "persona.lead.note" },
] as const;

export function SolutionsPersonaSwitcher() {
  const { t } = useLanguage();
  const [active, setActive] = useState<(typeof personas)[number]["id"]>("mid");
  const selected = personas.find((persona) => persona.id === active) ?? personas[1];

  return (
    <div className="storybook-card bg-[#F0F4FC] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="font-metadata text-[10px] font-bold text-[#5A6B8F]">{t("persona.selectStage")}</span>
        <span className="sticker rotate-2 bg-[#FCB625]"><TrendingUp size={13} /> Live preview</span>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {personas.map(({ id, labelKey, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setActive(id)} className={`flex items-center justify-center gap-2 rounded-xl border-2 border-[#234196] px-3 py-3 text-xs font-bold transition-all ${active === id ? "translate-x-0.5 translate-y-0.5 bg-[#FCB625] shadow-none" : "bg-white shadow-[2px_2px_0_#234196] hover:-translate-y-0.5"}`}>
            <Icon size={17} /> {t(labelKey)}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border-2 border-[#234196] bg-white p-6">
        <p className="font-headline text-6xl leading-none">{selected.score}</p>
        <p className="mt-2 font-metadata text-[10px] font-bold text-[#2E7D32]">{selected.metric}</p>
        <p className="mt-5 leading-7 text-[#5A6B8F]">{t(selected.noteKey)}</p>
      </div>
    </div>
  );
}
